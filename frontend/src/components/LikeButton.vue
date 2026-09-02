<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { likeDog, unlikeDog, getLikes } from '../services/likes'

const props = defineProps<{
    competitionId: string
    dogId: string
}>()

const authStore = useAuthStore()
const count = ref(0)
const liked = ref(false)
const loading = ref(false)
const error = ref('')

async function loadLikes() {
    try {
        const data = await getLikes(props.competitionId, props.dogId)
        count.value = data.count
        liked.value = data.userLiked
    } catch (err) {
        console.error('Failed to load likes:', err)
    }
}

async function toggleLike() {
    if (!authStore.isAuthenticated) {
        error.value = 'Logg inn for å like'
        setTimeout(() => (error.value = ''), 2000)
        return
    }

    loading.value = true
    error.value = ''

    try {
        if (liked.value) {
            await unlikeDog(props.competitionId, props.dogId)
            liked.value = false
            count.value--
        } else {
            await likeDog(props.competitionId, props.dogId)
            liked.value = true
            count.value++
        }
    } catch (err: any) {
        error.value = err.response?.data?.error || 'Noe gikk galt'
    } finally {
        loading.value = false
    }
}

onMounted(loadLikes)
</script>

<template>
    <div class="like-button">
        <button @click="toggleLike" :disabled="loading" :class="['like-btn', { liked: liked }]">
            <span class="heart">{{ liked ? '❤️' : '🤍' }}</span>
            <span class="count">{{ count }}</span>
        </button>
        <p v-if="error" class="error">{{ error }}</p>
    </div>
</template>

<style scoped>
.like-button {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
}

.like-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: var(--bg-white);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 0.875rem;
}

.like-btn:hover:not(:disabled) {
    background: var(--bg-primary);
    border-color: var(--border-medium);
}

.like-btn.liked {
    background: #fef2f2;
    border-color: #fecaca;
}

.heart {
    font-size: 1rem;
}

.count {
    font-weight: 500;
    color: var(--text-secondary);
}

.liked .count {
    color: #dc2626;
}

.error {
    font-size: 0.75rem;
    color: var(--error);
    margin-top: 0.25rem;
}
</style>
