<template>
    <div class="competitions">
        <h2>Konkurranser</h2>
        <p>Oversikt over aktive og kommende konkurranser</p>

        <!-- ADMIN SECTION -->
        <AdminCompetitionManager
            v-if="isAdmin"
            :competitions="competitions"
            @competition-created="handleCompetitionCreated"
            @competition-deleted="handleCompetitionDeleted"
            @competition-updated="handleCompetitionUpdated"
        />

        <!-- AKTIVE -->
        <section class="section">
            <h3>Aktive konkurranser</h3>

            <p v-if="activeCompetitions.length === 0">Ingen aktive konkurranser akkurat nå.</p>

            <ul v-else class="list">
                <li
                    v-for="competition in activeCompetitions"
                    :key="competition.id"
                    class="card active"
                    role="button"
                    tabindex="0"
                    @click="openCompetitionDetails(competition)"
                    @keydown.enter="openCompetitionDetails(competition)"
                    @keydown.space.prevent="openCompetitionDetails(competition)"
                >
                    <h4>{{ competition.name }}</h4>
                    <p>{{ competition.description }}</p>
                    <p class="date">
                        {{ formatDate(competition.startDate) }} –
                        {{ formatDate(competition.endDate) }}
                    </p>

                    <!-- Deltakerliste med hund + eier -->
                    <div class="participants">
                        <h5>Deltakere</h5>
                        <p v-if="getParticipants(competition.id).length === 0">
                            Ingen påmeldte hunder ennå.
                        </p>
                        <ul v-else class="participants-list">
                            <li v-for="entry in getParticipants(competition.id)" :key="entry.id">
                                <span class="dog-chip">
                                    <img
                                        v-if="entry.dog.imageUrl"
                                        :src="entry.dog.imageUrl"
                                        :alt="entry.dog.name"
                                        class="dog-avatar clickable-avatar"
                                        @click.stop="
                                            openImageModal(entry.dog.imageUrl, entry.dog.name)
                                        "
                                    />
                                    <span v-else class="dog-avatar-fallback">
                                        {{ dogInitials(entry.dog.name) }}
                                    </span>
                                </span>
                                <span class="dog-name">{{ entry.dog.name }}</span>
                                <span class="dog-breed">({{ entry.dog.breed }})</span>
                                <RouterLink
                                    v-if="entry.dog.owner"
                                    class="dog-owner-link"
                                    :to="`/users?userId=${entry.dog.owner.id}`"
                                    @click.stop
                                >
                                    – {{ entry.dog.owner.email }}
                                </RouterLink>
                            </li>
                        </ul>
                    </div>

                    <!-- Paamelding av hund (kun innlogget bruker) -->
                    <div class="register">
                        <template v-if="authStore.isAuthenticated">
                            <template v-if="canRegisterForCompetition(competition)">
                                <label :for="`dog-select-${competition.id}`">
                                    Velg hund for påmelding
                                </label>
                                <div class="register-row">
                                    <select
                                        :id="`dog-select-${competition.id}`"
                                        v-model="selectedDogByCompetition[competition.id]"
                                        @click.stop
                                    >
                                        <option value="" disabled>Velg hund</option>
                                        <option
                                            v-for="dog in getAvailableDogs(competition.id)"
                                            :key="dog.id"
                                            :value="dog.id"
                                        >
                                            {{ dog.name }} ({{ dog.breed }})
                                        </option>
                                    </select>
                                    <button
                                        type="button"
                                        class="register-btn"
                                        :disabled="
                                            isRegistering[competition.id] ||
                                            getAvailableDogs(competition.id).length === 0
                                        "
                                        @click.stop="handleRegister(competition.id)"
                                    >
                                        {{
                                            isRegistering[competition.id]
                                                ? 'Registrerer...'
                                                : 'Registrer hund'
                                        }}
                                    </button>
                                </div>
                                <p
                                    v-if="getAvailableDogs(competition.id).length === 0"
                                    class="muted"
                                >
                                    Ingen tilgjengelige hunder å registrere.
                                </p>
                                <p v-if="registerError[competition.id]" class="error-message">
                                    {{ registerError[competition.id] }}
                                </p>
                                <p v-if="registerSuccess[competition.id]" class="success-message">
                                    {{ registerSuccess[competition.id] }}
                                </p>
                            </template>
                            <p v-else class="muted">Påmeldingsfristen er utløpt.</p>
                        </template>
                        <p v-else class="muted">Logg inn for å registrere hund.</p>
                    </div>
                </li>
            </ul>
        </section>

        <!-- KOMMENDE -->
        <section class="section">
            <h3>Kommende konkurranser</h3>

            <p v-if="upcomingCompetitions.length === 0">Ingen kommende konkurranser.</p>

            <ul v-else class="list">
                <li
                    v-for="competition in upcomingCompetitions"
                    :key="competition.id"
                    class="card upcoming"
                    role="button"
                    tabindex="0"
                    @click="openCompetitionDetails(competition)"
                    @keydown.enter="openCompetitionDetails(competition)"
                    @keydown.space.prevent="openCompetitionDetails(competition)"
                >
                    <h4>{{ competition.name }}</h4>
                    <p>{{ competition.description }}</p>
                    <p class="date">
                        {{ formatDate(competition.startDate) }} –
                        {{ formatDate(competition.endDate) }}
                    </p>
                </li>
            </ul>
        </section>

        <!-- FERDIGE -->
        <section class="section">
            <button class="toggle" @click="showCompleted = !showCompleted">
                {{
                    showCompleted ? 'Skjul avsluttede konkurranser' : 'Vis avsluttede konkurranser'
                }}
            </button>

            <ul v-if="showCompleted && completedCompetitions.length > 0" class="list">
                <li
                    v-for="competition in completedCompetitions"
                    :key="competition.id"
                    class="card completed"
                    role="button"
                    tabindex="0"
                    @click="openCompetitionDetails(competition)"
                    @keydown.enter="openCompetitionDetails(competition)"
                    @keydown.space.prevent="openCompetitionDetails(competition)"
                >
                    <h4>{{ competition.name }}</h4>
                    <p>{{ competition.description }}</p>
                    <p class="date">
                        {{ formatDate(competition.startDate) }} –
                        {{ formatDate(competition.endDate) }}
                    </p>
                </li>
            </ul>

            <p v-if="showCompleted && completedCompetitions.length === 0">
                Ingen avsluttede konkurranser.
            </p>
        </section>

        <div v-if="selectedCompetition" class="modal-overlay" @click.self="closeCompetitionDetails">
            <div class="modal">
                <div class="modal-header">
                    <h3>{{ selectedCompetition.name }}</h3>
                    <button class="close-btn" type="button" @click="closeCompetitionDetails">
                        Lukk
                    </button>
                </div>

                <p class="modal-status">
                    Status: {{ statusLabel(getCompetitionStatus(selectedCompetition)) }}
                </p>
                <p class="date">
                    {{ formatDate(selectedCompetition.startDate) }} –
                    {{ formatDate(selectedCompetition.endDate) }}
                </p>
                <p class="modal-description">{{ selectedCompetition.description }}</p>

                <div class="modal-grid">
                    <div class="info-panel">
                        <h5>Konkurranseinfo</h5>
                        <p>Antall deltakere: {{ selectedCompetitionParticipants.length }}</p>
                        <p>Opprettet: {{ formatDate(selectedCompetition.createdAt) }}</p>
                    </div>

                    <div class="info-panel">
                        <h5>Top dog</h5>
                        <p>{{ topRatedDogLabel }}</p>
                    </div>
                </div>

                <div
                    v-if="getCompetitionStatus(selectedCompetition) === 'ACTIVE'"
                    class="leaderboard"
                >
                    <h5>Leaderboard</h5>
                    <p v-if="leaderboardEntries.length === 0">Ingen rangering ennå.</p>
                    <ol v-else class="leaderboard-list">
                        <li v-for="(entry, index) in leaderboardEntries" :key="entry.id">
                            <span class="leaderboard-left">
                                <span class="leaderboard-rank">{{ index + 1 }}.</span>
                                <span class="leaderboard-dog">
                                    <img
                                        v-if="entry.dog.imageUrl"
                                        :src="entry.dog.imageUrl"
                                        :alt="entry.dog.name"
                                        class="dog-avatar clickable-avatar"
                                        @click.stop="
                                            openImageModal(entry.dog.imageUrl, entry.dog.name)
                                        "
                                    />
                                    <span v-else class="dog-avatar-fallback">
                                        {{ dogInitials(entry.dog.name) }}
                                    </span>
                                    {{ entry.dog.name }}
                                </span>
                            </span>
                            <span class="leaderboard-points"
                                >⭐ {{ entry.averageRating.toFixed(2) }} ({{
                                    entry.ratingCount
                                }})</span
                            >
                        </li>
                    </ol>
                </div>

                <div class="register modal-register">
                    <template v-if="authStore.isAuthenticated">
                        <template v-if="canRegisterForCompetition(selectedCompetition)">
                            <label :for="`modal-dog-select-${selectedCompetition.id}`">
                                Meld på hund før fristen
                            </label>
                            <div class="register-row">
                                <select
                                    :id="`modal-dog-select-${selectedCompetition.id}`"
                                    v-model="selectedDogByCompetition[selectedCompetition.id]"
                                >
                                    <option value="" disabled>Velg hund</option>
                                    <option
                                        v-for="dog in getAvailableDogs(selectedCompetition.id)"
                                        :key="dog.id"
                                        :value="dog.id"
                                    >
                                        {{ dog.name }} ({{ dog.breed }})
                                    </option>
                                </select>
                                <button
                                    type="button"
                                    class="register-btn"
                                    :disabled="
                                        isRegistering[selectedCompetition.id] ||
                                        getAvailableDogs(selectedCompetition.id).length === 0
                                    "
                                    @click="handleRegister(selectedCompetition.id)"
                                >
                                    {{
                                        isRegistering[selectedCompetition.id]
                                            ? 'Registrerer...'
                                            : 'Registrer hund'
                                    }}
                                </button>
                            </div>
                            <p class="muted">
                                Påmeldingsfrist: {{ formatDateTime(selectedCompetition.startDate) }}
                            </p>
                            <p
                                v-if="getAvailableDogs(selectedCompetition.id).length === 0"
                                class="muted"
                            >
                                Ingen tilgjengelige hunder å registrere.
                            </p>
                            <p v-if="registerError[selectedCompetition.id]" class="error-message">
                                {{ registerError[selectedCompetition.id] }}
                            </p>
                            <p
                                v-if="registerSuccess[selectedCompetition.id]"
                                class="success-message"
                            >
                                {{ registerSuccess[selectedCompetition.id] }}
                            </p>
                        </template>
                        <p v-else class="muted">Påmeldingsfristen er utløpt.</p>
                    </template>
                    <p v-else class="muted">Logg inn for å registrere hund.</p>
                </div>

                <div class="participants">
                    <h5>Deltakere ({{ selectedCompetitionParticipants.length }})</h5>
                    <p
                        v-if="selectedCompetition && ratingError[selectedCompetition.id]"
                        class="error-message"
                    >
                        {{ ratingError[selectedCompetition.id] }}
                    </p>
                    <p v-if="selectedCompetitionParticipants.length === 0">
                        Ingen påmeldte hunder ennå.
                    </p>
                    <ul v-else class="participants-list">
                        <li
                            v-for="entry in selectedCompetitionParticipants"
                            :key="entry.id"
                            class="participant-card"
                        >
                            <div class="participant-top">
                                <div class="dog-identity">
                                    <span class="dog-chip">
                                        <img
                                            v-if="entry.dog.imageUrl"
                                            :src="entry.dog.imageUrl"
                                            :alt="entry.dog.name"
                                            class="dog-avatar clickable-avatar"
                                            @click.stop="
                                                openImageModal(entry.dog.imageUrl, entry.dog.name)
                                            "
                                        />
                                        <span v-else class="dog-avatar-fallback">
                                            {{ dogInitials(entry.dog.name) }}
                                        </span>
                                    </span>
                                    <div class="dog-text">
                                        <p class="dog-name">{{ entry.dog.name }}</p>
                                        <p class="dog-meta">
                                            <span class="dog-breed">{{ entry.dog.breed }}</span>
                                            <RouterLink
                                                v-if="entry.dog.owner"
                                                class="dog-owner-link"
                                                :to="`/users?userId=${entry.dog.owner.id}`"
                                                @click.stop
                                            >
                                                Eier: {{ entry.dog.owner.email }}
                                            </RouterLink>
                                        </p>
                                    </div>
                                </div>

                                <div
                                    v-if="
                                        selectedCompetition &&
                                        getCompetitionStatus(selectedCompetition) === 'ACTIVE'
                                    "
                                    class="rating-panel"
                                >
                                    <p class="rating-title">Gi stjerner til {{ entry.dog.name }}</p>
                                    <div class="rating-row">
                                        <button
                                            v-for="star in [1, 2, 3, 4, 5]"
                                            :key="`${entry.id}-${star}`"
                                            type="button"
                                            class="star-btn"
                                            :class="{
                                                active:
                                                    star <=
                                                    getSelectedRating(
                                                        selectedCompetition.id,
                                                        entry.dogId
                                                    )
                                            }"
                                            :disabled="
                                                !authStore.isAuthenticated ||
                                                isSubmittingRating[
                                                    `${selectedCompetition.id}:${entry.dogId}`
                                                ]
                                            "
                                            @click="
                                                handleRateDog(
                                                    selectedCompetition.id,
                                                    entry.dogId,
                                                    star
                                                )
                                            "
                                        >
                                            ★
                                        </button>
                                    </div>
                                    <p class="rating-meta">
                                        {{ formatDogRating(selectedCompetition.id, entry.dogId) }}
                                    </p>
                                </div>
                            </div>

                            <div class="dog-actions">
                                <LikeButton
                                    :competition-id="selectedCompetition.id"
                                    :dog-id="entry.dogId"
                                />
                                <CommentSection
                                    :competition-id="selectedCompetition.id"
                                    :dog-id="entry.dogId"
                                    :dog-name="entry.dog.name"
                                />
                                <button
                                    v-if="
                                        selectedCompetition &&
                                        canWithdrawEntry(selectedCompetition, entry) &&
                                        !isAdmin
                                    "
                                    type="button"
                                    class="withdraw-btn"
                                    :disabled="isRemovingParticipant[entry.id]"
                                    @click="
                                        handleWithdrawEntry(
                                            selectedCompetition.id,
                                            entry.id,
                                            entry.dog.name
                                        )
                                    "
                                >
                                    {{
                                        isRemovingParticipant[entry.id]
                                            ? 'Trekker...'
                                            : 'Trekk hund'
                                    }}
                                </button>
                                <button
                                    v-if="isAdmin"
                                    type="button"
                                    class="delete-btn participant-remove-btn"
                                    :disabled="isRemovingParticipant[entry.id]"
                                    @click="
                                        handleRemoveParticipant(
                                            selectedCompetition.id,
                                            entry.id,
                                            entry.dog.name
                                        )
                                    "
                                >
                                    {{
                                        isRemovingParticipant[entry.id]
                                            ? 'Fjerner...'
                                            : 'Fjern fra konkurranse'
                                    }}
                                </button>
                            </div>
                        </li>
                    </ul>
                    <p
                        v-if="
                            selectedCompetition &&
                            getCompetitionStatus(selectedCompetition) === 'ACTIVE' &&
                            !authStore.isAuthenticated
                        "
                        class="muted"
                    >
                        Logg inn for å gi stjernerating.
                    </p>
                </div>
            </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Competition, CompetitionDogRatingSummary, CompetitionParticipant, Dog } from '@/types'
