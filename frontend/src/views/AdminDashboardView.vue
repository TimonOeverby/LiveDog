<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { getAdminDashboardStats } from '@/services/admin'
import ImageModal from '@/components/ImageModal.vue'
import type {
    AdminDashboardActiveParticipant,
    AdminDashboardMonthlyCount,
    AdminDashboardMostActiveUser,
    AdminDashboardStats,
    AdminDashboardUser
} from '@/types'

const stats = ref<AdminDashboardStats | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const selectedView = ref<'active' | 'users' | 'competitions'>('active')
const modalImage = ref({
    url: '',
    alt: '',
    isOpen: false
})
const selectedPopup = ref<
    | null
    | 'active-now'
    | 'upcoming'
    | 'recent-users'
    | 'incomplete-dogs'
    | 'low-enrollment'
    | 'avg-dogs'
>(null)
const lowEnrollmentThreshold = ref(3)
const userSearch = ref('')
const userSort = ref<'name' | 'dogs' | 'recent' | 'role'>('name')
const competitionSort = ref<'soonest' | 'participants'>('soonest')
type PopupId = NonNullable<typeof selectedPopup.value>
type DashboardUserLinkTarget =
    | AdminDashboardUser
    | AdminDashboardMostActiveUser
    | AdminDashboardActiveParticipant['owner']

function openImageModal(url: string, alt: string) {
    modalImage.value = { url, alt, isOpen: true }
}

function closeImageModal() {
    modalImage.value = { url: '', alt: '', isOpen: false }
}

const overview = computed(() => stats.value?.overview ?? null)

const formattedPercentage = computed(() => {
    if (!overview.value) return '0 %'
    return `${overview.value.percentageOfDogsInActiveCompetitions.toFixed(1)} %`
})

const formattedAverageDogsPerUser = computed(() => {
    if (!overview.value) return '0.0'
    return overview.value.averageDogsPerUser.toFixed(1)
})

const formattedAverageCompetitionsPerMonth = computed(() => {
    if (!overview.value) return '0.0'
    return overview.value.averageCompetitionsPerMonth.toFixed(1)
})

const operationalHighlights = computed(() => {
    if (!overview.value) return []

    return [
        {
            id: 'active-now',
            label: 'Aktive konkurranser nå',
            value: overview.value.activeCompetitionsCount.toString(),
            description: `${overview.value.activeCompetitionDogCount} hunder deltar akkurat nå.`
        },
        {
            id: 'upcoming',
            label: 'Kommende konkurranser',
            value: `${overview.value.upcomingCompetitionsNext7Days} / ${overview.value.upcomingCompetitionsNext30Days}`,
            description: 'Starter innen 7 og 30 dager.'
        },
        {
            id: 'recent-users',
            label: 'Brukere siste 30 dager',
            value: overview.value.recentUsersCount.toString(),
            description: 'Nye kontoer opprettet den siste måneden.'
        },
        {
            id: 'incomplete-dogs',
            label: 'Hunder uten full profil',
            value: overview.value.incompleteDogProfilesCount.toString(),
            description: 'Mangler bilde eller bio.'
        },
        {
            id: 'low-enrollment',
            label: 'Lav påmelding',
            value: overview.value.lowEnrollmentCompetitionsCount.toString(),
            description: `Færre enn ${overview.value.lowEnrollmentThreshold} påmeldte hunder.`
        },
        {
            id: 'avg-dogs',
            label: 'Snitt hunder per bruker',
            value: formattedAverageDogsPerUser.value,
            description: `Fordelt på ${overview.value.totalUsers} registrerte brukere.`
        }
    ] satisfies Array<{
        id: PopupId
        label: string
        value: string
        description: string
    }>
})

const recentUsers = computed(() => {
    if (!stats.value || !overview.value) return []

    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - 30)

    return [...stats.value.users]
        .filter((user) => new Date(user.createdAt) >= thresholdDate)
        .sort(
            (left, right) =>
                new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        )
})

