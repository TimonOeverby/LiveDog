<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { advertisementService, type Advertisement } from '../services/advertisements'

const ads = ref<Advertisement[]>([])
const isLoading = ref(true)
const mouseX = ref(0)
const mouseY = ref(0)

const staticAds = computed(() => ads.value.filter((ad) => !ad.followsCursor))
const cursorAds = computed(() => ads.value.filter((ad) => ad.followsCursor))

function handleMouseMove(event: MouseEvent) {
    if (cursorAds.value.length > 0) {
        mouseX.value = event.clientX
        mouseY.value = event.clientY
    }
}

function handleAdvertisementUpdated() {
    void loadAd()
}

onMounted(async () => {
    await loadAd()
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('advertisement:updated', handleAdvertisementUpdated)
})

onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('advertisement:updated', handleAdvertisementUpdated)
})

async function loadAd() {
    isLoading.value = true
    try {
        ads.value = await advertisementService.getActiveList()
    } catch (error) {
        console.error('Failed to load advertisement:', error)
        ads.value = []
    } finally {
        isLoading.value = false
    }
}

// Expose loadAd so parent can trigger refresh
defineExpose({
    refresh: loadAd
})
</script>

<template>
    <div v-if="ads.length > 0" class="ads-wrapper">
        <div v-for="ad in staticAds" :key="ad.id" class="ad-display">
            <img :src="ad.imageData" alt="Annonse" class="ad-img" />
        </div>

        <div
            v-for="ad in cursorAds"
            :key="ad.id"
            class="ad-display cursor-ad"
            :style="{
                left: `${mouseX + 20}px`,
                top: `${mouseY + 20}px`
            }"
        >
            <img :src="ad.imageData" alt="Annonse" class="ad-img" />
        </div>
    </div>
    <div v-else-if="!isLoading" class="no-ad">
        <p>Ingen aktiv annonse for øyeblikket.</p>
    </div>
</template>

<style scoped>
.ads-wrapper {
    display: grid;
    gap: 0.9rem;
    margin-top: 0.5rem;
}

.ad-display {
    text-align: center;
    transition: all 0.05s ease-out;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-light);
    background: var(--surface-glass);
    padding: 0.65rem;
    box-shadow: 0 10px 24px rgba(17, 52, 40, 0.06);
}

.cursor-ad {
    position: fixed;
    z-index: 9999;
    pointer-events: none;
}

.ad-img {
    display: block;
    width: 100%;
    max-width: 900px;
    max-height: 48vh;
    margin: 0 auto;
    border-radius: calc(var(--radius-lg) - 4px);
    box-shadow: 0 4px 14px rgba(17, 52, 40, 0.11);
}

.cursor-ad .ad-img {
    max-height: 200px;
    max-width: 200px;
}

.no-ad {
    text-align: center;
    color: var(--text-secondary, #7f8c8d);
    padding: 1.4rem;
    border: 1px dashed var(--border-medium);
    border-radius: var(--radius-lg);
    background: var(--bg-white);
}
</style>