import {
    getCompetitionRatingsSummary,
    getCompetitions,
    getCompetitionParticipants,
    registerDogForCompetition,
    submitCompetitionRating,
    withdrawDogFromCompetition
} from '@/services/competitions'
import { removeCompetitionEntry } from '@/services/admin'
import { getDogs } from '@/services/dogs'
import { useAuthStore } from '@/stores/auth'
import AdminCompetitionManager from '@/components/AdminCompetitionManager.vue'
import LikeButton from '@/components/LikeButton.vue'
import CommentSection from '@/components/CommentSection.vue'
import ImageModal from '@/components/ImageModal.vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const competitions = ref<Competition[]>([])
const dogs = ref<Dog[]>([])
// Cache av deltakere per konkurranse for rask visning
const participantsByCompetition = ref<Record<string, CompetitionParticipant[]>>({})
// Holder valgt hund per konkurranse i UI
const selectedDogByCompetition = ref<Record<string, string>>({})
const isRegistering = ref<Record<string, boolean>>({})
const registerError = ref<Record<string, string | null>>({})
const registerSuccess = ref<Record<string, string | null>>({})
const selectedCompetition = ref<Competition | null>(null)
const ratingsByCompetition = ref<Record<string, CompetitionDogRatingSummary[]>>({})
const topRatedDogByCompetition = ref<Record<string, CompetitionDogRatingSummary | null>>({})
const ratingError = ref<Record<string, string | null>>({})
const selectedRatingByCompetitionDog = ref<Record<string, number>>({})
const isSubmittingRating = ref<Record<string, boolean>>({})
const isRemovingParticipant = ref<Record<string, boolean>>({})