const popupConfig = computed(() => {
    if (!stats.value || !overview.value || !selectedPopup.value) return null

    if (selectedPopup.value === 'active-now') {
        return {
            title: 'Aktive konkurranser nå',
            subtitle: `${overview.value.activeCompetitionDogCount} hunder deltar akkurat nå.`,
            items: stats.value.activeCompetitions.map((competition) => ({
                id: competition.id,
                title: competition.name,
                meta: `${competition.participantCount} deltakere`,
                detail: `${formatDate(competition.startDate)} til ${formatDate(competition.endDate)}`
            }))
        }
    }

    if (selectedPopup.value === 'upcoming') {
        return {
            title: 'Kommende konkurranser',
            subtitle: `${overview.value.upcomingCompetitionsNext7Days} starter innen 7 dager, ${overview.value.upcomingCompetitionsNext30Days} innen 30 dager.`,
            items: stats.value.upcomingCompetitions.map((competition) => ({
                id: competition.id,
                title: competition.name,
                meta: `${competition.participantCount} påmeldte`,
                detail: `Starter ${formatDate(competition.startDate)}`
            }))
        }
    }

    if (selectedPopup.value === 'recent-users') {
        return {
            title: 'Brukere opprettet siste 30 dager',
            subtitle: `${overview.value.recentUsersCount} nye brukere den siste måneden.`,
            items: recentUsers.value.map((user) => ({
                id: user.id,
                title: user.username,
                meta: `${user.role} · ${user.dogsCount} hunder`,
                detail: `Registrert ${formatDate(user.createdAt)}`
            }))
        }
    }

    if (selectedPopup.value === 'incomplete-dogs') {
        return {
            title: 'Hunder uten full profil',
            subtitle: 'Disse profilene mangler bilde, bio eller begge deler.',
            items: stats.value.incompleteDogProfiles.map((dog) => ({
                id: dog.id,
                title: `${dog.name} (${dog.breed})`,
                meta: `Eier: ${dog.owner.username}`,
                detail: `Mangler ${dog.missingImage ? 'bilde' : ''}${dog.missingImage && dog.missingDescription ? ' + ' : ''}${dog.missingDescription ? 'bio' : ''}`
            }))
        }
    }

    if (selectedPopup.value === 'low-enrollment') {
        return {
            title: 'Konkurranser med lav påmelding',
            subtitle: `Viser konkurranser under terskelen på ${overview.value.lowEnrollmentThreshold} påmeldte hunder.`,
            items: stats.value.lowEnrollmentCompetitions.map((competition) => ({
                id: competition.id,
                title: competition.name,
                meta: `${competition.participantCount} påmeldte`,
                detail: `Starter ${formatDate(competition.startDate)}`
            }))
        }
    }

    return {
        title: 'Snitt hunder per bruker',
        subtitle: `Gjennomsnittet er ${formattedAverageDogsPerUser.value} hunder per bruker.`,
        items: [...stats.value.users]
            .sort((left, right) => right.dogsCount - left.dogsCount)
            .slice(0, 12)
            .map((user) => ({
                id: user.id,
                title: user.username,
                meta: `${user.dogsCount} hunder`,
                detail: user.email
            }))
    }
})

const filteredUsers = computed(() => {
    if (!stats.value) return []

    const query = userSearch.value.trim().toLowerCase()
    let collection = stats.value.users.filter((user) => {
        if (!query) return true
        return (
            user.username.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.role.toLowerCase().includes(query)
        )
    })

    if (userSort.value === 'dogs') {
        collection = [...collection].sort((left, right) => right.dogsCount - left.dogsCount)
    } else if (userSort.value === 'recent') {
        collection = [...collection].sort(
            (left, right) =>
                new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        )
    } else if (userSort.value === 'role') {
        collection = [...collection].sort((left, right) => left.role.localeCompare(right.role))
    } else {
        collection = [...collection].sort((left, right) =>
            left.username.localeCompare(right.username)
        )
    }

    return collection
})

