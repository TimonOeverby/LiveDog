import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
    id: string
    username: string
    email: string
    imageUrl?: string | null
    phoneNumber?: string | null
    role: string
}

const API_URL = 'http://localhost:3000/api'

function normalizeUser(raw: any): User | null {
    if (!raw || typeof raw !== 'object') return null
    if (!raw.id || !raw.email || !raw.role) return null

    const username =
        typeof raw.username === 'string' && raw.username.trim().length > 0
            ? raw.username
            : String(raw.email).split('@')[0]

    return {
        id: String(raw.id),
        username,
        email: String(raw.email),
        imageUrl: raw.imageUrl ?? null,
        phoneNumber: raw.phoneNumber ?? null,
        role: String(raw.role)
    }
}

export const useAuthStore = defineStore('auth', () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    const token = ref<string | null>(storedToken)
    const user = ref<User | null>(storedUser ? normalizeUser(JSON.parse(storedUser)) : null)
    const message = ref<string | null>(null)
    const messageType = ref<'success' | 'error' | null>(null)

    const isAuthenticated = computed(() => !!token.value && !!user.value)
    const isAdmin = computed(() => user.value?.role === 'ADMIN')

    function clearMessage() {
        message.value = null
        messageType.value = null
    }

    function setAuth(authToken: string, userData: User) {
        token.value = authToken
        user.value = userData
        localStorage.setItem('token', authToken)
        localStorage.setItem('user', JSON.stringify(userData))
    }

    function clearAuth() {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    function setUserAvatar(imageUrl: string | null) {
        if (!user.value) return
        user.value = {
            ...user.value,
            imageUrl
        }
        localStorage.setItem('user', JSON.stringify(user.value))
    }

    async function register(email: string, password: string) {
        clearMessage()

        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })

        if (!res.ok) {
            const err = await res.json()
            message.value = err.error || 'Registrering mislyktes'
            messageType.value = 'error'
            throw new Error(err.error || 'Registration failed')
        }

        const data = await res.json()
        setAuth(data.sessionId, data.user)
        message.value = 'Bruker opprettet! Velkommen!'
        messageType.value = 'success'
    }

    async function login(email: string, password: string) {
        clearMessage()

        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })

        if (!res.ok) {
            const err = await res.json()
            message.value = err.error || 'Innlogging mislyktes'
            messageType.value = 'error'
            throw new Error(err.error || 'Login failed')
        }

        const data = await res.json()
        setAuth(data.sessionId, data.user)
        message.value = `Velkommen tilbake, ${data.user.username}!`
        messageType.value = 'success'
    }

    function logout() {
        clearAuth()
        message.value = 'Du er nå logget ut'
        messageType.value = 'success'
    }

    return {
        token,
        user,
        message,
        messageType,
        isAuthenticated,
        isAdmin,
        register,
        login,
        logout,
        clearMessage,
        setUserAvatar
    }
})
