import { afterEach, beforeEach, vi } from 'vitest'

afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllTimers()
    vi.useRealTimers()
})

beforeEach(() => {
    localStorage.clear()
})