async function syncSelectedCompetitionFromQuery() {
    const competitionId =
        typeof route.query.competitionId === 'string' ? route.query.competitionId : ''

    if (!competitionId) {
        selectedCompetition.value = null
        return
    }

    const competition = competitions.value.find((item) => item.id === competitionId)
    if (competition) {
        await openCompetitionDetails(competition, false)
    }
}

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
    competitions.value = await getCompetitions()
    // Hent deltakere for aktive konkurranser ved oppstart
    await Promise.all(
        activeCompetitions.value.map((competition) => loadParticipants(competition.id))
    )

    if (authStore.isAuthenticated) {
        // Hent hunder til innlogget bruker for paamelding
        dogs.value = await getDogs()
    }

    await syncSelectedCompetitionFromQuery()
})

watch(
    () => route.query.competitionId,
    async () => {
        await syncSelectedCompetitionFromQuery()
    }
)

const isAdmin = computed(() => authStore.isAdmin)

// Helper function to determine competition status based on dates
function getCompetitionStatus(competition: Competition): 'UPCOMING' | 'ACTIVE' | 'COMPLETED' {
    const now = new Date()
    const start = new Date(competition.startDate)
    const end = new Date(competition.endDate)

    if (now < start) {
        return 'UPCOMING'
    } else if (now >= start && now <= end) {
        return 'ACTIVE'
    } else {
        return 'COMPLETED'
    }
}

