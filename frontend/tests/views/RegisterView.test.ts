import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { nextTick } from 'vue'
import RegisterView from '../../src/views/RegisterView.vue'

const pushMock = vi.fn()
const registerMock = vi.fn()

vi.mock('vue-router', () => ({
    useRouter: () => ({ push: pushMock })
}))

vi.mock('../../src/stores/auth', () => ({
    useAuthStore: () => ({
        register: registerMock,
        message: 'Konto opprettet!'
    })
}))

describe('RegisterView', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        pushMock.mockReset()
        registerMock.mockReset()
        registerMock.mockResolvedValue(undefined)
    })

    test('shows error when passwords do not match', async () => {
        const wrapper = mount(RegisterView, {
            global: { stubs: { RouterLink: true } }
        })

        await wrapper.get('#email').setValue('thor@example.com')
        await wrapper.get('#password').setValue('secret')
        await wrapper.get('#confirmPassword').setValue('different')
        await wrapper.get('form').trigger('submit.prevent')

        expect(registerMock).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('Passordene matcher ikke')
    })

    test('shows error when password is too short', async () => {
        const wrapper = mount(RegisterView, {
            global: { stubs: { RouterLink: true } }
        })

        await wrapper.get('#email').setValue('thor@example.com')
        await wrapper.get('#password').setValue('123')
        await wrapper.get('#confirmPassword').setValue('123')
        await wrapper.get('form').trigger('submit.prevent')

        expect(registerMock).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('Passordet må være minst 4 tegn')
    })

    test('submits valid registration and redirects home', async () => {
        const wrapper = mount(RegisterView, {
            global: { stubs: { RouterLink: true } }
        })

        await wrapper.get('#email').setValue('thor@example.com')
        await wrapper.get('#password').setValue('secret')
        await wrapper.get('#confirmPassword').setValue('secret')
        await wrapper.get('form').trigger('submit.prevent')
        await Promise.resolve()
        await nextTick()

        expect(registerMock).toHaveBeenCalledWith('thor@example.com', 'secret')
        expect(wrapper.text()).toContain('Konto opprettet!')

        vi.advanceTimersByTime(1500)
        await nextTick()

        expect(pushMock).toHaveBeenCalledWith('/')
    })
})
