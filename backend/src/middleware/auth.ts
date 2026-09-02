import jwt from 'jsonwebtoken'
import type { Context, Next } from 'hono'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export function verifyToken(
    authHeader: string | null | undefined
): { userId: string; role: string } | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.substring(7)

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
        return decoded
    } catch (error) {
        return null
    }
}

export function generateToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' })
}

export async function adminAuth(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization')
    const user = verifyToken(authHeader)

    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    if (user.role !== 'ADMIN') {
        return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    await next()
}

export async function authRequired(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization')
    const user = verifyToken(authHeader)

    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    // Lagre brukerinfo i request-context for videre bruk i ruter
    c.set('user', user)
    await next()
}
