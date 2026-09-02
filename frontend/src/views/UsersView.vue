<template>
    <div class="users-view">
        <div class="header">
            <h2>Brukere</h2>
            <p>Søk etter brukernavn eller velg direkte fra listen.</p>
        </div>

        <div class="layout">
            <aside class="users-panel">
                <input
                    v-model="searchQuery"
                    list="users-usernames"
                    type="text"
                    placeholder="Søk på brukernavn"
                />
                <datalist id="users-usernames">
                    <option v-for="user in users" :key="user.id" :value="user.username" />
                </datalist>

                <ul class="users-list">
                    <li v-for="user in filteredUsers" :key="user.id">
                        <button
                            class="user-item"
                            :class="{ active: selectedUserId === user.id }"
                            type="button"
                            @click="selectUser(user.id)"
                        >
                            <div class="user-item-head">
                                <div
                                    class="avatar avatar-sm clickable-avatar"
                                    @click.stop="
                                        user.imageUrl &&
                                        openImageModal(user.imageUrl, user.username)
                                    "
                                >
                                    <img
                                        v-if="user.imageUrl"
                                        :src="user.imageUrl"
                                        :alt="user.username"
                                    />
                                    <span v-else>{{ userInitials(user.username) }}</span>
                                </div>
                                <span>{{ user.username }}</span>
                            </div>
                            <small>{{ user.role }} · {{ user.dogsCount }} hunder</small>
                        </button>
                    </li>
                </ul>
            </aside>

            <section class="profile-panel">
                <p v-if="profileError" class="error">{{ profileError }}</p>
                <p v-else-if="!selectedProfile">Velg en bruker for å se profil.</p>
                <div v-else class="profile-content" :class="{ loading: isLoadingProfile }">
                    <div v-if="isLoadingProfile" class="loading-chip">Oppdaterer profil...</div>
                    <div class="profile-head">
                        <div
                            class="avatar avatar-lg clickable-avatar"
                            @click="
                                selectedProfile.imageUrl &&
                                openImageModal(selectedProfile.imageUrl, selectedProfile.username)
                            "
                        >
                            <img
                                v-if="selectedProfile.imageUrl"
                                :src="selectedProfile.imageUrl"
                                :alt="selectedProfile.username"
                            />
                            <span v-else>{{ userInitials(selectedProfile.username) }}</span>
                        </div>
                        <div>
                            <h3>{{ selectedProfile.username }}</h3>
                            <p class="muted">
                                E-post: {{ selectedProfile.email }} · Rolle:
                                {{ selectedProfile.role }} · Registrert:
                                {{ formatDate(selectedProfile.createdAt) }}
                            </p>
                            <button
                                v-if="isAdmin && selectedProfile.imageUrl"
                                type="button"
                                class="moderation-btn"
                                @click="removeUserAvatar"
                                :disabled="isModerating"
                            >
                                Fjern profilbilde
                            </button>
                        </div>
                    </div>

                    <p v-if="moderationMessage" class="muted moderation-message">
                        {{ moderationMessage }}
                    </p>

                    <div v-if="selectedProfile.dogs.length === 0" class="empty-card">
                        Ingen registrerte hunder.
                    </div>

                    <div v-for="dog in selectedProfile.dogs" :key="dog.id" class="dog-card">
                        <div class="dog-head">
                            <div
                                class="avatar avatar-dog clickable-avatar"
                                @click="dog.imageUrl && openImageModal(dog.imageUrl, dog.name)"
                            >
                                <img v-if="dog.imageUrl" :src="dog.imageUrl" :alt="dog.name" />
                                <span v-else>{{ dogInitials(dog.name) }}</span>
                            </div>
                            <h4>{{ dog.name }} ({{ dog.breed }})</h4>
                        </div>
                        <p>{{ dog.description }}</p>
                        <DogBadgeList :badges="badgesForDog(dog.id)" compact />
                        <button
                            v-if="isAdmin && dog.description.trim().length > 0"
                            type="button"
                            class="moderation-btn"
                            @click="removeDogDescription(dog.id)"
                            :disabled="isModerating"
                        >
                            Fjern beskrivelse
                        </button>
                        <p class="muted">
                            Opprettet {{ formatDate(dog.createdAt) }} · Oppdatert
                            {{ formatDate(dog.updatedAt) }}
                        </p>

                        <h5>Konkurranser</h5>
                        <p v-if="dog.competitionEntries.length === 0" class="muted">
                            Ikke påmeldt konkurranser ennå.
                        </p>
                        <ul v-else class="competition-list">
                            <li v-for="entry in dog.competitionEntries" :key="entry.id">
                                <span>{{ entry.competition.name }}</span>
                                <small>
                                    {{ formatDate(entry.competition.startDate) }} -
                                    {{ formatDate(entry.competition.endDate) }}
                                    ({{ entry.competition.status }})
                                </small>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>

        <ImageModal
            :image-url="modalImage.url"
            :alt-text="modalImage.alt"
            :is-open="modalImage.isOpen"
            @close="closeImageModal"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { HighlightDog, UserListItem, UserProfile } from '@/types'
