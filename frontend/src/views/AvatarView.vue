<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const adminDoorTooltip = 'Controll is for the powerfull'
const lockedDoorTooltip = 'Controll is not for the weak'

const handleLogout = () => {
    authStore.logout()
}

const isOpen = ref(false)

function toggleMenu() {
    isOpen.value = !isOpen.value
}
//AI generated
const initials = computed(() => {
    if (!authStore.user?.username) return '?'

    return authStore.user.username.substring(0, 2).toUpperCase()
})

const secretDoorTooltip = computed(() => (authStore.isAdmin ? adminDoorTooltip : lockedDoorTooltip))
</script>

<template>
    <div class="avatar-wrapper">
        <div v-if="authStore.user" class="avatar" @click="toggleMenu">
            <img
                v-if="authStore.user.imageUrl"
                :src="authStore.user.imageUrl"
                :alt="`Avatar for ${authStore.user.username}`"
                class="avatar-image"
            />
            <span v-else>{{ initials }}</span>
            <span v-if="authStore.isAdmin" class="admin-badge">A</span>
        </div>

        <div v-if="isOpen && authStore.user" class="dropdown">
            <div class="dropdown-header">
                <p class="username">{{ authStore.user.username }}</p>
                <p class="user-email">{{ authStore.user.email }}</p>
            </div>

            <div class="dropdown-content">
                <RouterLink class="dropdown-item" to="/my-profile"> Min profil </RouterLink>
                <RouterLink
                    v-if="authStore.isAdmin"
                    class="dropdown-item dropdown-item-secret"
                    to="/admin-dashboard"
                    :title="secretDoorTooltip"
                    :aria-label="secretDoorTooltip"
                >
                    <span class="secret-door" aria-hidden="true">
                        <svg viewBox="0 0 64 64" class="door-svg door-svg-open">
                            <defs>
                                <linearGradient
                                    id="door-frame-open"
                                    x1="0%"
                                    y1="0%"
                                    x2="0%"
                                    y2="100%"
                                >
                                    <stop offset="0%" stop-color="#6f4c2a" />
                                    <stop offset="100%" stop-color="#39200f" />
                                </linearGradient>
                                <linearGradient
                                    id="door-panel-open"
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="100%"
                                >
                                    <stop offset="0%" stop-color="#b1773d" />
                                    <stop offset="100%" stop-color="#683a17" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M16 54V24c0-9 7-16 16-16s16 7 16 16v30H16z"
                                fill="url(#door-frame-open)"
                            />
                            <path
                                d="M21 54V25c0-6.7 5-12 11-12s11 5.3 11 12v29H21z"
                                fill="#201105"
                            />
                            <path
                                d="M22 54V25c0-6.2 4.8-11 10-11v40H22z"
                                fill="url(#door-panel-open)"
                            />
                            <path
                                d="M32 14c5.2 0 9.5 4.2 9.5 9.5V54H32V14z"
                                fill="#4f2810"
                                opacity="0.55"
                            />
                            <path
                                d="M25 24.5h5M25 32h5M25 39.5h5"
                                stroke="#d7b17b"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                opacity="0.8"
                            />
                            <circle cx="29.5" cy="36" r="1.8" fill="#f1d186" />
                            <path d="M41.5 23.5h3.5v24h-3.5z" fill="#2f1f16" />
                            <path d="M41 25l12 7-12 8z" fill="#f8e7bb" opacity="0.9" />
                        </svg>
                    </span>
                    <span class="secret-door-tooltip">{{ secretDoorTooltip }}</span>
                </RouterLink>
                <button
                    v-else
                    class="dropdown-item dropdown-item-secret dropdown-item-disabled"
                    type="button"
                    :title="secretDoorTooltip"
                    :aria-label="secretDoorTooltip"
                >
                    <span class="secret-door" aria-hidden="true">
                        <svg viewBox="0 0 64 64" class="door-svg">
                            <defs>
                                <linearGradient
                                    id="door-frame-locked"
                                    x1="0%"
                                    y1="0%"
                                    x2="0%"
                                    y2="100%"
                                >
                                    <stop offset="0%" stop-color="#7a5733" />
                                    <stop offset="100%" stop-color="#3e2413" />
                                </linearGradient>
                                <linearGradient
                                    id="door-panel-locked"
                                    x1="0%"
                                    y1="0%"
                                    x2="0%"
                                    y2="100%"
                                >
                                    <stop offset="0%" stop-color="#b78046" />
                                    <stop offset="100%" stop-color="#6a3917" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M16 54V24c0-9 7-16 16-16s16 7 16 16v30H16z"
                                fill="url(#door-frame-locked)"
                            />
                            <path
                                d="M21 54V25c0-6.7 5-12 11-12s11 5.3 11 12v29H21z"
                                fill="url(#door-panel-locked)"
                            />
                            <path
                                d="M28 24.5h8M28 32h8M28 39.5h8"
                                stroke="#deb57d"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                opacity="0.78"
                            />
                            <circle cx="38" cy="36" r="1.8" fill="#e0bc6d" />
                            <path
                                d="M27.5 31h9a3 3 0 013 3v7H24.5v-7a3 3 0 013-3z"
                                fill="#d7c18a"
                            />
                            <path
                                d="M28.5 31v-4a3.5 3.5 0 117 0v4"
                                fill="none"
                                stroke="#d7c18a"
                                stroke-width="2.5"
                                stroke-linecap="round"
                            />
                        </svg>
                    </span>
                    <span class="secret-door-tooltip">{{ secretDoorTooltip }}</span>
                </button>
                <RouterLink v-if="authStore.isAdmin" class="dropdown-item" to="/advertisment"
                    >Reklame</RouterLink
                >
                <RouterLink class="dropdown-item" to="/dogs"> Mine Hunder </RouterLink>
                <button @click="handleLogout" class="dropdown-item logout-btn">Logg ut</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.avatar-wrapper {
    position: relative;
    margin-left: auto;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s ease;
    position: relative;
}

