import { Hono } from 'hono'
import { generateToken } from '../middleware/auth'
import { prisma } from '../../prisma/client'
import { isMissingUserImageColumn, isMissingUserUsernameColumn } from '../utils/prismaCompat'
import { hashPassword, isBcryptHash, verifyPassword } from '../utils/password'
const auth = new Hono()

function usernameFromEmail(email: string): string {
    const localPart = email.split('@')[0] || 'user'
    const normalized = localPart.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20)
    return normalized || 'user'
}

async function generateUniqueUsername(email: string): Promise<string> {
    const base = usernameFromEmail(email)
    let candidate = base
    let suffix = 1

    while (true) {
        let existing: { id: string } | null = null
        try {
            existing = await prisma.user.findUnique({
                where: { username: candidate },
                select: { id: true }
            })
        } catch (error) {
            if (isMissingUserUsernameColumn(error)) {
                return base
            }
            throw error
        }
        if (!existing) {
            return candidate
        }
        candidate = `${base}${suffix}`
        suffix += 1
    }
}

auth.post('/register', async (c) => {
    try {
        const { email, password, role } = await c.req.json()

        if (!email || !password) {
            return c.json({ error: 'Email and password required' }, 400)
        }

        const existing = await prisma.user.findUnique({
            where: { email },
            select: { id: true }
        })
        if (existing) {
            return c.json({ error: 'User already exists' }, 409)
        }

        const hashedPassword = await hashPassword(password)
        const username = await generateUniqueUsername(email)
        let user: {
            id: string
            username: string | null
            email: string
            role: string
            imageUrl: string | null
        }

        try {
            const created = await prisma.user.create({
                data: {
                    username,
                    email,
                    password: hashedPassword,
                    role: role || 'USER'
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    imageUrl: true
                }
            })

            user = created
        } catch (error) {
            if (!isMissingUserImageColumn(error)) {
                throw error
            }

            const created = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: role || 'USER'
                },
                select: {
                    id: true,
                    email: true,
                    role: true
                }
            })

            user = {
                ...created,
                username: usernameFromEmail(created.email),
                imageUrl: null
            }
        }

        const token = generateToken(user.id, user.role)

        return c.json(
            {
                sessionId: token, // Kept for frontend compatibility
                token: token,
                user: {
                    id: user.id,
                    username: user.username || usernameFromEmail(user.email),
                    email: user.email,
                    imageUrl: user.imageUrl,
                    role: user.role as 'ADMIN' | 'USER'
                }
            },
            201
        )
    } catch (error) {
        console.error('Register error:', error)
        return c.json({ error: 'Failed to register' }, 500)
    }
})

auth.post('/login', async (c) => {
    try {
        const { email, password } = await c.req.json()

        if (!email || !password) {
            return c.json({ error: 'Email and password required' }, 400)
        }

        let user: {
            id: string
            username: string | null
            email: string
            password: string
            role: string
            imageUrl: string | null
        } | null = null

        try {
            const found = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    password: true,
                    role: true,
                    imageUrl: true
                }
            })
            user = found
        } catch (error) {
            if (!isMissingUserImageColumn(error)) {
                throw error
            }

            const found = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    role: true
                }
            })
            user = found
                ? { ...found, username: usernameFromEmail(found.email), imageUrl: null }
                : null
        }

        if (!user || !(await verifyPassword(password, user.password))) {
            return c.json({ error: 'Invalid credentials' }, 401)
        }

        // Upgrade legacy plain-text passwords the first time the user logs in successfully.
        if (!isBcryptHash(user.password)) {
            await prisma.user.update({
                where: { id: user.id },
                data: { password: await hashPassword(password) }
            })
        }

        const token = generateToken(user.id, user.role)

        return c.json({
            sessionId: token, // Kept for frontend compatibility
            token: token,
            user: {
                id: user.id,
                username: user.username || usernameFromEmail(user.email),
                email: user.email,
                imageUrl: user.imageUrl,
                role: user.role as 'ADMIN' | 'USER'
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        return c.json({ error: 'Failed to login' }, 500)
    }
})

export default auth