const sortedUpcomingCompetitions = computed(() => {
    if (!stats.value) return []

    const collection = [...stats.value.upcomingCompetitions]
    if (competitionSort.value === 'participants') {
        return collection.sort((left, right) => right.participantCount - left.participantCount)
    }

    return collection.sort(
        (left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime()
    )
})

const maxMonthlyValue = computed(() => {
    if (!stats.value) return 1

    const values = [...stats.value.monthlyNewUsers, ...stats.value.monthlyNewDogs].map(
        (item) => item.count
    )
    return Math.max(...values, 1)
})

async function loadDashboard() {
    isLoading.value = true
    errorMessage.value = ''

    try {
        stats.value = await getAdminDashboardStats(lowEnrollmentThreshold.value)
    } catch (error) {
        console.error('Kunne ikke hente adminstatistikk:', error)
        errorMessage.value = 'Kunne ikke hente statistikk for admin dashboard.'
    } finally {
        isLoading.value = false
    }
}

function formatDate(value: Date | string): string {
    return new Intl.DateTimeFormat('nb-NO', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(value))
}

function formatMonth(month: string): string {
    const [year, monthNumber] = month.split('-').map(Number)
    return new Intl.DateTimeFormat('nb-NO', {
        month: 'short',
        year: 'numeric'
    }).format(new Date(Date.UTC(year, monthNumber - 1, 1)))
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
}

function metricBarStyle(item: AdminDashboardMonthlyCount) {
    const width = `${Math.max((item.count / maxMonthlyValue.value) * 100, 8)}%`
    return { width }
}

function activityBreakdown(user: AdminDashboardMostActiveUser) {
    return `Hunder ${user.dogsCount} · Kommentarer ${user.commentsCount} · Likes ${user.likesCount} · Ratings ${user.ratingsCount}`
}

function userProfileLink(user: DashboardUserLinkTarget) {
    return { path: '/users', query: { userId: user.id } }
}

function openPopup(id: PopupId) {
    selectedPopup.value = id
}

function closePopup() {
    selectedPopup.value = null
}

onMounted(loadDashboard)

watch(lowEnrollmentThreshold, async () => {
    await loadDashboard()
})
</script>

<template>
    <section class="admin-dashboard">
        <div v-if="isLoading" class="state-card">Laster statistikk...</div>
        <div v-else-if="errorMessage" class="state-card error">{{ errorMessage }}</div>

        <template v-else-if="stats && overview">
            <section class="overview-grid">
                <article
                    v-for="highlight in operationalHighlights"
                    :key="highlight.id"
                    class="overview-card"
                    :class="{ 'overview-card-highlight': highlight.id === 'active-now' }"
                    role="button"
                    tabindex="0"
                    @click="openPopup(highlight.id)"
                    @keydown.enter="openPopup(highlight.id)"
                    @keydown.space.prevent="openPopup(highlight.id)"
                >
                    <p class="stat-label">{{ highlight.label }}</p>
                    <p class="stat-value">{{ highlight.value }}</p>
                    <p class="stat-meta">{{ highlight.description }}</p>
                    <span class="stat-action">Vis detaljer</span>
                </article>
            </section>

            <section class="attention-grid">
                <article class="insight-panel">
                    <div class="panel-header">
                        <div>
                            <p class="panel-eyebrow">Trenger oppfølging</p>
                            <h2>Hunder med ufullstendig profil</h2>
                        </div>
                        <p class="panel-note">
                            Admin må følge opp eiere når profiler mangler grunnleggende innhold.
                        </p>
                    </div>

                    <div v-if="stats.incompleteDogProfiles.length === 0" class="empty-card">
                        Ingen hundeprofiler mangler bilde eller bio akkurat nå.
                    </div>

                    <div v-else class="mini-list">
                        <div
                            v-for="dog in stats.incompleteDogProfiles"
                            :key="dog.id"
                            class="mini-list-row mini-list-row-stacked"
                        >
                            <div>
                                <p class="mini-list-name">{{ dog.name }} ({{ dog.breed }})</p>
                                <p class="mini-list-meta">
                                    Mangler:
                                    {{ dog.missingImage ? 'bilde' : '' }}
                                    {{ dog.missingImage && dog.missingDescription ? ' + ' : '' }}
                                    {{ dog.missingDescription ? 'bio' : '' }}
                                </p>
                                <p class="mini-list-meta">Eier: {{ dog.owner.username }}</p>
                            </div>
                            <RouterLink
                                class="list-action"
                                :to="{ path: '/users', query: { userId: dog.owner.id } }"
                            >
                                Åpne eier
                            </RouterLink>
                        </div>
                    </div>
                </article>

                <article class="insight-panel">
                    <div class="panel-header">
                        <div>
                            <p class="panel-eyebrow">Risiko</p>
                            <h2>Konkurranser med lav påmelding</h2>
                        </div>
                        <div class="threshold-control">
                            <label for="low-enrollment-threshold">Terskel</label>
                            <select
                                id="low-enrollment-threshold"
                                v-model.number="lowEnrollmentThreshold"
                            >
                                <option :value="2">Under 2</option>
                                <option :value="3">Under 3</option>
                                <option :value="4">Under 4</option>
                                <option :value="5">Under 5</option>
                            </select>
                        </div>
                    </div>

                    <div v-if="stats.lowEnrollmentCompetitions.length === 0" class="empty-card">
                        Ingen kommende konkurranser er under valgt terskel.
                    </div>

                    <div v-else class="mini-list">
                        <div
                            v-for="competition in stats.lowEnrollmentCompetitions"
                            :key="competition.id"
                            class="mini-list-row mini-list-row-stacked"
                        >
                            <div>
                                <p class="mini-list-name">{{ competition.name }}</p>
                                <p class="mini-list-meta">
                                    {{ competition.participantCount }} påmeldte · starter
                                    {{ formatDate(competition.startDate) }}
                                </p>
                            </div>
                            <RouterLink
                                class="list-action"
                                :to="{
                                    path: '/competitions',
                                    query: { competitionId: competition.id }
                                }"
                            >
                                Åpne konkurranse
                            </RouterLink>
                        </div>
                    </div>
                </article>
            </section>

            <section class="selector-panel">
                <div class="selector-copy">
                    <p class="selector-eyebrow">Velg innsyn</p>
                    <h2>Hva vil du se på nå?</h2>
                </div>

                <div class="selector-buttons">
                    <button
                        v-for="view in [
                            {
                                id: 'active',
                                label: 'Aktive show',
                                title: 'Hunder og eiere i ringen nå'
                            },
                            {
                                id: 'users',
                                label: 'Brukere',
                                title: 'Søk, sorter og finn aktivitet'
                            },
                            {
                                id: 'competitions',
                                label: 'Konkurranser',
                                title: 'Kommende show, trender og risiko'
                            }
                        ]"
                        :key="view.id"
                        type="button"
                        class="selector-button"
                        :class="{ 'selector-button-active': selectedView === view.id }"
                        @click="selectedView = view.id as typeof selectedView.value"
                    >
                        <span class="selector-title">{{ view.label }}</span>
                        <span class="selector-description">{{ view.title }}</span>
                    </button>
                </div>
            </section>

            <section v-if="selectedView === 'active'" class="insight-panel">
                <div class="panel-header">
                    <div>
                        <p class="panel-eyebrow">Aktive show</p>
                        <h2>Hvem er ute i ringen nå?</h2>
                    </div>
                    <p class="panel-note">
                        {{ overview.activeCompetitionDogCount }} unike hunder fordelt på
                        {{ overview.activeCompetitionsCount }} aktive show.
                    </p>
                </div>

                <div class="metric-strip">
                    <article class="micro-card">
                        <p class="spotlight-label">Deltakelse akkurat nå</p>
                        <p class="spotlight-value">{{ formattedPercentage }}</p>
                    </article>
                    <article class="micro-card">
                        <p class="spotlight-label">Aktive show</p>
                        <p class="spotlight-value">{{ stats.activeCompetitions.length }}</p>
                    </article>
                </div>

                <div v-if="stats.activeCompetitions.length === 0" class="empty-card">
                    Ingen aktive konkurranser akkurat nå.
                </div>

                <div v-else class="competition-grid">
                    <article
                        v-for="competition in stats.activeCompetitions"
                        :key="competition.id"
                        class="competition-card"
                    >
                        <header class="competition-card-header">
                            <div>
                                <p class="competition-card-eyebrow">Aktivt show</p>
                                <h3>{{ competition.name }}</h3>
                            </div>
                            <div class="competition-badge">
                                {{ competition.participantCount }} deltakere
                            </div>
                        </header>

                        <p class="competition-dates">
                            {{ formatDate(competition.startDate) }} til
                            {{ formatDate(competition.endDate) }}
                        </p>

                        <RouterLink
                            class="inline-action"
                            :to="{
                                path: '/competitions',
                                query: { competitionId: competition.id }
                            }"
                        >
                            Åpne konkurranse
                        </RouterLink>

                        <div class="participant-list">
                            <article
                                v-for="participant in competition.participants"
                                :key="participant.id"
                                class="participant-card"
                            >
                                <div
                                    class="participant-avatar clickable-avatar"
                                    @click="
                                        participant.dog.imageUrl &&
                                        openImageModal(
                                            participant.dog.imageUrl,
                                            participant.dog.name
                                        )
                                    "
                                >
                                    <img
                                        v-if="participant.dog.imageUrl"
                                        :src="participant.dog.imageUrl"
                                        :alt="participant.dog.name"
                                    />
                                    <span v-else>{{ initials(participant.dog.name) }}</span>
                                </div>

                                <div class="participant-copy">
                                    <p class="participant-name">{{ participant.dog.name }}</p>
                                    <p class="participant-breed">{{ participant.dog.breed }}</p>
                                    <p class="participant-owner">
                                        Eier: {{ participant.owner.username }}
                                    </p>
                                </div>

                                <RouterLink
                                    class="list-action"
                                    :to="userProfileLink(participant.owner)"
                                >
                                    Åpne eier
                                </RouterLink>
                            </article>
                        </div>
                    </article>
                </div>
            </section>

            <section v-else-if="selectedView === 'users'" class="insight-panel">
                <div class="panel-header">
                    <div>
                        <p class="panel-eyebrow">Brukere</p>
                        <h2>Hvem bruker LiveDog nå?</h2>
                    </div>
                    <p class="panel-note">
                        Snitt: {{ formattedAverageDogsPerUser }} hunder per bruker.
                    </p>
                </div>

                <div class="toolbar">
                    <input
                        v-model="userSearch"
                        type="text"
                        placeholder="Søk på brukernavn, e-post eller rolle"
                    />
                    <select v-model="userSort">
                        <option value="name">Sorter: Navn</option>
                        <option value="dogs">Sorter: Flest hunder</option>
                        <option value="recent">Sorter: Nyeste brukere</option>
                        <option value="role">Sorter: Rolle</option>
                    </select>
                </div>

                <div class="user-list">
                    <article v-for="user in filteredUsers" :key="user.id" class="user-row">
                        <div
                            class="user-avatar clickable-avatar"
                            @click="user.imageUrl && openImageModal(user.imageUrl, user.username)"
                        >
                            <img v-if="user.imageUrl" :src="user.imageUrl" :alt="user.username" />
                            <span v-else>{{ initials(user.username) }}</span>
                        </div>

                        <div class="user-copy">
                            <p class="user-name">{{ user.username }}</p>
                            <p class="user-email">{{ user.email }}</p>
                        </div>

                        <div class="user-meta">
                            <span class="user-pill">{{ user.role }}</span>
                            <span class="user-count">{{ user.dogsCount }} hunder</span>
                            <RouterLink class="list-action" :to="userProfileLink(user)"
                                >Åpne</RouterLink
                            >
                        </div>
                    </article>
                </div>

                <div class="secondary-grid">
                    <article class="spotlight-card">
                        <p class="spotlight-label">Mest aktive brukere</p>
                        <div class="mini-list">
                            <div
                                v-for="user in stats.mostActiveUsers"
                                :key="user.id"
                                class="mini-list-row mini-list-row-stacked"
                            >
                                <div>
                                    <p class="mini-list-name">{{ user.username }}</p>
                                    <p class="mini-list-meta">
                                        {{ user.activityScore }} aktivitetspoeng
                                    </p>
                                    <p class="mini-list-meta">{{ activityBreakdown(user) }}</p>
                                </div>
                                <RouterLink class="list-action" :to="userProfileLink(user)"
                                    >Åpne</RouterLink
                                >
                            </div>
                        </div>
                    </article>

                    <article class="spotlight-card">
                        <p class="spotlight-label">Nye brukere per måned</p>
                        <div class="trend-list">
                            <div
                                v-for="item in stats.monthlyNewUsers"
                                :key="item.month"
                                class="trend-row"
                            >
                                <span class="trend-label">{{ formatMonth(item.month) }}</span>
                                <div class="trend-bar-shell">
                                    <div class="trend-bar" :style="metricBarStyle(item)"></div>
                                </div>
                                <span class="trend-value">{{ item.count }}</span>
                            </div>
                        </div>
                    </article>
                </div>

                <div class="info-bubble">
                    Aktivitetspoeng = hunder + kommentarer + likes + ratings. Dette er en enkel
                    driftsscore for å fange brukere med mye aktivitet, ikke en kvalitetsrangering.
                </div>
            </section>

            <section v-else class="insight-panel">
                <div class="panel-header">
                    <div>
                        <p class="panel-eyebrow">Konkurranser</p>
                        <h2>Hvor tett går det mellom showene?</h2>
                    </div>
                    <p class="panel-note">
                        {{ formattedAverageCompetitionsPerMonth }} konkurranser i måneden i snitt.
                    </p>
                </div>

                <div class="toolbar">
                    <select v-model="competitionSort">
                        <option value="soonest">Sorter kommende: Snartest først</option>
                        <option value="participants">Sorter kommende: Flest påmeldte</option>
                    </select>
                </div>

                <div class="metric-spotlight">
                    <article class="spotlight-card">
                        <p class="spotlight-label">Månedlig snitt</p>
                        <p class="spotlight-value">{{ formattedAverageCompetitionsPerMonth }}</p>
                        <p class="spotlight-meta">
                            Basert på startmånedene til alle konkurransene som finnes i databasen.
                        </p>
                    </article>

                    <article class="spotlight-card">
                        <p class="spotlight-label">Totalt antall konkurranser</p>
                        <p class="spotlight-value">{{ overview.totalCompetitions }}</p>
                        <p class="spotlight-meta">
                            {{ overview.activeCompetitionsCount }} av dem er aktive akkurat nå.
                        </p>
                    </article>
                </div>

                <div class="secondary-grid secondary-grid-competitions">
                    <article class="spotlight-card">
                        <p class="spotlight-label">Kommende konkurranser</p>
                        <div class="mini-list">
                            <div
                                v-for="competition in sortedUpcomingCompetitions.slice(0, 8)"
                                :key="competition.id"
                                class="mini-list-row mini-list-row-stacked"
                            >
                                <div>
                                    <p class="mini-list-name">{{ competition.name }}</p>
                                    <p class="mini-list-meta">
                                        {{ competition.participantCount }} påmeldte ·
                                        {{ formatDate(competition.startDate) }}
                                    </p>
                                </div>
                                <RouterLink
                                    class="list-action"
                                    :to="{
                                        path: '/competitions',
                                        query: { competitionId: competition.id }
                                    }"
                                >
                                    Åpne
                                </RouterLink>
                            </div>
                        </div>
                    </article>

                    <article class="spotlight-card">
                        <p class="spotlight-label">Nye hunder per måned</p>
                        <div class="trend-list">
                            <div
                                v-for="item in stats.monthlyNewDogs"
                                :key="item.month"
                                class="trend-row"
                            >
                                <span class="trend-label">{{ formatMonth(item.month) }}</span>
                                <div class="trend-bar-shell">
                                    <div class="trend-bar" :style="metricBarStyle(item)"></div>
                                </div>
                                <span class="trend-value">{{ item.count }}</span>
                            </div>
                        </div>
                    </article>
                </div>
            </section>
        </template>

        <div v-if="popupConfig" class="modal-overlay" @click.self="closePopup">
            <article class="modal-card">
                <header class="modal-header">
                    <div>
                        <p class="panel-eyebrow">Detaljer</p>
                        <h2>{{ popupConfig.title }}</h2>
                        <p class="spotlight-meta">{{ popupConfig.subtitle }}</p>
                    </div>
                    <button type="button" class="close-button" @click="closePopup">Lukk</button>
                </header>

                <div v-if="popupConfig.items.length === 0" class="empty-card">
                    Ingen treff akkurat nå.
                </div>

                <div v-else class="mini-list">
                    <div
                        v-for="item in popupConfig.items"
                        :key="item.id"
                        class="mini-list-row mini-list-row-stacked"
                    >
                        <div>
                            <p class="mini-list-name">{{ item.title }}</p>
                            <p class="mini-list-meta">{{ item.meta }}</p>
                            <p class="mini-list-meta">{{ item.detail }}</p>
                        </div>
                    </div>
                </div>
            </article>
        </div>

        <ImageModal
            :image-url="modalImage.url"
            :alt-text="modalImage.alt"
            :is-open="modalImage.isOpen"
            @close="closeImageModal"
        />
    </section>
