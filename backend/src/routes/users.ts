import { Hono } from 'hono'
import { prisma } from '../../prisma/client'
import { authRequired } from '../middleware/auth'
import { isMissingUserImageColumn, isMissingUserUsernameColumn } from '../utils/prismaCompat'
import { hashPassword, verifyPassword } from '../utils/password'

const users = new Hono()

function usernameFromEmail(email: string): string {
    const localPart = email.split('@')[0] || 'user'
    const normalized = localPart.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20)
    return normalized || 'user'
}

// GET / - List users, optionally filtered by username query.
users.get('/', async (c) => {
    try {
        const search = (c.req.query('search') || '').trim()

        let allUsers: Array<{
            id: string
            username: string | null
            email: string
            imageUrl: string | null
            phoneNumber: string | null
            role: string
            createdAt: Date
            _count: { dogs: number }
        }>

        try {
            allUsers = await prisma.user.findMany({
                where: search
                    ? {
                          username: {
                              contains: search,
                              mode: 'insensitive'
                          }
                      }
                    : undefined,
                orderBy: {
                    username: 'asc'
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    imageUrl: true,
                    phoneNumber: true,
                    role: true,
                    createdAt: true,
                    _count: {
                        select: {
                            dogs: true
                        }
                    }
                }
            })
        } catch (error) {
            const missingImage = isMissingUserImageColumn(error)
            const missingUsername = isMissingUserUsernameColumn(error)

            if (!missingImage && !missingUsername) {
                throw error
            }

            if (missingImage && missingUsername) {
                const minimalUsers = await prisma.user.findMany({
                    where: search
                        ? {
                              email: {
                                  contains: search,
                                  mode: 'insensitive'
                              }
                          }
                        : undefined,
                    orderBy: {
                        email: 'asc'
                    },
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        phoneNumber: true,
                        createdAt: true,
                        _count: {
                            select: {
                                dogs: true
                            }
                        }
                    }
                })

                allUsers = minimalUsers.map((user) => ({
                    ...user,
                    username: usernameFromEmail(user.email),
                    imageUrl: null
                }))
            } else if (missingUsername) {
                const usersWithoutUsername = await prisma.user.findMany({
                    where: search
                        ? {
                              email: {
                                  contains: search,
                                  mode: 'insensitive'
                              }
                          }
                        : undefined,
                    orderBy: {
                        email: 'asc'
                    },
                    select: {
                        id: true,
                        email: true,
                        imageUrl: true,
                        phoneNumber: true,
                        role: true,
                        createdAt: true,
                        _count: {
                            select: {
                                dogs: true
                            }
                        }
                    }
                })

                allUsers = usersWithoutUsername.map((user) => ({
                    ...user,
                    username: usernameFromEmail(user.email)
                }))
            } else {
                const usersWithoutImage = await prisma.user.findMany({
                    where: search
                        ? {
                              username: {
                                  contains: search,
                                  mode: 'insensitive'
                              }
                          }
                        : undefined,
                    orderBy: {
                        username: 'asc'
                    },
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                        phoneNumber: true,
                        createdAt: true,
                        _count: {
                            select: {
                                dogs: true
                            }
                        }
                    }
                })

                allUsers = usersWithoutImage.map((user) => ({ ...user, imageUrl: null }))
            }
        }

        return c.json({
            users: allUsers.map((user) => ({
                id: user.id,
                username: user.username || usernameFromEmail(user.email),
                email: user.email,
                imageUrl: user.imageUrl,
                phoneNumber: user.phoneNumber,
                role: user.role,
                createdAt: user.createdAt,
                dogsCount: user._count.dogs
            }))
        })
    } catch (error) {
        console.error('Error fetching users:', error)
        return c.json({ error: 'Failed to fetch users' }, 500)
    }
})

