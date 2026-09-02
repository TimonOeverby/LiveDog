<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const breed = ref('')
const description = ref('')
const imageUrl = ref('')
const errorMsg = ref('')

const handleSubmit = async () => {
    errorMsg.value = ''

    if (!authStore.user?.id) {
        errorMsg.value = 'Du maa vaere logget inn for aa opprette hund.'
        return
    }

    try {
        await api.post('/dogs', {
            name: name.value,
            breed: breed.value,
            description: description.value,
            imageUrl: imageUrl.value
        })
        router.push('/dogs')
    } catch (error: any) {
        errorMsg.value = error.response?.data?.error || 'Kunne ikke lagre hunden.'
    }
}
</script>

<template>
    <div class="dogs">
        <h2>Lag ny hund</h2>
        <form @submit.prevent="handleSubmit">
            <div class="form-group">
                <label for="name">Navn:</label>
                <input for="name" v-model="name" type="name" required />
            </div>
            <div class="form-group">
                <label for="breed">rase:</label>
                <input for="breed" v-model="breed" type="Breed" required />
            </div>
            <div class="form-group">
                <label for="description">Andre detaljer:</label>
                <input for="description" v-model="description" type="description" required />
            </div>
            <div class="form-group">
                <label for="imageUrl">Bilde-URL (valgfritt):</label>
                <input id="imageUrl" v-model="imageUrl" type="url" placeholder="https://..." />
            </div>

            <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
            <button type="submit">Opprett hund</button>
        </form>
    </div>
</template>

<style scoped>
.dogs {
    max-width: 800px;
    margin: 0 auto;
}

.form-group {
    margin-bottom: 1rem;
}

.error-message {
    color: var(--error);
    margin-bottom: 0.5rem;
}
</style>
