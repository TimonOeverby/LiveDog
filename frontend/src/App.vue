<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import AvatarDropdown from './views/AvatarView.vue'
import AdvertisementDisplay from './components/AdvertisementDisplay.vue'

const authStore = useAuthStore()
const route = useRoute()
const theme = ref<'light' | 'dark'>('light')

const isDarkMode = computed({
    get: () => theme.value === 'dark',
    set: (value: boolean) => {
        theme.value = value ? 'dark' : 'light'
    }
})

const showAdvertisements = computed(() => route.meta.hideAdvertisements !== true)

const applyTheme = (nextTheme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', nextTheme)
}

onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
        theme.value = savedTheme
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme.value = 'dark'
    }
    applyTheme(theme.value)
})

watch(theme, (nextTheme) => {
    applyTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
})
</script>

<template>
    <header class="topbar">
        <div class="wrapper">
            <div class="brand">
                <span class="brand-dot"></span>
                <span class="brand-text">LiveDog</span>
            </div>

            <nav>
                <!-- Show login/register when NOT logged in -->
                <template v-if="!authStore.isAuthenticated">
                    <RouterLink to="/">Hjem</RouterLink>
                    <RouterLink to="/competitions">Konkurranser</RouterLink>
                    <RouterLink to="/contact">Kontakt oss</RouterLink>
                    <RouterLink to="/login">Logg inn</RouterLink>
                </template>

                <!-- Show user info and logout when logged in -->
                <template v-else>
                    <RouterLink to="/">Hjem</RouterLink>
                    <RouterLink to="/competitions">Konkurranser</RouterLink>
                    <RouterLink to="/users">Brukere</RouterLink>
                    <RouterLink to="/contact">Kontakt oss</RouterLink>
                    <label class="theme-toggle" for="theme-toggle">
                        <span class="theme-label">{{ isDarkMode ? 'Mørk' : 'Lys' }}</span>
                        <input id="theme-toggle" v-model="isDarkMode" type="checkbox" />
                        <span class="slider" aria-hidden="true"></span>
                    </label>
                    <AvatarDropdown />
                </template>
            </nav>
        </div>
    </header>

    <main class="page-shell">
        <RouterView />
        <section v-if="showAdvertisements" class="ad-shell">
            <AdvertisementDisplay></AdvertisementDisplay>
        </section>
    </main>
</template>

<style scoped>
.topbar {
    backdrop-filter: blur(10px);
    background: color-mix(in srgb, var(--bg-white) 88%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--border-light) 80%, transparent);
    padding: 0.8rem var(--space-md);
    position: sticky;
    top: 0;
    z-index: 120;
}

.wrapper {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
}

.brand {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    font-family: var(--font-display);
    color: var(--text-primary);
}

.brand-dot {
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 999px;
    background: linear-gradient(140deg, var(--accent) 0%, var(--accent-2) 100%);
    box-shadow: 0 0 0 4px var(--accent-soft);
}

.brand-text {
    letter-spacing: 0.02em;
    font-size: 1.05rem;
    font-weight: 700;
}

nav {
    display: flex;
    gap: 0.35rem;
    align-items: center;
    margin-left: auto;
    flex-wrap: wrap;
}

nav a {
    color: var(--text-secondary);
    text-decoration: none;
    padding: 0.52rem 0.9rem;
    font-size: 0.92rem;
    font-weight: 600;
    border-radius: 999px;
    transition: all 0.2s ease;
}

nav a:hover {
    color: var(--text-primary);
    background-color: var(--surface-muted);
    transform: translateY(-1px);
}

nav a.router-link-active {
    color: var(--accent-strong);
    background-color: var(--accent-soft);
}

.page-shell {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.6rem var(--space-md) 2.25rem;
    display: grid;
    gap: 1.2rem;
}

.ad-shell {
    border-radius: var(--radius-lg);
    padding: 0.4rem;
}

.theme-toggle {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    cursor: pointer;
    user-select: none;
    margin-left: 0.2rem;
}

.theme-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.theme-toggle input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    width: 44px;
    height: 24px;
    border-radius: 999px;
    background: var(--surface-muted);
    border: 1px solid var(--border-medium);
    position: relative;
    transition: background-color 0.2s ease;
}

.slider::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--bg-white);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease;
}

.theme-toggle input:checked + .slider {
    background: var(--accent-soft);
}

.theme-toggle input:checked + .slider::after {
    transform: translateX(20px);
}

@media (max-width: 700px) {
    .theme-label {
        display: none;
    }
}
</style>
