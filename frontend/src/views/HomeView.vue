<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { DogHighlightsResponse } from '@/types'
import { getDogHighlights } from '@/services/dogs'
import DogBadgeList from '@/components/DogBadgeList.vue'
import ImageModal from '@/components/ImageModal.vue'

const highlights = ref<DogHighlightsResponse | null>(null)
const isLoading = ref(true)
const loadError = ref('')
const now = ref(Date.now())
const modalImage = ref({
    url: '',
    alt: '',
    isOpen: false
})

let countdownTimer: number | null = null

const nextCompetition = computed(() => {
    if (!highlights.value?.nextCompetition) return null

    return {
        ...highlights.value.nextCompetition,
        startDate: new Date(highlights.value.nextCompetition.startDate),
        endDate: new Date(highlights.value.nextCompetition.endDate)
    }
})

const countdown = computed(() => {
    if (!nextCompetition.value) return null

    const diff = nextCompetition.value.startDate.getTime() - now.value
    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0 }
    }

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60)
    }
})

const heroDog = computed(() => highlights.value?.dogOfTheWeek || null)
const badgeLeaders = computed(() => highlights.value?.mostBadgedDogs || [])

function openImageModal(url: string, alt: string) {
    modalImage.value = { url, alt, isOpen: true }
}

function closeImageModal() {
    modalImage.value = { url: '', alt: '', isOpen: false }
}

function formatDate(date: Date) {
    return date.toLocaleDateString('no-NO', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    })
}

onMounted(async () => {
    try {
        highlights.value = await getDogHighlights()
    } catch (error: any) {
        loadError.value = error.response?.data?.error || 'Kunne ikke hente forsideinnhold.'
    } finally {
        isLoading.value = false
    }

    countdownTimer = window.setInterval(() => {
        now.value = Date.now()
    }, 30000)
})

onUnmounted(() => {
    if (countdownTimer) window.clearInterval(countdownTimer)
})
</script>

<template>
    <div class="home">
        <section class="hero card">
            <div class="hero-copy">
                <p class="kicker">Hundeshowplattform</p>
                <h1>LiveDog er klar for neste show</h1>
                <p>
                    Følg konkurranser, finn profiler som faktisk får oppmerksomhet, og se hvilke
                    hunder som bygger momentum akkurat nå.
                </p>
            </div>

            <div v-if="nextCompetition && countdown" class="countdown card countdown-card">
                <p class="eyebrow">Neste konkurranse</p>
                <h3>{{ nextCompetition.name }}</h3>
                <p class="date">{{ formatDate(nextCompetition.startDate) }}</p>
                <div class="countdown-grid">
                    <div>
                        <strong>{{ countdown.days }}</strong>
                        <span>dager</span>
                    </div>
                    <div>
                        <strong>{{ countdown.hours }}</strong>
                        <span>timer</span>
                    </div>
                    <div>
                        <strong>{{ countdown.minutes }}</strong>
                        <span>min</span>
                    </div>
                </div>
            </div>
        </section>

        <p v-if="loadError" class="error-message">{{ loadError }}</p>

        <section class="stats">
            <article class="stat card">
                <h3>Konkurranser</h3>
                <p>Se aktive, kommende og avsluttede events med deltakere og resultater.</p>
            </article>
            <article class="stat card">
                <h3>Badge-system</h3>
                <p>Se hvilke hunder som faktisk har bygget historikk og engasjement.</p>
            </article>
            <article class="stat card">
                <h3>Ukens hund</h3>
                <p>Forsiden fremhever hunden som er hetest i systemet akkurat nå.</p>
            </article>
        </section>

        <section v-if="heroDog && !isLoading" class="feature-grid">
            <article class="feature card spotlight">
                <p class="eyebrow dark">Dog of the Week</p>
                <div class="spotlight-layout">
                    <button
                        v-if="heroDog.imageUrl"
                        type="button"
                        class="spotlight-image-button"
                        @click="openImageModal(heroDog.imageUrl, heroDog.name)"
                    >
                        <img :src="heroDog.imageUrl" :alt="heroDog.name" class="spotlight-image" />
                    </button>
                    <div v-else class="spotlight-image fallback">
                        {{ heroDog.name.slice(0, 2) }}
                    </div>

                    <div class="spotlight-copy">
                        <p class="spotlight-kicker">Høyest ferskt engasjement</p>
                        <h2>{{ heroDog.name }}</h2>
                        <p class="muted">{{ heroDog.breed }}</p>
                        <p v-if="heroDog.owner" class="owner">
                            Eier: {{ heroDog.owner.username || heroDog.owner.email }}
                        </p>
                        <DogBadgeList :badges="heroDog.badges" />
                    </div>
                </div>

                <p class="description">“{{ heroDog.description }}”</p>

                <div class="score-grid">
                    <div class="score-card">
                        <strong>{{ heroDog.commentsCount }}</strong>
                        <span>kommentarer</span>
                    </div>
                    <div class="score-card">
                        <strong>{{ heroDog.likesCount }}</strong>
                        <span>likes</span>
                    </div>
                    <div class="score-card">
                        <strong>{{ heroDog.top3Finishes }}</strong>
                        <span>topp 3</span>
                    </div>
                </div>
            </article>

            <article class="feature card badge-board">
                <p class="eyebrow dark">Badge board</p>
                <h3>Hunder med flest badges</h3>
                <p class="muted">Hover over ikonene for forklaring.</p>
                <ul class="badge-leader-list">
                    <li v-for="dog in badgeLeaders" :key="dog.id">
                        <div class="leader-head">
                            <button
                                v-if="dog.imageUrl"
                                type="button"
                                class="mini-avatar-button"
                                @click="openImageModal(dog.imageUrl, dog.name)"
                            >
                                <img :src="dog.imageUrl" :alt="dog.name" class="mini-avatar" />
                            </button>
                            <div v-else class="mini-avatar fallback">
                                {{ dog.name.slice(0, 2) }}
                            </div>
                            <div class="leader-copy">
                                <strong>{{ dog.name }}</strong>
                                <p>{{ dog.breed }}</p>
                            </div>
                            <span class="badge-count">{{ dog.badgeCount }}</span>
                        </div>
                        <DogBadgeList :badges="dog.badges" compact />
                    </li>
                </ul>
            </article>
        </section>

        <section v-if="isLoading" class="card placeholder">
            Laster highlights, badges og countdown...
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
.home {
    display: grid;
    gap: 1.3rem;
}

