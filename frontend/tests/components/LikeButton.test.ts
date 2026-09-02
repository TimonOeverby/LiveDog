import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { nextTick } from 'vue'
import LikeButton from '../../src/components/LikeButton.vue'

const hoisted = vi.hoisted(() => ({
    state: { isAuthenticated: true },
    getLikesMock: vi.fn(),
    likeDogMock: vi.fn(),
    unlikeDogMock: vi.fn()
}))

vi.mock('../../src/stores/auth', () => ({
    useAuthStore: () => ({
        get isAuthenticated() {
            return hoisted.state.isAuthenticated
        }
    })
}))

vi.mock('../../src/services/likes', () => ({
    getLikes: hoisted.getLikesMock,
    likeDog: hoisted.likeDogMock,
    unlikeDog: hoisted.unlikeDogMock
}))

describe('LikeButton', () => {
    beforeEach(() => {
        hoisted.state.isAuthenticated = true
        hoisted.getLikesMock.mockReset()
        hoisted.likeDogMock.mockReset()
        hoisted.unlikeDogMock.mockReset()
        hoisted.getLikesMock.mockResolvedValue({ count: 0, userLiked: false })
        hoisted.likeDogMock.mockResolvedValue({ success: true })
        hoisted.unlikeDogMock.mockResolvedValue({ success: true })
    })

    test('loads likes on mount and toggles like when authenticated', async () => {
        const wrapper = mount(LikeButton, {
            props: {
                competitionId: 'comp-1',
                dogId: 'dog-1'
            }
        })

        await Promise.resolve()
        await Promise.resolve()
        await nextTick()

        expect(hoisted.getLikesMock).toHaveBeenCalledWith('comp-1', 'dog-1')
        expect(wrapper.text()).toContain('0')

        await wrapper.get('button').trigger('click')
        await nextTick()

        expect(hoisted.likeDogMock).toHaveBeenCalledWith('comp-1', 'dog-1')
        expect(wrapper.text()).toContain('1')
    })

    test('shows login hint when unauthenticated and does not call like endpoints', async () => {
        hoisted.state.isAuthenticated = false

        const wrapper = mount(LikeButton, {
            props: {
                competitionId: 'comp-1',
                dogId: 'dog-1'
            }
        })

        await Promise.resolve()
        await Promise.resolve()
        await nextTick()

        await wrapper.get('button').trigger('click')

        expect(wrapper.text()).toContain('Logg inn for å like')
        expect(hoisted.likeDogMock).not.toHaveBeenCalled()
        expect(hoisted.unlikeDogMock).not.toHaveBeenCalled()
    })
})