.avatar:hover {
    background-color: var(--accent-hover);
}

.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.admin-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    background-color: var(--warning);
    color: white;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    font-size: 0.625rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
}

.dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background-color: var(--bg-white);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    width: 220px;
    z-index: 1000;
    overflow: hidden;
}

.dropdown-header {
    padding: var(--space-md);
    border-bottom: 1px solid var(--border-light);
}

.username {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    word-break: break-all;
}

.user-email {
    margin: 0.15rem 0 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
    word-break: break-all;
}

.dropdown-content {
    padding: var(--space-xs);
}

.dropdown-item {
    display: block;
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    color: var(--text-primary);
    text-decoration: none;
    border: none;
    background: none;
    text-align: left;
    font-size: 0.9375rem;
    border-radius: var(--radius-md);
    transition: background-color 0.15s ease;
    cursor: pointer;
}

.dropdown-item:hover {
    background-color: var(--bg-primary);
}

.dropdown-item-secret {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 64px;
}

.dropdown-item-disabled {
    cursor: default;
}

.dropdown-item-disabled:hover {
    background-color: transparent;
}

.secret-door {
    width: 42px;
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 8px 16px rgba(15, 20, 46, 0.18));
    transition:
        transform 0.2s ease,
        filter 0.2s ease;
}

.dropdown-item-secret:hover .secret-door {
    transform: translateY(-1px) scale(1.04);
    filter: drop-shadow(0 12px 22px rgba(15, 20, 46, 0.28));
}

.door-svg {
    width: 100%;
    height: 100%;
    display: block;
}

.door-svg-open {
    transform: translateX(1px);
}

.secret-door-tooltip {
    position: absolute;
    right: calc(100% + 0.5rem);
    top: 50%;
    transform: translateY(-50%) translateX(8px);
    min-width: 180px;
    padding: 0.45rem 0.7rem;
    border-radius: 12px;
    background: #121826;
    color: #f1f4ff;
    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.35;
    box-shadow: 0 16px 36px rgba(9, 11, 18, 0.28);
    opacity: 0;
    pointer-events: none;
    transition:
        opacity 0.18s ease,
        transform 0.18s ease;
}

.secret-door-tooltip::after {
    content: '';
    position: absolute;
    top: 50%;
    right: -6px;
    width: 12px;
    height: 12px;
    background: #121826;
    transform: translateY(-50%) rotate(45deg);
}

.dropdown-item-secret:hover .secret-door-tooltip,
.dropdown-item-secret:focus-visible .secret-door-tooltip {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
}

.logout-btn {
    color: var(--error);
    font-weight: 500;
}

.logout-btn:hover {
    background-color: var(--error-bg);
    color: var(--error);
}

@media (max-width: 720px) {
    .secret-door-tooltip {
        right: 0;
        top: calc(100% + 0.35rem);
        transform: translateY(6px);
    }

    .secret-door-tooltip::after {
        top: -6px;
        right: 22px;
        transform: rotate(45deg);
    }

    .dropdown-item-secret:hover .secret-door-tooltip,
    .dropdown-item-secret:focus-visible .secret-door-tooltip {
        transform: translateY(0);
    }
}
</style>
