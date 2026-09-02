import { describe, expect, test } from 'bun:test'
import { hashPassword, isBcryptHash, verifyPassword } from '../../src/utils/password'

describe('password utils', () => {
    test('isBcryptHash identifies bcrypt and legacy plaintext values', () => {
        expect(isBcryptHash('$2a$10$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuu')).toBe(true)
        expect(isBcryptHash('$2b$10$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuu')).toBe(true)
        expect(isBcryptHash('plain-text-password')).toBe(false)
    })

    test('hashPassword returns a bcrypt hash that can be verified', async () => {
        const hashed = await hashPassword('super-secret')

        expect(isBcryptHash(hashed)).toBe(true)
        expect(await verifyPassword('super-secret', hashed)).toBe(true)
        expect(await verifyPassword('wrong-password', hashed)).toBe(false)
    })

    test('verifyPassword supports legacy plaintext password comparison', async () => {
        expect(await verifyPassword('legacy', 'legacy')).toBe(true)
        expect(await verifyPassword('legacy', 'different')).toBe(false)
    })
})