// GET /:id - Full user profile including dogs and competition entries.
users.get('/:id', async (c) => {
    try {
        const id = c.req.param('id')

        let user: {
            id: string
            username: string | null
            email: string
            imageUrl: string | null
            phoneNumber: string | null
            role: string
            createdAt: Date
            dogs: Array<{
                id: string
                name: string
                breed: string
                description: string
                imageUrl: string | null
                createdAt: Date
                updatedAt: Date
                competitionEntries: Array<{
                    id: string
                    createdAt: Date
                    competition: {
                        id: string
                        name: string
                        startDate: Date
                        endDate: Date
                        status: string
                        createdAt: Date
                    }
                }>
            }>
        } | null

        try {
            user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    imageUrl: true,
                    phoneNumber: true,
                    role: true,
                    createdAt: true,
                    dogs: {
                        orderBy: {
                            name: 'asc'
                        },
                        select: {
                            id: true,
                            name: true,
                            breed: true,
                            description: true,
                            imageUrl: true,
                            createdAt: true,
                            updatedAt: true,
                            competitionEntries: {
                                orderBy: {
                                    createdAt: 'desc'
                                },
                                select: {
                                    id: true,
                                    createdAt: true,
                                    competition: {
                                        select: {
                                            id: true,
                                            name: true,
                                            startDate: true,
                                            endDate: true,
                                            status: true,
                                            createdAt: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        } catch (error) {
            const missingImage = isMissingUserImageColumn(error)
            const missingUsername = isMissingUserUsernameColumn(error)

            if (!missingImage && !missingUsername) {
                throw error
            }

            if (missingImage && missingUsername) {
                const minimalUser = await prisma.user.findUnique({
                    where: { id },
                    select: {
                        id: true,
                        email: true,
                        phoneNumber: true,
                        role: true,
                        createdAt: true,
                        dogs: {
                            orderBy: {
                                name: 'asc'
                            },
                            select: {
                                id: true,
                                name: true,
                                breed: true,
                                description: true,
                                imageUrl: true,
                                createdAt: true,
                                updatedAt: true,
                                competitionEntries: {
                                    orderBy: {
                                        createdAt: 'desc'
                                    },
                                    select: {
                                        id: true,
                                        createdAt: true,
                                        competition: {
                                            select: {
                                                id: true,
                                                name: true,
                                                startDate: true,
                                                endDate: true,
                                                status: true,
                                                createdAt: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                })

                user = minimalUser
                    ? {
                          ...minimalUser,
                          username: usernameFromEmail(minimalUser.email),
                          imageUrl: null,
                          phoneNumber: minimalUser.phoneNumber
                      }
                    : null
            } else if (missingUsername) {
                const withoutUsername = await prisma.user.findUnique({
                    where: { id },
                    select: {
                        id: true,
                        email: true,
                        imageUrl: true,
                        phoneNumber: true,
                        role: true,
                        createdAt: true,
                        dogs: {
                            orderBy: {
                                name: 'asc'
                            },
                            select: {
                                id: true,
                                name: true,
                                breed: true,
                                description: true,
                                imageUrl: true,
                                createdAt: true,
                                updatedAt: true,
                                competitionEntries: {
                                    orderBy: {
                                        createdAt: 'desc'
                                    },
                                    select: {
                                        id: true,
                                        createdAt: true,
                                        competition: {
                                            select: {
                                                id: true,
                                                name: true,
                                                startDate: true,
                                                endDate: true,
                                                status: true,
                                                createdAt: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                })

                user = withoutUsername
                    ? {
                          ...withoutUsername,
                          username: usernameFromEmail(withoutUsername.email)
                      }
                    : null
            } else {
                const withoutImage = await prisma.user.findUnique({
                    where: { id },
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        phoneNumber: true,
                        role: true,
                        createdAt: true,
                        dogs: {
                            orderBy: {
                                name: 'asc'
                            },
                            select: {
                                id: true,
                                name: true,
                                breed: true,
                                description: true,
                                imageUrl: true,
                                createdAt: true,
                                updatedAt: true,
                                competitionEntries: {
                                    orderBy: {
                                        createdAt: 'desc'
                                    },
                                    select: {
                                        id: true,
                                        createdAt: true,
                                        competition: {
                                            select: {
                                                id: true,
                                                name: true,
                                                startDate: true,
                                                endDate: true,
                                                status: true,
                                                createdAt: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                })

                user = withoutImage ? { ...withoutImage, imageUrl: null } : null
            }
        }

        if (!user) {
            return c.json({ error: 'User not found' }, 404)
        }

        return c.json({
            user: {
                ...user,
                username: user.username || usernameFromEmail(user.email)
            }
        })
    } catch (error) {
        console.error('Error fetching user profile:', error)
        return c.json({ error: 'Failed to fetch user profile' }, 500)
    }
})

// PUT /:id/avatar - Update own avatar URL.
users.put('/:id/avatar', authRequired, async (c) => {
    try {
        const id = c.req.param('id')
        const requester = c.get('user') as { userId: string; role: string }

        if (requester.userId !== id && requester.role !== 'ADMIN') {
            return c.json({ error: 'Forbidden' }, 403)
        }

        const { imageUrl } = await c.req.json()
        const normalizedImageUrl =
            typeof imageUrl === 'string' && imageUrl.trim().length > 0 ? imageUrl.trim() : null

        const updated = await prisma.user.update({
            where: { id },
            data: {
                imageUrl: normalizedImageUrl
            },
            select: {
                id: true,
                username: true,
                email: true,
                imageUrl: true,
                role: true
            }
        })

        return c.json({
            user: {
                ...updated,
                username: updated.username || usernameFromEmail(updated.email)
            }
        })
    } catch (error) {
        console.error('Error updating user avatar:', error)
        if (isMissingUserImageColumn(error)) {
            return c.json(
                {
                    error: 'Database mangler imageUrl-kolonne. Kjor Prisma migration for a aktivere avatar.'
                },
                500
            )
        }
        return c.json({ error: 'Failed to update avatar' }, 500)
    }
})

//change email and password
users.put('/:id/credentials', authRequired, async (c) => {
    try {
        const id = c.req.param('id')
        const requester = c.get('user') as { userId: string; role: string }

        if (requester.userId !== id && requester.role !== 'ADMIN') {
            return c.json({ error: 'Forbidden' }, 403)
        }

        const { currentPassword, newEmail, newPassword } = await c.req.json()

        // verify current password
        const user = await prisma.user.findUnique({ where: { id } })
        if (!user) return c.json({ error: 'User not found' }, 404)

        const valid = await verifyPassword(currentPassword, user.password)
        if (!valid) return c.json({ error: 'Feil nåværende passord' }, 401)

        const data: { email?: string; password?: string } = {}

        if (newEmail && newEmail !== user.email) {
            data.email = newEmail
        }
        if (newPassword) {
            data.password = await hashPassword(newPassword)
        }

        if (Object.keys(data).length === 0) {
            return c.json({ error: 'Ingen endringer oppgitt' }, 400)
        }

        const updated = await prisma.user.update({
            where: { id },
            data,
            select: { id: true, email: true, username: true }
        })

        return c.json({ user: updated })
    } catch (error) {
        console.error('Error updating credentials:', error)
        return c.json({ error: 'Failed to update credentials' }, 500)
    }
})

export default users