const activeCompetitions = computed(() =>
    competitions.value
        .filter((c) => getCompetitionStatus(c) === 'ACTIVE')
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
)

const upcomingCompetitions = computed(() =>
    competitions.value
        .filter((c) => getCompetitionStatus(c) === 'UPCOMING')
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
)

const userDogs = computed(() =>
    dogs.value
        .filter((dog) => dog.ownerId === authStore.user?.id)
        .sort((a, b) => a.name.localeCompare(b.name))
)

const showCompleted = ref(false)

const completedCompetitions = computed(() =>
    competitions.value
        .filter((c) => getCompetitionStatus(c) === 'COMPLETED')
        .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())
)

const selectedCompetitionParticipants = computed(() => {
    if (!selectedCompetition.value) {
        return []
    }
    return getParticipants(selectedCompetition.value.id)
})

const leaderboardEntries = computed(() =>
    [...selectedCompetitionRatings.value]
        .filter((rating) => rating.ratingCount > 0)
        .sort((a, b) => {
            if (b.averageRating !== a.averageRating) {
                return b.averageRating - a.averageRating
            }
            return b.ratingCount - a.ratingCount
        })
)

const selectedCompetitionRatings = computed(() => {
    if (!selectedCompetition.value) {
        return []
    }

    return ratingsByCompetition.value[selectedCompetition.value.id] || []
})

