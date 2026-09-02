<template>
    <div class="my-profile">
        <div class="header">
            <h2>Min profil</h2>
            <p>Her kan du oppdatere profilbilde og se egne hunder.</p>
        </div>

        <section class="profile-panel">
            <p v-if="!authStore.user" class="muted">Du må være logget inn for å se denne siden.</p>
            <p v-else-if="isLoadingProfile">Laster profil...</p>
            <p v-else-if="profileError" class="error">{{ profileError }}</p>
            <div v-else-if="selectedProfile" class="profile-content">
                <div class="profile-head">
                    <div
                        class="avatar avatar-lg clickable-avatar"
                        @click="
                            selectedProfile.imageUrl &&
                                openImageModal(
                                    selectedProfile.imageUrl,
                                    selectedProfile.username
                                )
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
                        <p class="muted">
                            Telefon:
                            {{ selectedProfile.phoneNumber || 'Ikke registrert' }}
                        </p>
                    </div>
                </div>

                <div class="avatar-editor">
                    <label for="avatarUrl">Profilbilde (URL)</label>
                    <div class="row">
                        <input
                            id="avatarUrl"
                            v-model="avatarUrlInput"
                            type="url"
                            placeholder="https://..."
                        />
                        <button type="button" @click="saveAvatar" :disabled="isSavingAvatar">
                            {{ isSavingAvatar ? 'Lagrer...' : 'Lagre' }}
                        </button>
                    </div>
                    <p v-if="avatarMessage" class="muted">{{ avatarMessage }}</p>
                    <div class="credentials-editor">
                        <h4>Endre innloggingsinfo</h4>
                        <form @submit.prevent="saveCredentials">
                            <div class="form-group">
                                <label for="currentPassword">Nåværende passord</label>
                                <input
                                    id="currentPassword"
                                    v-model="currentPassword"
                                    type="password"
                                    required
                                    placeholder="Påkrevd for alle endringer"
                                />
                            </div>
                            <div class="form-group">
                                <label for="newEmail">Ny e-post (valgfritt)</label>
                                <input
                                    id="newEmail"
                                    v-model="newEmail"
                                    type="email"
                                    :placeholder="selectedProfile.email"
                                />
                            </div>
                            <div class="form-group">
                                <label for="newPassword">Nytt passord (valgfritt)</label>
                                <input id="newPassword" v-model="newPassword" type="password" />
                            </div>
                            <div class="form-group">
                                <label for="confirmPassword">Bekreft nytt passord</label>
                                <input
                                    id="confirmPassword"
                                    v-model="confirmPassword"
                                    type="password"
                                />
                            </div>
                            <p
                                v-if="credentialsMessage"
                                :class="credentialsSuccess ? 'success' : 'error'"
                            >
                                {{ credentialsMessage }}
                            </p>
                            <button
                                type="submit"
                                :disabled="isSavingCredentials || !currentPassword"
                            >
                                {{ isSavingCredentials ? 'Lagrer...' : 'Lagre endringer' }}
                            </button>
                        </form>
                    </div>
                </div>

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

        <ImageModal
            :image-url="modalImage.url"
            :alt-text="modalImage.alt"
            :is-open="modalImage.isOpen"
            @close="closeImageModal"
        />
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { UserProfile } from '@/types'
import { getUserProfile, updateUserAvatar } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import ImageModal from '@/components/ImageModal.vue'

const authStore = useAuthStore()
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


const selectedProfile = ref<UserProfile | null>(null)
const isLoadingProfile = ref(false)
const profileError = ref('')
const avatarUrlInput = ref('')
const isSavingAvatar = ref(false)
const avatarMessage = ref('')

function formatDate(date: Date): string {
    return date.toLocaleDateString('no-NO')
}

function userInitials(name: string): string {
    return name.slice(0, 2).toUpperCase()
}

function dogInitials(name: string): string {
    return name.slice(0, 2).toUpperCase()
}

async function loadOwnProfile() {
    if (!authStore.user?.id) {
        selectedProfile.value = null
        return
    }

    isLoadingProfile.value = true
    profileError.value = ''

    try {
        selectedProfile.value = await getUserProfile(authStore.user.id)
        avatarUrlInput.value = selectedProfile.value.imageUrl || ''
    } catch (error) {
        console.error('Could not load own profile', error)
        profileError.value = 'Kunne ikke laste brukerprofil.'
        selectedProfile.value = null
    } finally {
        isLoadingProfile.value = false
    }
}

async function saveAvatar() {
    if (!selectedProfile.value) return

    isSavingAvatar.value = true
    avatarMessage.value = ''

    try {
        const user = await updateUserAvatar(selectedProfile.value.id, avatarUrlInput.value)
        selectedProfile.value = {
            ...selectedProfile.value,
            imageUrl: user.imageUrl || null
        }
        authStore.setUserAvatar(user.imageUrl || null)
        avatarMessage.value = 'Profilbilde lagret.'
    } catch (error) {
        console.error('Could not save avatar', error)
        avatarMessage.value = 'Kunne ikke lagre profilbilde.'
    } finally {
        isSavingAvatar.value = false
    }
}

const currentPassword = ref('')
const newEmail = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isSavingCredentials = ref(false)
const credentialsMessage = ref('')
const credentialsSuccess = ref(false)

async function saveCredentials() {
    credentialsMessage.value = ''
    credentialsSuccess.value = false

    if (newPassword.value && newPassword.value !== confirmPassword.value) {
        credentialsMessage.value = 'Passordene stemmer ikke overens'
        return
    }

    if (!newEmail.value && !newPassword.value) {
        credentialsMessage.value = 'Fyll inn ny e-post og/eller nytt passord'
        return
    }

    isSavingCredentials.value = true
    try {
        const res = await fetch(
            `http://localhost:3000/api/users/${selectedProfile.value!.id}/credentials`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authStore.token}`
                },
                body: JSON.stringify({
                    currentPassword: currentPassword.value,
                    newEmail: newEmail.value || undefined,
                    newPassword: newPassword.value || undefined
                })
            }
        )

        const data = await res.json()
        if (!res.ok) {
            credentialsMessage.value = data.error || 'Noe gikk galt'
            return
        }

        if (newEmail.value && authStore.user) {
            authStore.user.email = data.user.email
            selectedProfile.value = { ...selectedProfile.value!, email: data.user.email }
        }

        credentialsSuccess.value = true
        credentialsMessage.value = 'Endringer lagret!'
        currentPassword.value = ''
        newEmail.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
    } catch {
        credentialsMessage.value = 'Noe gikk galt'
    } finally {
        isSavingCredentials.value = false
    }
}

onMounted(async () => {
    await loadOwnProfile()
})
</script>

<style scoped>
.my-profile {
    max-width: 900px;
    margin: 0 auto;
    padding: var(--space-lg) var(--space-md);
}

.header p {
    color: var(--text-secondary);
}

.profile-panel {
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    background: var(--bg-white);
    padding: var(--space-md);
    margin-top: var(--space-md);
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
    transition: transform 0.2s, opacity 0.2s;
}

.clickable-avatar:hover {
    transform: scale(1.05);
    opacity: 0.9;
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

.error {
    color: var(--error);
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

.credentials-editor {
    margin-top: var(--space-sm);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
}

.credentials-editor h4 {
    margin-bottom: var(--space-sm);
}

.form-group {
    margin-bottom: var(--space-sm);
}

.form-group label {
    display: block;
    margin-bottom: 0.3rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.success {
    color: var(--success);
    font-size: 0.88rem;
    margin-bottom: var(--space-xs);
}
</style>
