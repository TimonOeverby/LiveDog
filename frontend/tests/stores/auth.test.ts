import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../../src/stores/auth'

describe('auth store smoke tests', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        localStorage.clear()
    })

    test('login success stores token and user', async () => {
        const mockResponse = {
            sessionId: 'session-token',
            user: {
                id: 'user-1',
                username: 'thor',
                email: 'thor@example.com',
                role: 'USER',
                imageUrl: null
            }
        }

        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        })
        vi.stubGlobal('fetch', fetchMock)

        const authStore = useAuthStore()
        await authStore.login('thor@example.com', 'secret')

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(authStore.token).toBe('session-token')
        expect(authStore.user?.email).toBe('thor@example.com')
        expect(authStore.isAuthenticated).toBe(true)
    })

    test('login failure sets error message and throws', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Invalid credentials' })
        })
        vi.stubGlobal('fetch', fetchMock)

        const authStore = useAuthStore()

        await expect(authStore.login('thor@example.com', 'wrong')).rejects.toThrow(
            'Invalid credentials'
        )
        expect(authStore.messageType).toBe('error')
        expect(authStore.message).toBe('Invalid credentials')
    })

    test('logout clears auth state and local storage', () => {
        localStorage.setItem('token', 'session-token')
        localStorage.setItem(
            'user',
            JSON.stringify({
                id: 'user-1',
                username: 'thor',
                email: 'thor@example.com',
                role: 'USER'
            })
        )

        const authStore = useAuthStore()
        authStore.logout()

        expect(authStore.token).toBeNull()
        expect(authStore.user).toBeNull()
        expect(localStorage.getItem('token')).toBeNull()
        expect(localStorage.getItem('user')).toBeNull()
    })

    test('register success stores token and user', async () => {
        const mockResponse = {
            sessionId: 'register-token',
            user: {
                id: 'user-2',
                username: 'newuser',
                email: 'new@example.com',
                role: 'USER',
                imageUrl: null
            }
        }

        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        })
        vi.stubGlobal('fetch', fetchMock)

        const authStore = useAuthStore()
        await authStore.register('new@example.com', 'secret')

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(authStore.token).toBe('register-token')
        expect(authStore.user?.username).toBe('newuser')
        expect(authStore.messageType).toBe('success')
    })

    test('register failure sets error message and throws', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'User already exists' })
        })
        vi.stubGlobal('fetch', fetchMock)

        const authStore = useAuthStore()

        await expect(authStore.register('new@example.com', 'secret')).rejects.toThrow(
            'User already exists'
        )
        expect(authStore.messageType).toBe('error')
        expect(authStore.message).toBe('User already exists')
    })

    test('setUserAvatar updates user state and local storage', () => {
        localStorage.setItem(
            'user',
            JSON.stringify({
                id: 'user-1',
                username: 'thor',
                email: 'thor@example.com',
                role: 'USER',
                imageUrl: null
            })
        )

        const authStore = useAuthStore()
        authStore.setUserAvatar('https://example.com/avatar.png')

        expect(authStore.user?.imageUrl).toBe('https://example.com/avatar.png')

        const stored = JSON.parse(localStorage.getItem('user') || '{}')
        expect(stored.imageUrl).toBe('https://example.com/avatar.png')
    })
})