import { getUserProfile, getUsers } from '@/services/users'
import { clearDogDescription, clearUserAvatar } from '@/services/admin'
import { getDogHighlights } from '@/services/dogs'
import { useAuthStore } from '@/stores/auth'
import ImageModal from '@/components/ImageModal.vue'
import DogBadgeList from '@/components/DogBadgeList.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const users = ref<UserListItem[]>([])
const searchQuery = ref('')
const selectedProfile = ref<UserProfile | null>(null)
const isLoadingProfile = ref(false)
const profileError = ref('')
const isModerating = ref(false)
const moderationMessage = ref('')
const dogHighlights = ref<HighlightDog[]>([])

const modalImage = ref({
    url: '',
    alt: '',
    isOpen: false
})

function openImageModal(url: string, alt: string) {
    modalImage.value = { url, alt, isOpen: true }
}

function closeImageModal() {
    modalImage.value = { url: '', alt: '', isOpen: false }
}

const selectedUserId = computed(() => {
    const userId = route.query.userId
    return typeof userId === 'string' ? userId : ''
})

const isAdmin = computed(() => authStore.isAdmin)

const filteredUsers = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) {
        return users.value
    }
    return users.value.filter((user) => user.username.toLowerCase().includes(query))
})

function formatDate(date: Date): string {
    return date.toLocaleDateString('no-NO')
}

function userInitials(name: string): string {
    return name.slice(0, 2).toUpperCase()
}

function dogInitials(name: string): string {
    return name.slice(0, 2).toUpperCase()
}

function badgesForDog(dogId: string) {
    return dogHighlights.value.find((dog) => dog.id === dogId)?.badges || []
}

async function loadUsers() {
    users.value = await getUsers()

    if (!selectedUserId.value && users.value.length > 0) {
        await selectUser(users.value[0].id)
    }
}

async function loadProfile(userId: string) {
    if (!userId) {
        selectedProfile.value = null
        return
    }

    isLoadingProfile.value = true
    profileError.value = ''

    try {
        selectedProfile.value = await getUserProfile(userId)
    } catch (error) {
        console.error('Could not load user profile', error)
        profileError.value = 'Kunne ikke laste brukerprofil.'
        selectedProfile.value = null
    } finally {
        isLoadingProfile.value = false
    }
}

async function removeUserAvatar() {
    if (!selectedProfile.value?.imageUrl) return
    if (!confirm('Fjerne profilbildet til denne brukeren?')) return

    isModerating.value = true
    moderationMessage.value = ''

    try {
        await clearUserAvatar(selectedProfile.value.id)
        selectedProfile.value = {
            ...selectedProfile.value,
            imageUrl: null
        }
        moderationMessage.value = 'Profilbildet ble fjernet.'
    } catch (error) {
        console.error('Could not remove user avatar', error)
        moderationMessage.value = 'Kunne ikke fjerne profilbildet.'
    } finally {
        isModerating.value = false
    }
}