const topRatedDogLabel = computed(() => {
    if (!selectedCompetition.value) {
        return 'Velg en konkurranse for å se topprangering.'
    }

    const topRatedDog = topRatedDogByCompetition.value[selectedCompetition.value.id]

    if (topRatedDog) {
        return `${topRatedDog.dog.name} - ⭐ ${topRatedDog.averageRating.toFixed(2)} (${topRatedDog.ratingCount})`
    }

    return 'Ingen ratings ennå.'
})

function formatDate(date: Date): string {
    return date.toLocaleDateString('no-NO')
}

function formatDateTime(date: Date): string {
    return date.toLocaleString('no-NO')
}

function statusLabel(status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED'): string {
    if (status === 'ACTIVE') return 'Pågående'
    if (status === 'COMPLETED') return 'Avsluttet'
    return 'Kommende'
}

function dogInitials(name: string): string {
    return name.slice(0, 2).toUpperCase()
}

function canRegisterForCompetition(competition: Competition): boolean {
    return new Date() < new Date(competition.startDate)
}

function canWithdrawEntry(competition: Competition, entry: CompetitionParticipant): boolean {
    if (!authStore.isAuthenticated) {
        return false
    }

    return (
        canRegisterForCompetition(competition) &&
        (entry.dog.owner?.id === authStore.user?.id || authStore.isAdmin)
    )
}

async function openCompetitionDetails(competition: Competition, updateRoute = true) {
    selectedCompetition.value = competition

    if (updateRoute) {
        await router.replace({
            query: {
                ...route.query,
                competitionId: competition.id
            }
        })
    }

    if (!participantsByCompetition.value[competition.id]) {
        await loadParticipants(competition.id)
    }

    if (!ratingsByCompetition.value[competition.id]) {
        await loadRatingsSummary(competition.id)
    }
}