</template>

<style scoped>
.admin-dashboard {
    display: grid;
    gap: 1.75rem;
}

.overview-card,
.selector-panel,
.insight-panel,
.state-card,
.empty-card,
.competition-card,
.participant-card,
.user-row,
.spotlight-card {
    border-radius: 24px;
    border: 1px solid var(--border-light);
    box-shadow: 0 10px 28px rgba(17, 52, 40, 0.06);
}

.state-card {
    padding: 1.5rem;
    background: var(--bg-white);
}

.error {
    color: var(--error);
    border-color: color-mix(in srgb, var(--error) 25%, var(--border-light));
    background: var(--error-bg);
}

.overview-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.overview-card {
    min-height: 200px;
    padding: 1.6rem;
    background: var(--bg-white);
    display: grid;
    align-content: start;
    gap: 0.45rem;
    cursor: pointer;
}

.overview-card:hover {
    transform: translateY(-2px);
    transition: transform 0.18s ease;
}

.overview-card-highlight {
    background:
        radial-gradient(
            circle at top right,
            color-mix(in srgb, var(--accent-soft) 90%, white),
            transparent 30%
        ),
        linear-gradient(
            180deg,
            color-mix(in srgb, var(--accent-light) 65%, white) 0%,
            var(--bg-white) 100%
        );
}

