<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { advertisementService, type Advertisement } from '../services/advertisements'

const authStore = useAuthStore()

const currentAds = ref<Advertisement[]>([])
const previewImage = ref<string | null>(null)
const followsCursor = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const isLoading = ref(false)

onMounted(async () => {
    if (authStore.isAdmin) {
        await loadCurrentAd()
    }
})

async function loadCurrentAd() {
    try {
        currentAds.value = await advertisementService.getActiveList()
    } catch (error) {
        console.error('Failed to load current ad:', error)
    }
}

function onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
        previewImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
    // Reset checkbox when new file is selected
    followsCursor.value = false
}

async function publishAd() {
    if (!previewImage.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
        await advertisementService.create(previewImage.value, followsCursor.value)
        previewImage.value = null
        followsCursor.value = false
        if (fileInput.value) fileInput.value.value = ''
        successMessage.value = 'Annonse publisert!'
        await loadCurrentAd() // Refresh the admin preview
        window.dispatchEvent(new Event('advertisement:updated'))
        setTimeout(() => (successMessage.value = null), 3000)
    } catch (error: any) {
        errorMessage.value = error.response?.data?.error || 'Kunne ikke publisere annonse'
        setTimeout(() => (errorMessage.value = null), 5000)
    } finally {
        isLoading.value = false
    }
}

async function removeAd(id: string) {
    isLoading.value = true
    errorMessage.value = null

    try {
        await advertisementService.delete(id)
        previewImage.value = null
        if (fileInput.value) fileInput.value.value = ''
        successMessage.value = 'Annonse fjernet!'
        await loadCurrentAd() // Check if there are other ads
        window.dispatchEvent(new Event('advertisement:updated'))
        setTimeout(() => (successMessage.value = null), 3000)
    } catch (error: any) {
        errorMessage.value = error.response?.data?.error || 'Kunne ikke fjerne annonse'
        setTimeout(() => (errorMessage.value = null), 5000)
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="ad-page">
        <!-- Admin CMS panel -->
        <section v-if="authStore.isAdmin" class="cms-panel">
            <h2>Administrer annonse</h2>

            <div class="upload-area">
                <label class="upload-label" for="ad-upload">
                    <span>Velg bilde</span>
                    <input
                        id="ad-upload"
                        ref="fileInput"
                        type="file"
                        accept="image/*"
                        @change="onFileChange"
                    />
                </label>
            </div>

            <div v-if="previewImage" class="preview">
                <p class="preview-label">Forhåndsvisning</p>
                <img :src="previewImage" alt="Forhåndsvisning" class="preview-img" />

                <div class="ad-options">
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="followsCursor" />
                        <span>Følg musepeker (aggressiv)</span>
                    </label>
                </div>

                <button class="btn btn-primary" @click="publishAd" :disabled="isLoading">
                    {{ isLoading ? 'Publiserer...' : 'Publiser annonse' }}
                </button>
            </div>

            <div v-if="successMessage" class="success-msg">{{ successMessage }}</div>
            <div v-if="errorMessage" class="error-msg">{{ errorMessage }}</div>

            <div v-if="currentAds.length > 0" class="current-ad-section">
                <p class="preview-label">Aktive annonser</p>

                <div v-for="ad in currentAds" :key="ad.id" class="active-ad-item">
                    <img :src="ad.imageData" alt="Aktiv annonse" class="preview-img" />

                    <div v-if="ad.followsCursor" class="ad-settings">
                        <span class="setting-badge">🎯 Følger musepeker</span>
                    </div>

                    <button class="btn btn-danger" @click="removeAd(ad.id)" :disabled="isLoading">
                        {{ isLoading ? 'Fjerner...' : 'Fjern annonse' }}
                    </button>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.ad-page {
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 1.5rem;
}

.cms-panel {
    background: var(--bg-white);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    padding: 2rem;
    margin-bottom: 2rem;
}

.cms-panel h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: var(--text-primary);
}

.upload-area {
    margin-bottom: 1.5rem;
}

.upload-label {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    border: 2px dashed var(--border-light);
    border-radius: var(--radius-md);
    padding: 2rem 3rem;
    cursor: pointer;
    width: 100%;
    text-align: center;
    color: var(--text-secondary, #7f8c8d);
    transition: border-color 0.15s ease;
}

.upload-label:hover {
    border-color: var(--accent);
}

.upload-label input {
    display: none;
}

.preview-label {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
}

.preview {
    margin-bottom: 1.5rem;
}

.ad-options {
    margin: 1rem 0;
    padding: 1rem;
    background: var(--bg-primary, #f8f9fa);
    border-radius: var(--radius-md);
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--text-primary);
}

.checkbox-label input[type='checkbox'] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.checkbox-label span {
    font-size: 0.9375rem;
    user-select: none;
}

.preview-img {
    display: block;
    max-width: 100%;
    max-height: 300px;
    border-radius: var(--radius-md);
    margin-bottom: 1rem;
    object-fit: contain;
}

.current-ad-section {
    border-top: 1px solid var(--border-light);
    padding-top: 1.5rem;
}

.active-ad-item {
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 1rem;
    margin-bottom: 1rem;
}

.ad-settings {
    margin: 1rem 0;
}

.setting-badge {
    display: inline-block;
    padding: 0.375rem 0.75rem;
    background-color: #fff3cd;
    color: #856404;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
}

.btn {
    padding: 0.5rem 1.25rem;
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.btn-primary {
    background-color: var(--accent);
    color: white;
}

.btn-primary:hover {
    background-color: var(--accent-hover);
}

.btn-danger {
    background-color: var(--error-bg, #fdecea);
    color: var(--error, #c0392b);
}

.btn-danger:hover {
    background-color: var(--error, #c0392b);
    color: white;
}

.success-msg {
    background-color: #e9f7ef;
    color: #1e8449;
    border-radius: var(--radius-md);
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
}

.error-msg {
    background-color: #fdecea;
    color: #c0392b;
    border-radius: var(--radius-md);
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