async function closeCompetitionDetails() {
    selectedCompetition.value = null
    const nextQuery = { ...route.query }
    delete nextQuery.competitionId
    await router.replace({ query: nextQuery })
}

function getParticipants(competitionId: string): CompetitionParticipant[] {
    return participantsByCompetition.value[competitionId] || []
}

function getAvailableDogs(competitionId: string): Dog[] {
    // Filtrer bort hunder som allerede er registrert i konkurransen
    const registeredDogIds = new Set(getParticipants(competitionId).map((entry) => entry.dogId))
    return userDogs.value.filter((dog) => !registeredDogIds.has(dog.id))
}

async function loadParticipants(competitionId: string) {
    // Laster deltakere og lagrer per konkurranse
    const participants = await getCompetitionParticipants(competitionId)
    participantsByCompetition.value = {
        ...participantsByCompetition.value,
        [competitionId]: participants
    }
}

async function loadRatingsSummary(competitionId: string) {
    try {
        ratingError.value[competitionId] = null

        const summary = await getCompetitionRatingsSummary(competitionId)

        ratingsByCompetition.value = {
            ...ratingsByCompetition.value,
            [competitionId]: summary.ratings
        }

        topRatedDogByCompetition.value = {
            ...topRatedDogByCompetition.value,
            [competitionId]: summary.topRatedDog
        }
    } catch (err: any) {
        ratingError.value[competitionId] = err.response?.data?.error || 'Kunne ikke hente ratings.'
    }
}

function getSelectedRating(competitionId: string, dogId: string): number {
    return selectedRatingByCompetitionDog.value[`${competitionId}:${dogId}`] || 0
}

function getDogSummary(
    competitionId: string,
    dogId: string
): CompetitionDogRatingSummary | undefined {
    return (ratingsByCompetition.value[competitionId] || []).find(
        (rating) => rating.dogId === dogId
    )
}

function formatDogRating(competitionId: string, dogId: string): string {
    const summary = getDogSummary(competitionId, dogId)

    if (!summary || summary.ratingCount === 0) {
        return 'Ingen ratings ennå'
    }

    return `Snitt: ${summary.averageRating.toFixed(2)} (${summary.ratingCount})`
}

async function handleRateDog(competitionId: string, dogId: string, score: number) {
    if (!authStore.isAuthenticated) {
        ratingError.value[competitionId] = 'Du må være logget inn for å rate.'
        return
    }

    const key = `${competitionId}:${dogId}`

    isSubmittingRating.value[key] = true
    ratingError.value[competitionId] = null

    try {
        await submitCompetitionRating(competitionId, dogId, score)
        selectedRatingByCompetitionDog.value[key] = score
        await loadRatingsSummary(competitionId)
    } catch (err: any) {
        ratingError.value[competitionId] = err.response?.data?.error || 'Kunne ikke sende rating.'
    } finally {
        isSubmittingRating.value[key] = false
    }
}

async function handleRegister(competitionId: string) {
    const selectedDogId = selectedDogByCompetition.value[competitionId]

    if (!selectedDogId) {
        registerError.value[competitionId] = 'Velg en hund først.'
        return
    }

    isRegistering.value[competitionId] = true
    registerError.value[competitionId] = null
    registerSuccess.value[competitionId] = null

    try {
        // Registrer hund og oppdater lokal deltakere-liste
        const entry = await registerDogForCompetition(competitionId, selectedDogId)
        const current = getParticipants(competitionId)
        participantsByCompetition.value = {
            ...participantsByCompetition.value,
            [competitionId]: [...current, entry]
        }
        selectedDogByCompetition.value[competitionId] = ''
        registerSuccess.value[competitionId] = 'Hunden er meldt på konkurransen.'
    } catch (err: any) {
        registerError.value[competitionId] =
            err.response?.data?.error || 'Kunne ikke registrere hund.'
    } finally {
        isRegistering.value[competitionId] = false
    }
}