.stat-label,
.selector-eyebrow,
.panel-eyebrow,
.competition-card-eyebrow {
    margin: 0;
    color: var(--text-secondary);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 0.78rem;
}

.stat-value {
    margin: 0.15rem 0;
    font-size: clamp(2.7rem, 6vw, 4.4rem);
    line-height: 1;
    font-weight: 800;
    color: var(--text-primary);
}

.stat-meta,
.panel-note,
.spotlight-meta,
.spotlight-note,
.mini-list-meta,
.competition-dates,
.participant-breed,
.participant-owner,
.user-email,
.empty-card {
    margin: 0;
    color: var(--text-secondary);
}

.stat-action,
.list-action,
.inline-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    padding: 0.45rem 0.8rem;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-size: 0.86rem;
    font-weight: 700;
}

.stat-action {
    margin-top: auto;
    pointer-events: none;
}

.attention-grid,
.secondary-grid,
.metric-spotlight,
.competition-grid {
    display: grid;
    gap: 1rem;
}

.attention-grid,
.secondary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.secondary-grid-competitions {
    grid-template-columns: 1.25fr 0.75fr;
}

.selector-panel,
.insight-panel {
    background: var(--surface-glass);
    padding: 1.5rem;
}

.selector-panel {
    display: grid;
    gap: 1rem;
}

