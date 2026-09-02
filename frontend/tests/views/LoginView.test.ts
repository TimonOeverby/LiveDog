import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { nextTick } from 'vue'
import LoginView from '../../src/views/LoginView.vue'

const pushMock = vi.fn()
const loginMock = vi.fn()

vi.mock('vue-router', () => ({
    useRouter: () => ({ push: pushMock })
}))

vi.mock('../../src/stores/auth', () => ({
    useAuthStore: () => ({
        login: loginMock,
        message: 'Innlogging vellykket!'
    })
}))

describe('LoginView smoke tests', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        pushMock.mockReset()
        loginMock.mockReset()
        loginMock.mockResolvedValue(undefined)
    })

    test('submitting valid form logs in and redirects home', async () => {
        const wrapper = mount(LoginView, {
            global: {
                stubs: {
                    RouterLink: true
                }
            }
        })

        await wrapper.get('#email').setValue('thor@example.com')
        await wrapper.get('#password').setValue('secret')
        await wrapper.get('form').trigger('submit.prevent')
        await Promise.resolve()
        await nextTick()

        expect(loginMock).toHaveBeenCalledWith('thor@example.com', 'secret')
        expect(wrapper.text()).toContain('Innlogging vellykket!')

        vi.advanceTimersByTime(1500)
        await nextTick()

        expect(pushMock).toHaveBeenCalledWith('/')
    })
})