async function handleRemoveParticipant(competitionId: string, entryId: string, dogName: string) {
    if (isRemovingParticipant.value[entryId]) return

    if (!confirm(`Fjerne ${dogName} fra denne konkurransen?`)) {
        return
    }

    isRemovingParticipant.value = {
        ...isRemovingParticipant.value,
        [entryId]: true
    }
    registerError.value[competitionId] = null
    registerSuccess.value[competitionId] = null
    ratingError.value[competitionId] = null

    try {
        await removeCompetitionEntry(competitionId, entryId)
        participantsByCompetition.value = {
            ...participantsByCompetition.value,
            [competitionId]: getParticipants(competitionId).filter((entry) => entry.id !== entryId)
        }
        await loadRatingsSummary(competitionId)
        registerSuccess.value[competitionId] = `${dogName} ble fjernet fra konkurransen.`
    } catch (err: any) {
        registerError.value[competitionId] =
            err.response?.data?.error || 'Kunne ikke fjerne deltaker.'
    } finally {
        isRemovingParticipant.value = {
            ...isRemovingParticipant.value,
            [entryId]: false
        }
    }
}

async function handleWithdrawEntry(competitionId: string, entryId: string, dogName: string) {
    if (isRemovingParticipant.value[entryId]) return

    if (!confirm(`Trekke ${dogName} fra konkurransen?`)) {
        return
    }

    isRemovingParticipant.value = {
        ...isRemovingParticipant.value,
        [entryId]: true
    }
    registerError.value[competitionId] = null
    registerSuccess.value[competitionId] = null

    try {
        await withdrawDogFromCompetition(competitionId, entryId)
        participantsByCompetition.value = {
            ...participantsByCompetition.value,
            [competitionId]: getParticipants(competitionId).filter((entry) => entry.id !== entryId)
        }
        await loadRatingsSummary(competitionId)
        registerSuccess.value[competitionId] = `${dogName} ble trukket fra konkurransen.`
    } catch (err: any) {
        registerError.value[competitionId] =
            err.response?.data?.error || 'Kunne ikke trekke hunden.'
    } finally {
        isRemovingParticipant.value = {
            ...isRemovingParticipant.value,
            [entryId]: false
        }
    }
}

function handleCompetitionCreated(competition: Competition) {
    competitions.value.unshift(competition)

    if (getCompetitionStatus(competition) === 'ACTIVE') {
        loadParticipants(competition.id)
    }
}

function handleCompetitionDeleted(id: string) {
    competitions.value = competitions.value.filter((c) => c.id !== id)
    const { [id]: _, ...rest } = participantsByCompetition.value
    participantsByCompetition.value = rest

    const { [id]: __, ...ratingsRest } = ratingsByCompetition.value
    ratingsByCompetition.value = ratingsRest

    const { [id]: ___, ...topRatedRest } = topRatedDogByCompetition.value
    topRatedDogByCompetition.value = topRatedRest
}

function handleCompetitionUpdated(updated: Competition) {
    const index = competitions.value.findIndex((c) => c.id === updated.id)
    if (index !== -1) {
        competitions.value[index] = updated
    }
}
</script>

<style scoped>
.competitions {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--space-lg) var(--space-md);
}

.competitions > h2 {
    margin-bottom: var(--space-xs);
}

.competitions > p {
    color: var(--text-secondary);
    margin-bottom: var(--space-lg);
}

.section {
    margin-top: var(--space-lg);
}

.section h3 {
    margin-bottom: var(--space-sm);
    font-size: 1.125rem;
}

.list {
    list-style: none;
    padding: 0;
    margin-top: var(--space-sm);
    display: grid;
    gap: var(--space-sm);
}

.card {
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
    background: var(--bg-white);
    transition:
        box-shadow 0.15s ease,
        transform 0.15s ease;
    cursor: pointer;
}

.card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transform: translateY(-1px);
}

.card:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}

.withdraw-btn {
    background: var(--warning-bg, #fff6e6);
    color: var(--warning, #9a6700);
    border: 1px solid color-mix(in srgb, #d8a116 24%, transparent);
}

.card.active {
    border-left: 3px solid var(--success);
}

.card.upcoming {
    border-left: 3px solid var(--accent);
}

.card.completed {
    border-left: 3px solid var(--text-muted);
    opacity: 0.85;
}

.card h4 {
    margin-bottom: var(--space-xs);
    font-size: 1.1rem;
}

.card > p {
    margin-bottom: var(--space-xs);
}

.participants {
    margin-top: var(--space-md);
    padding-top: var(--space-md);
    border-top: 1px solid var(--border-light);
}

.participants h5 {
    margin: 0 0 var(--space-xs);
    font-size: 0.9375rem;
    font-weight: 600;
}

.participants-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: var(--space-sm);
}

.participants-list li {
    display: block;
}

.participant-card {
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    padding: var(--space-sm);
}

.participant-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-sm);
    flex-wrap: wrap;
}

