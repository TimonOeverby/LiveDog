import { describe, expect, test } from 'bun:test'
import { generateToken, verifyToken } from '../../src/middleware/auth'

describe('auth middleware token helpers', () => {
    test('verifyToken returns null for malformed authorization headers', () => {
        expect(verifyToken(undefined)).toBeNull()
        expect(verifyToken(null)).toBeNull()
        expect(verifyToken('')).toBeNull()
        expect(verifyToken('Token abc')).toBeNull()
        expect(verifyToken('bearer abc')).toBeNull()
        expect(verifyToken('Bearer ')).toBeNull()
        expect(verifyToken('Bearer definitely.not-a-real.jwt')).toBeNull()
    })

    test('verifyToken returns payload for valid bearer token', () => {
        const token = generateToken('user-1', 'ADMIN')
        const payload = verifyToken(`Bearer ${token}`)

        expect(payload).not.toBeNull()
        expect(payload?.userId).toBe('user-1')
        expect(payload?.role).toBe('ADMIN')
    })
})
