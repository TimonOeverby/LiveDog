import bcrypt from 'bcryptjs'

const BCRYPT_PREFIX = '$2'
const SALT_ROUNDS = 10

export function isBcryptHash(value: string): boolean {
    return value.startsWith(BCRYPT_PREFIX)
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(candidate: string, storedPassword: string): Promise<boolean> {
    if (isBcryptHash(storedPassword)) {
        return bcrypt.compare(candidate, storedPassword)
    }

    return candidate === storedPassword
}