.selector-copy h2,
.panel-header h2 {
    margin: 0.2rem 0 0;
    color: var(--text-primary);
}

.selector-buttons {
    display: grid;
    gap: 0.9rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.selector-button {
    display: grid;
    gap: 0.32rem;
    text-align: left;
    padding: 1rem 1.1rem;
    border-radius: 20px;
    border: 1px solid var(--border-light);
    background: var(--bg-white);
    color: var(--text-primary);
}

.selector-button:hover {
    background: var(--surface-muted);
}

.selector-button-active {
    background:
        radial-gradient(
            circle at top right,
            color-mix(in srgb, var(--accent-soft) 90%, white),
            transparent 35%
        ),
        color-mix(in srgb, var(--accent-light) 50%, white);
    border-color: color-mix(in srgb, var(--accent) 25%, var(--border-medium));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent-soft) 45%, transparent);
}

.selector-title {
    font-size: 1rem;
    font-weight: 700;
}

.selector-description {
    font-size: 0.84rem;
    line-height: 1.45;
    color: var(--text-secondary);
}

.panel-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.2rem;
}

.threshold-control,
.toolbar {
    display: flex;
    gap: 0.8rem;
    align-items: center;
    flex-wrap: wrap;
}

.threshold-control label {
    margin: 0;
}