async function removeDogDescription(dogId: string) {
    if (!selectedProfile.value) return
    if (!confirm('Fjerne beskrivelsen til denne hunden?')) return

    isModerating.value = true
    moderationMessage.value = ''

    try {
        await clearDogDescription(dogId)
        selectedProfile.value = {
            ...selectedProfile.value,
            dogs: selectedProfile.value.dogs.map((dog) =>
                dog.id === dogId ? { ...dog, description: '' } : dog
            )
        }
        moderationMessage.value = 'Hundebeskrivelsen ble fjernet.'
    } catch (error) {
        console.error('Could not remove dog description', error)
        moderationMessage.value = 'Kunne ikke fjerne hundebeskrivelsen.'
    } finally {
        isModerating.value = false
    }
}

async function selectUser(userId: string) {
    await router.replace({
        query: {
            ...route.query,
            userId
        }
    })
}

watch(
    () => selectedUserId.value,
    async (userId) => {
        await loadProfile(userId)
    },
    { immediate: true }
)

onMounted(async () => {
    await loadUsers()
    try {
        const highlights = await getDogHighlights()
        dogHighlights.value = highlights.allDogs
    } catch (error) {
        console.error('Failed to load dog highlights:', error)
    }
})
</script>

<style scoped>
.users-view {
    max-width: 1100px;
    margin: 0 auto;
    padding: var(--space-lg) var(--space-md);
}

.header p {
    color: var(--text-secondary);
}

.layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: var(--space-md);
    margin-top: var(--space-md);
}

.users-panel,
.profile-panel {
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    background: var(--bg-white);
    padding: var(--space-md);
}

.users-panel {
    max-height: min(70vh, 760px);
    overflow-y: scroll;
}

.profile-panel {
    min-height: 640px;
    max-height: min(70vh, 760px);
    overflow-y: scroll;
}

.profile-content {
    position: relative;
    min-height: 100%;
}

.profile-content.loading {
    opacity: 0.92;
}

.loading-chip {
    position: absolute;
    top: 0.15rem;
    right: 0.15rem;
    z-index: 2;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--accent-strong);
    background: var(--accent-soft);
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
}

.users-list {
    margin: var(--space-sm) 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.5rem;
}

.user-item {
    width: 100%;
    text-align: left;
    display: grid;
    gap: 0.2rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-light);
    color: var(--text-primary);
}

.user-item-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.user-item.active {
    border-color: var(--accent);
    background: var(--accent-light);
}

.user-item small {
    color: var(--text-secondary);
}

.profile-head {
    display: flex;
    gap: var(--space-sm);
    align-items: center;
}

.avatar {
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent);
    color: #fff;
    font-weight: 700;
    flex-shrink: 0;
}

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.clickable-avatar {
    cursor: pointer;
    transition:
        transform 0.2s,
        opacity 0.2s;
}

.clickable-avatar:hover {
    transform: scale(1.05);
    opacity: 0.9;
}

.avatar-sm {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
}

.avatar-lg {
    width: 56px;
    height: 56px;
}

.avatar-dog {
    width: 48px;
    height: 48px;
}

.avatar-editor {
    margin-top: var(--space-sm);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
}

.row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.row input {
    flex: 1;
}

.muted {
    color: var(--text-secondary);
}

.moderation-message {
    margin-top: var(--space-sm);
}

.error {
    color: var(--error);
}

.moderation-btn {
    margin-top: 0.5rem;
}

.dog-card,
.empty-card {
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
    margin-top: var(--space-sm);
    background: var(--bg-primary);
}

.dog-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.dog-card h4,
.dog-card h5 {
    margin-bottom: 0.35rem;
}

.competition-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.35rem;
}

.competition-list li {
    display: grid;
}

@media (max-width: 900px) {
    .layout {
        grid-template-columns: 1fr;
    }

    .users-panel,
    .profile-panel {
        min-height: 0;
        max-height: none;
        overflow: visible;
    }
}
</style>