.dog-identity {
    display: flex;
    align-items: flex-start;
    gap: var(--space-xs);
}

.dog-text {
    min-width: 0;
}

.dog-name {
    font-weight: 600;
    margin: 0;
}

.dog-chip {
    margin-right: 0;
}

.dog-avatar,
.dog-avatar-fallback {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    object-fit: cover;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--accent);
    color: #fff;
    font-size: 0.68rem;
    font-weight: 700;
    vertical-align: middle;
    flex-shrink: 0;
}

.clickable-avatar {
    cursor: pointer;
    transition:
        transform 0.2s,
        opacity 0.2s;
}

.clickable-avatar:hover {
    transform: scale(1.1);
    opacity: 0.9;
}

.dog-meta {
    margin: 0.1rem 0 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
}

.dog-breed {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.dog-owner-link {
    font-size: 0.875rem;
    color: var(--accent);
    text-decoration: none;
}

.dog-owner-link:hover {
    text-decoration: underline;
}

.dog-actions {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    margin-top: var(--space-sm);
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
}

.participant-remove-btn {
    align-self: flex-start;
}

.register {
    margin-top: var(--space-md);
    display: grid;
    gap: var(--space-xs);
}

.modal-register {
    margin-top: var(--space-md);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
    background: var(--bg-primary);
}

.register-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
}

.register select {
    min-width: 200px;
}

.register-btn {
    background: var(--accent);
    color: white;
}

.register-btn:hover:not(:disabled) {
    background: var(--accent-hover);
}

.muted {
    color: var(--text-muted);
    margin: 0;
    font-size: 0.875rem;
}

.error-message {
    color: var(--error);
    margin: 0;
    font-size: 0.875rem;
}

.success-message {
    color: var(--success);
    margin: 0;
    font-size: 0.875rem;
}

.toggle {
    background: var(--bg-white);
    color: var(--text-secondary);
    border: 1px solid var(--border-medium);
    padding: var(--space-sm) var(--space-md);
    font-size: 0.9375rem;
}

.toggle:hover {
    background: var(--bg-primary);
    border-color: var(--border-light);
}

.date {
    font-size: 0.875rem;
    color: var(--text-muted);
}

.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-md);
    z-index: 1000;
}

.modal {
    width: min(920px, 100%);
    max-height: 88vh;
    overflow-y: auto;
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-light);
    padding: var(--space-md);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-sm);
}

.modal-header h3 {
    margin: 0;
}

.close-btn {
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-medium);
}

.modal-status {
    margin-top: var(--space-sm);
    margin-bottom: var(--space-xs);
    font-weight: 600;
}

.modal-description {
    margin-top: var(--space-sm);
}

.modal-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm);
    margin-top: var(--space-md);
}

.info-panel {
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
    background: var(--bg-primary);
}

.info-panel h5 {
    margin: 0 0 var(--space-xs);
}

.info-panel p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9375rem;
}

.leaderboard {
    margin-top: var(--space-md);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
}

.leaderboard h5 {
    margin: 0 0 var(--space-xs);
}

.leaderboard-list {
    margin: 0;
    padding-left: 1.2rem;
    display: grid;
    gap: 0.4rem;
}

.leaderboard-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-sm);
}

.leaderboard-left {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
}

.leaderboard-rank {
    min-width: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
}

.leaderboard-dog {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.leaderboard-points {
    color: var(--text-muted);
    font-size: 0.875rem;
}

.rating-panel {
    background: var(--bg-white);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 0.45rem 0.6rem;
    min-width: 210px;
}

.rating-title {
    margin: 0 0 0.2rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
}

.rating-row {
    display: flex;
    align-items: center;
    gap: 0.15rem;
}

.star-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 0;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
}

.star-btn.active {
    color: #ffd700;
}

.star-btn:disabled {
    opacity: 0.65;
    cursor: default;
}

.rating-meta {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    color: var(--text-muted);
}

@media (max-width: 720px) {
    .modal-grid {
        grid-template-columns: 1fr;
    }
    .participant-top {
        flex-direction: column;
    }

    .rating-panel {
        width: 100%;
    }

    .dog-actions {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>