.hero {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
    gap: 1rem;
    padding: clamp(1.6rem, 3vw, 2.6rem);
    background:
        linear-gradient(120deg, rgba(9, 24, 18, 0.72), rgba(12, 84, 64, 0.42)),
        url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1800&q=80')
            center / cover no-repeat;
    min-height: 340px;
    border: 1px solid color-mix(in srgb, var(--border-light) 40%, transparent);
}

.hero-copy {
    align-self: end;
}

.kicker,
.eyebrow {
    color: #dcfff5;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
}

.eyebrow.dark {
    color: var(--accent-strong);
}

.hero h1,
.hero p,
.date,
.countdown-card h3 {
    color: #ffffff;
}

.countdown-card {
    align-self: start;
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(8px);
    padding: 1rem;
}

.countdown-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.7rem;
    margin-top: 1rem;
}

.countdown-grid div {
    background: rgba(255, 255, 255, 0.14);
    border-radius: var(--radius-md);
    padding: 0.8rem 0.6rem;
    text-align: center;
}

.countdown-grid strong {
    display: block;
    font-size: 1.5rem;
}

.stats,
.feature-grid {
    display: grid;
    gap: 0.9rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.feature-grid {
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
}

.stat,
.feature {
    padding: 1.1rem 1rem;
}

.spotlight {
    background:
        radial-gradient(
            circle at top right,
            color-mix(in srgb, var(--accent-soft) 80%, white),
            transparent 32%
        ),
        linear-gradient(180deg, color-mix(in srgb, var(--accent-light) 50%, white), white 60%);
}

.spotlight-layout {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 1rem;
    align-items: stretch;
}

.spotlight-image-button,
.mini-avatar-button {
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
}

.spotlight-image {
    width: 100%;
    min-height: 240px;
    border-radius: 24px;
    object-fit: cover;
    transition: transform 0.18s ease;
    box-shadow: 0 14px 30px rgba(17, 52, 40, 0.16);
}

.spotlight-image-button:hover .spotlight-image,
.mini-avatar-button:hover .mini-avatar {
    transform: scale(1.02);
}

.spotlight-copy {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.4rem;
}

.spotlight-kicker {
    margin: 0;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent-strong);
    font-weight: 700;
}

.description {
    margin-top: 1rem;
    font-size: 1rem;
    line-height: 1.6;
}

.score-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
}

.score-card {
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid var(--border-light);
    padding: 0.8rem;
}

.score-card strong {
    display: block;
    font-size: 1.3rem;
}

.score-card span {
    color: var(--text-secondary);
}

.leader-head {
    display: flex;
    gap: 0.8rem;
    align-items: center;
}

.leader-copy p,
.owner {
    margin: 0;
}

.mini-avatar,
.fallback {
    width: 48px;
    height: 48px;
    border-radius: 14px;
}

.mini-avatar {
    object-fit: cover;
}

.fallback {
    display: grid;
    place-items: center;
    font-weight: 800;
    color: var(--accent-strong);
    background: color-mix(in srgb, var(--accent) 22%, white);
    text-transform: uppercase;
}

.badge-leader-list {
    list-style: none;
    margin: 1rem 0 0;
    padding: 0;
    display: grid;
    gap: 0.9rem;
}

.badge-leader-list li {
    border-top: 1px solid var(--border-light);
    padding-top: 0.9rem;
}

.badge-count {
    margin-left: auto;
    min-width: 2rem;
    text-align: center;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 20%, white);
    color: var(--accent-strong);
    font-weight: 800;
    padding: 0.2rem 0.55rem;
}

.placeholder,
.error-message {
    padding: 1rem;
}

@media (max-width: 980px) {
    .hero,
    .feature-grid,
    .stats,
    .spotlight-layout,
    .score-grid {
        grid-template-columns: 1fr;
    }
}
</style>
