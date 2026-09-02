<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Dog, HighlightDog } from '@/types'
import api from '@/services/api'
import ImageModal from '@/components/ImageModal.vue'
import DogBadgeList from '@/components/DogBadgeList.vue'
import { deleteDog, getDogHighlights } from '@/services/dogs'

const authStore = useAuthStore()
const dogs = ref<Dog[]>([])
const editingDog = ref<Dog | null>(null)
const badgeDogs = ref<HighlightDog[]>([])
const actionError = ref('')
const deletingDogId = ref('')

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

onMounted(async () => {
    const response = await api.get<{ dogs: Dog[] }>('/dogs')
    dogs.value = response.data.dogs
    try {
        const highlights = await getDogHighlights()
        badgeDogs.value = highlights.allDogs
    } catch (error) {
        console.error('Failed to load dog badges:', error)
    }
})

const userDogs = computed(() =>
    dogs.value
        .filter((dog) => dog.ownerId === authStore.user?.id)
        .sort((a, b) => a.name.localeCompare(b.name))
)

const badgeByDogId = computed(() =>
    Object.fromEntries(badgeDogs.value.map((dog) => [dog.id, dog.badges]))
)

function dogInitials(name: string) {
    return name.slice(0, 2).toUpperCase()
}

function startEdit(dog: Dog) {
    editingDog.value = { ...dog }
}

function cancelEdit() {
    editingDog.value = null
}

async function saveEdit() {
    if (!editingDog.value) return
    const { id, name, breed, description, imageUrl } = editingDog.value

    try {
        const response = await api.put<Dog>(`/dogs/${id}`, {
            name,
            breed,
            description,
            imageUrl
        })

        const index = dogs.value.findIndex((d) => d.id === id)
        if (index !== -1) dogs.value[index] = response.data
        editingDog.value = null
    } catch (error) {
        alert('Failed to update dog')
    }
}

async function removeDog(dog: Dog) {
    if (deletingDogId.value) return
    if (!confirm(`Slette ${dog.name}? Dette fjerner ogsa likes, kommentarer og paameldinger.`)) {
        return
    }

    deletingDogId.value = dog.id
    actionError.value = ''

    try {
        await deleteDog(dog.id)
        dogs.value = dogs.value.filter((item) => item.id !== dog.id)
        badgeDogs.value = badgeDogs.value.filter((item) => item.id !== dog.id)
    } catch (error: any) {
        actionError.value = error.response?.data?.error || 'Kunne ikke slette hunden'
    } finally {
        deletingDogId.value = ''
    }
}
</script>

<template>
    <div class="dogs">
        <h2>Mine hunder</h2>
        <p>Oversikt over hundeprofiler</p>
        <p v-if="actionError" class="error">{{ actionError }}</p>

        <ul class="dogs-list">
            <li v-for="dog in userDogs" :key="dog.id" class="dog-card">
                <template v-if="editingDog?.id === dog.id">
                    <div class="dog-head">
                        <div class="dog-avatar">
                            <img
                                v-if="editingDog.imageUrl"
                                :src="editingDog.imageUrl"
                                :alt="dog.name"
                            />
                            <span v-else>{{ dogInitials(editingDog.name || dog.name) }}</span>
                        </div>
                        <input v-model="editingDog.name" placeholder="Name" />
                    </div>
                    <input v-model="editingDog.breed" placeholder="Breed" />
                    <textarea v-model="editingDog.description" placeholder="Description" />
                    <input v-model="editingDog.imageUrl" placeholder="Image URL" />
                    <div class="row">
                        <button @click="saveEdit">Save</button>
                        <button @click="cancelEdit">Cancel</button>
                    </div>
                </template>
                <template v-else>
                    <div class="dog-head">
                        <div
                            class="dog-avatar clickable-avatar"
                            @click="dog.imageUrl && openImageModal(dog.imageUrl, dog.name)"
                        >
                            <img v-if="dog.imageUrl" :src="dog.imageUrl" :alt="dog.name" />
                            <span v-else>{{ dogInitials(dog.name) }}</span>
                        </div>
                        <h4>{{ dog.name }}</h4>
                    </div>
                    <p>{{ dog.description }}</p>
                    <button @click="startEdit(dog)">Edit</button>
                    <button
                        class="danger-btn"
                        :disabled="deletingDogId === dog.id"
                        @click="removeDog(dog)"
                    >
                        {{ deletingDogId === dog.id ? 'Sletter...' : 'Slett hund' }}
                    </button>
                    <DogBadgeList :badges="badgeByDogId[dog.id] || []" compact />
                </template>
            </li>
        </ul>

        <RouterLink to="/createDogs">Create New Dog</RouterLink>

        <ImageModal
            :image-url="modalImage.url"
            :alt-text="modalImage.alt"
            :is-open="modalImage.isOpen"
            @close="closeImageModal"
        />
    </div>
</template>

<style scoped>
.dogs {
    max-width: 800px;
    margin: 0 auto;
}

.dogs-list {
    list-style: none;
    margin: var(--space-sm) 0;
    padding: 0;
    display: grid;
    gap: var(--space-sm);
}

.dog-card {
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
    background: var(--bg-white);
}

.dog-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.dog-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
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

.dog-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.row {
    display: flex;
    gap: 0.5rem;
}

.danger-btn {
    margin-left: 0.5rem;
    background: var(--error-bg);
    color: var(--error);
}

.error {
    color: var(--error);
    margin-bottom: var(--space-sm);
}
</style>