.toolbar {
    margin-bottom: 1rem;
}

.toolbar input {
    flex: 1;
    min-width: 240px;
}

.metric-strip,
.metric-spotlight {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.micro-card,
.competition-card,
.spotlight-card {
    background: var(--bg-white);
    border: 1px solid var(--border-light);
    border-radius: 18px;
    padding: 1rem;
}

.competition-card-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: start;
}

.competition-card-header h3,
.participant-name,
.user-name,
.mini-list-name {
    margin: 0;
    color: var(--text-primary);
    font-weight: 700;
}

.competition-badge,
.user-pill,
.user-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    font-size: 0.76rem;
    font-weight: 700;
    background: var(--accent-soft);
    color: var(--accent-strong);
}

.participant-list,
.user-list,
.mini-list,
.trend-list {
    display: grid;
    gap: 0.85rem;
}

.participant-card,
.user-row,
.empty-card {
    background: color-mix(in srgb, var(--bg-white) 86%, var(--surface-muted));
    padding: 1rem;
}

.participant-card {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.9rem;
    align-items: center;
}

.participant-avatar,
.user-avatar {
    width: 58px;
    height: 58px;
    border-radius: 18px;
    overflow: hidden;
    background: linear-gradient(135deg, var(--accent-soft) 0%, var(--surface-muted) 100%);
    border: 1px solid var(--border-light);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--accent-strong);
    font-weight: 800;
}

