<script setup lang="ts">
import { computed } from 'vue'
import type { DogBadge } from '@/types'

const props = defineProps<{
    badges: DogBadge[]
    compact?: boolean
}>()

const badgeIcons: Record<DogBadge['key'], string> = {
    DOUBLE_TOP_THREE: '🥉',
    COMPETITION_WINNER: '🏆',
    MORE_THAN_THREE_COMMENTS: '💬',
    MORE_THAN_FIVE_LIKES: '❤️'
}

const decoratedBadges = computed(() =>
    props.badges.map((badge) => ({
        ...badge,
        icon: badgeIcons[badge.key]
    }))
)
</script>

<template>
    <div v-if="badges.length > 0" class="badge-list" :class="{ compact }">
        <span
            v-for="badge in decoratedBadges"
            :key="badge.key"
            class="badge-chip"
            :title="`${badge.label}: ${badge.description}`"
            :aria-label="`${badge.label}: ${badge.description}`"
        >
            <span class="badge-icon" aria-hidden="true">{{ badge.icon }}</span>
        </span>
    </div>
</template>

<style scoped>
.badge-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
}

.badge-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 16%, white);
    color: var(--accent-strong);
    font-size: 1rem;
    font-weight: 700;
    border: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
    cursor: help;
    transition:
        transform 0.15s ease,
        background-color 0.15s ease;
}

.badge-chip:hover {
    transform: translateY(-1px);
    background: color-mix(in srgb, var(--accent) 24%, white);
}

.badge-icon {
    line-height: 1;
}

.compact .badge-chip {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.92rem;
}
</style>
