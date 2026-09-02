<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { UserListItem } from '@/types'
import { getUsers } from '@/services/users'
import ImageModal from '@/components/ImageModal.vue'

const users = ref<UserListItem[]>([])
const isLoading = ref(false)
const loadError = ref('')

const admins = computed(() => users.value.filter((user) => user.role === 'ADMIN'))

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

function initials(name: string): string {
    return name.slice(0, 2).toUpperCase()
}

async function loadAdmins() {
    isLoading.value = true
    loadError.value = ''
    try {
        users.value = await getUsers()
    } catch (error) {
        console.error('Failed to load contacts', error)
        loadError.value = 'Kunne ikke laste kontaktinformasjon.'
    } finally {
        isLoading.value = false
    }
}

onMounted(async () => {
    await loadAdmins()
})
</script>

<template>
    <div class="contact-page">
        <section class="hero card">
            <h2>Kontakt oss</h2>
            <p>
                Ta kontakt med administratorene hvis du trenger hjelp med konkurranser eller
                profiler.
            </p>
        </section>

        <p v-if="isLoading" class="muted">Laster kontaktpersoner...</p>
        <p v-else-if="loadError" class="error">{{ loadError }}</p>

        <section v-else class="contacts-grid">
            <article v-for="admin in admins" :key="admin.id" class="contact-card card">
                <div
                    class="avatar clickable-avatar"
                    @click="admin.imageUrl && openImageModal(admin.imageUrl, admin.username)"
                >
                    <img v-if="admin.imageUrl" :src="admin.imageUrl" :alt="admin.username" />
                    <span v-else>{{ initials(admin.username) }}</span>
                </div>
                <h3>{{ admin.username }}</h3>
                <p class="role-chip">Administrator</p>
                <p><strong>E-post:</strong> {{ admin.email }}</p>
                <p><strong>Telefon:</strong> {{ admin.phoneNumber || 'Ikke registrert' }}</p>
            </article>
        </section>

        <ImageModal
            :image-url="modalImage.url"
            :alt-text="modalImage.alt"
            :is-open="modalImage.isOpen"
            @close="closeImageModal"
        />
    </div>
</template>

<style scoped>
.contact-page {
    display: grid;
    gap: 1rem;
}

.hero {
    text-align: center;
}

.contacts-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
}

.contact-card {
    text-align: center;
}

.avatar {
    width: 72px;
    height: 72px;
    margin: 0 auto 0.7rem;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent);
    color: #fff;
    font-weight: 700;
}

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.clickable-avatar {
    cursor: pointer;
    transition: transform 0.2s;
}

.clickable-avatar:hover {
    transform: scale(1.05);
}

.role-chip {
    display: inline-block;
    margin: 0.2rem 0 0.55rem;
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-size: 0.82rem;
    font-weight: 700;
}

.muted {
    color: var(--text-secondary);
}

.error {
    color: var(--error);
}

@media (max-width: 780px) {
    .contacts-grid {
        grid-template-columns: 1fr;
    }
}
</style>