.participant-avatar img,
.user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.clickable-avatar {
    cursor: pointer;
    transition: transform 0.18s ease;
}

.clickable-avatar:hover {
    transform: scale(1.04);
}

.user-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    align-items: center;
}

.user-copy {
    min-width: 0;
}

.user-meta {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: end;
    align-items: center;
}

.mini-list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    padding: 0.65rem 0;
    border-bottom: 1px solid var(--border-light);
}

.mini-list-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.mini-list-row-stacked {
    align-items: start;
}

.trend-row {
    display: grid;
    grid-template-columns: 90px 1fr 40px;
    gap: 0.75rem;
    align-items: center;
}

.trend-label,
.trend-value {
    color: var(--text-secondary);
    font-weight: 600;
}

.trend-bar-shell {
    height: 12px;
    border-radius: 999px;
    background: var(--surface-muted);
    overflow: hidden;
}

.trend-bar {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%);
}

.info-bubble {
    padding: 0.9rem 1rem;
    border-radius: 18px;
    background: color-mix(in srgb, var(--accent-light) 55%, white);
    border: 1px solid color-mix(in srgb, var(--accent-soft) 70%, var(--border-light));
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(9, 17, 14, 0.4);
    display: grid;
    place-items: center;
    padding: 1rem;
    z-index: 200;
}

.modal-card {
    width: min(760px, 100%);
    max-height: min(80vh, 900px);
    overflow: auto;
    background: var(--bg-white);
    border-radius: 24px;
    border: 1px solid var(--border-light);
    box-shadow: 0 24px 60px rgba(16, 40, 30, 0.18);
    padding: 1.4rem;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: start;
    margin-bottom: 1rem;
}

.close-button {
    background: var(--surface-muted);
    color: var(--text-primary);
}

@media (max-width: 980px) {
    .overview-grid,
    .attention-grid,
    .selector-buttons,
    .metric-strip,
    .metric-spotlight,
    .secondary-grid,
    .secondary-grid-competitions {
        grid-template-columns: 1fr;
    }

    .panel-header {
        align-items: start;
        flex-direction: column;
    }
}

@media (max-width: 720px) {
    .admin-dashboard {
        gap: 1.25rem;
    }

    .selector-panel,
    .insight-panel {
        padding: 1.2rem;
    }

    .modal-header {
        flex-direction: column;
    }

    .participant-card,
    .user-row,
    .mini-list-row {
        grid-template-columns: 1fr;
        flex-direction: column;
        align-items: start;
    }

    .user-meta {
        justify-content: start;
    }

    .trend-row {
        grid-template-columns: 1fr;
    }
}
</style>
