import { Hono } from 'hono'
import { prisma } from '../../prisma/client'
import { adminAuth } from '../middleware/auth'

const admin = new Hono()
const LOW_ENROLLMENT_THRESHOLD = 3
const MAX_DASHBOARD_LIST_ITEMS = 8

function addDays(baseDate: Date, days: number): Date {
    const nextDate = new Date(baseDate)
    nextDate.setDate(nextDate.getDate() + days)
    return nextDate
}

function monthKey(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

admin.use('*', adminAuth)

admin.delete('/comments/:commentId', async (c) => {
    try {
        const commentId = c.req.param('commentId')

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { id: true }
        })

        if (!comment) {
            return c.json({ error: 'Comment not found' }, 404)
        }

        await prisma.comment.delete({
            where: { id: commentId }
        })

        return c.json({ deleted: true })
    } catch (error) {
        console.error('Error deleting comment as admin:', error)
        return c.json({ error: 'Failed to delete comment' }, 500)
    }
})

admin.delete('/users/:userId/avatar', async (c) => {
    try {
        const userId = c.req.param('userId')

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true }
        })

        if (!user) {
            return c.json({ error: 'User not found' }, 404)
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                imageUrl: null
            }
        })

        return c.json({ cleared: true })
    } catch (error) {
        console.error('Error clearing user avatar as admin:', error)
        return c.json({ error: 'Failed to clear user avatar' }, 500)
    }
})

admin.delete('/dogs/:dogId/description', async (c) => {
    try {
        const dogId = c.req.param('dogId')

        const dog = await prisma.dog.findUnique({
            where: { id: dogId },
            select: { id: true }
        })

        if (!dog) {
            return c.json({ error: 'Dog not found' }, 404)
        }

        await prisma.dog.update({
            where: { id: dogId },
            data: {
                description: ''
            }
        })

        return c.json({ cleared: true })
    } catch (error) {
        console.error('Error clearing dog description as admin:', error)
        return c.json({ error: 'Failed to clear dog description' }, 500)
    }
})

admin.delete('/competitions/:competitionId/entries/:entryId', async (c) => {
    try {
        const competitionId = c.req.param('competitionId')
        const entryId = c.req.param('entryId')

        const entry = await prisma.competitionEntry.findFirst({
            where: {
                id: entryId,
                competitionId
            },
            select: { id: true }
        })

        if (!entry) {
            return c.json({ error: 'Competition entry not found' }, 404)
        }

        await prisma.competitionEntry.delete({
            where: { id: entryId }
        })

        return c.json({ removed: true })
    } catch (error) {
        console.error('Error removing competition entry as admin:', error)
        return c.json({ error: 'Failed to remove competition entry' }, 500)
    }
})

admin.get('/dashboard', async (c) => {
    try {
        const now = new Date()
        const in7Days = addDays(now, 7)
        const in30Days = addDays(now, 30)
        const thirtyDaysAgo = addDays(now, -30)
        const requestedThreshold = Number(c.req.query('lowEnrollmentThreshold'))
        const lowEnrollmentThreshold =
            Number.isFinite(requestedThreshold) && requestedThreshold > 0
                ? Math.floor(requestedThreshold)
                : LOW_ENROLLMENT_THRESHOLD

        const [
            totalDogs,
            activeCompetitions,
            upcomingCompetitions,
            users,
            recentUsersCount,
            incompleteDogProfilesCount,
            incompleteDogProfilesRaw,
            mostActiveUsersRaw,
            dogs,
            competitions
        ] = await Promise.all([
            prisma.dog.count(),
            prisma.competition.findMany({
                where: {
                    startDate: {
                        lte: now
                    },
                    endDate: {
                        gte: now
                    }
                },
                orderBy: {
                    startDate: 'asc'
                },
                include: {
                    entries: {
                        orderBy: {
                            createdAt: 'asc'
                        },
                        include: {
                            dog: {
                                select: {
                                    id: true,
                                    name: true,
                                    breed: true,
                                    imageUrl: true,
                                    owner: {
                                        select: {
                                            id: true,
                                            username: true,
                                            email: true,
                                            imageUrl: true,
                                            role: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }),
            prisma.competition.findMany({
                where: {
                    startDate: {
                        gt: now,
                        lte: in30Days
                    }
                },
                orderBy: {
                    startDate: 'asc'
                },
                include: {
                    _count: {
                        select: {
                            entries: true
                        }
                    }
                }
            }),
            prisma.user.findMany({
                orderBy: {
                    createdAt: 'asc'
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
            }),
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: thirtyDaysAgo
                    }
                }
            }),
            prisma.dog.count({
                where: {
                    OR: [
                        {
                            imageUrl: null
                        },
                        {
                            description: ''
                        }
                    ]
                }
            }),
            prisma.dog.findMany({
                where: {
                    OR: [
                        {
                            imageUrl: null
                        },
                        {
                            description: ''
                        }
                    ]
                },
                take: MAX_DASHBOARD_LIST_ITEMS,
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    id: true,
                    name: true,
                    breed: true,
                    description: true,
                    imageUrl: true,
                    owner: {
                        select: {
                            id: true,
                            username: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.user.findMany({
                orderBy: [
                    {
                        dogs: {
                            _count: 'desc'
                        }
                    },
                    {
                        createdAt: 'asc'
                    }
                ],
                take: 5,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    imageUrl: true,
                    role: true,
                    _count: {
                        select: {
                            dogs: true,
                            comments: true,
                            likes: true,
                            competitionRatings: true
                        }
                    }
                }
            }),
            prisma.dog.findMany({
                select: {
                    createdAt: true
                }
            }),
            prisma.competition.findMany({
                orderBy: {
                    startDate: 'asc'
                },
                include: {
                    _count: {
                        select: {
                            entries: true
                        }
                    }
                }
            })
        ])

        const activeParticipantDogIds = new Set<string>()
        const activeCompetitionSummaries = activeCompetitions.map((competition) => ({
            id: competition.id,
            name: competition.name,
            startDate: competition.startDate,
            endDate: competition.endDate,
            participantCount: competition.entries.length,
            participants: competition.entries.map((entry) => {
                activeParticipantDogIds.add(entry.dog.id)

                return {
                    id: entry.id,
                    joinedAt: entry.createdAt,
                    dog: {
                        id: entry.dog.id,
                        name: entry.dog.name,
                        breed: entry.dog.breed,
                        imageUrl: entry.dog.imageUrl
                    },
                    owner: {
                        id: entry.dog.owner.id,
                        username:
                            entry.dog.owner.username ??
                            entry.dog.owner.email.split('@')[0] ??
                            'Ukjent',
                        email: entry.dog.owner.email,
                        imageUrl: entry.dog.owner.imageUrl,
                        role: entry.dog.owner.role
                    }
                }
            })
        }))

        const activeCompetitionDogCount = activeParticipantDogIds.size
        const percentageOfDogsInActiveCompetitions =
            totalDogs === 0 ? 0 : (activeCompetitionDogCount / totalDogs) * 100
        const totalUsers = users.length
        const averageDogsPerUser = totalUsers === 0 ? 0 : totalDogs / totalUsers
        const upcomingCompetitionsNext7Days = upcomingCompetitions.filter(
            (competition) => competition.startDate <= in7Days
        ).length
        const upcomingCompetitionsNext30Days = upcomingCompetitions.length
        const lowEnrollmentCompetitions = competitions
            .filter((competition) => competition.startDate > now)
            .filter((competition) => competition._count.entries < lowEnrollmentThreshold)
            .map((competition) => ({
                id: competition.id,
                name: competition.name,
                startDate: competition.startDate,
                participantCount: competition._count.entries
            }))
            .slice(0, MAX_DASHBOARD_LIST_ITEMS)

        const monthsWithCompetitions = new Set(
            competitions.map(({ startDate }) => {
                return monthKey(startDate)
            })
        )
        const averageCompetitionsPerMonth =
            monthsWithCompetitions.size === 0
                ? 0
                : competitions.length / monthsWithCompetitions.size

        const dogMonthBuckets = new Map<string, number>()
        dogs.forEach(({ createdAt }) => {
            const key = monthKey(createdAt)
            dogMonthBuckets.set(key, (dogMonthBuckets.get(key) ?? 0) + 1)
        })

        const userMonthBuckets = new Map<string, number>()
        users.forEach((user) => {
            const key = monthKey(user.createdAt)
            userMonthBuckets.set(key, (userMonthBuckets.get(key) ?? 0) + 1)
        })

        const monthlyNewDogs = Array.from(dogMonthBuckets.entries())
            .sort(([left], [right]) => left.localeCompare(right))
            .slice(-6)
            .map(([month, count]) => ({ month, count }))

        const monthlyNewUsers = Array.from(userMonthBuckets.entries())
            .sort(([left], [right]) => left.localeCompare(right))
            .slice(-6)
            .map(([month, count]) => ({ month, count }))

        const mostActiveUsers = mostActiveUsersRaw.map((user) => ({
            id: user.id,
            username: user.username ?? user.email.split('@')[0] ?? 'Ukjent',
            email: user.email,
            imageUrl: user.imageUrl,
            role: user.role,
            dogsCount: user._count.dogs,
            commentsCount: user._count.comments,
            likesCount: user._count.likes,
            ratingsCount: user._count.competitionRatings,
            activityScore:
                user._count.dogs +
                user._count.comments +
                user._count.likes +
                user._count.competitionRatings
        }))

        const incompleteDogProfiles = incompleteDogProfilesRaw.map((dog) => ({
            id: dog.id,
            name: dog.name,
            breed: dog.breed,
            owner: {
                id: dog.owner.id,
                username: dog.owner.username ?? dog.owner.email.split('@')[0] ?? 'Ukjent',
                email: dog.owner.email
            },
            missingImage: !dog.imageUrl,
            missingDescription: dog.description.trim().length === 0
        }))

        return c.json({
            overview: {
                totalDogs,
                totalUsers,
                totalCompetitions: competitions.length,
                activeCompetitionsCount: activeCompetitions.length,
                activeCompetitionDogCount,
                percentageOfDogsInActiveCompetitions,
                averageDogsPerUser,
                averageCompetitionsPerMonth,
                upcomingCompetitionsNext7Days,
                upcomingCompetitionsNext30Days,
                recentUsersCount,
                incompleteDogProfilesCount,
                lowEnrollmentCompetitionsCount: lowEnrollmentCompetitions.length,
                lowEnrollmentThreshold
            },
            activeCompetitions: activeCompetitionSummaries,
            upcomingCompetitions: upcomingCompetitions.map((competition) => ({
                id: competition.id,
                name: competition.name,
                startDate: competition.startDate,
                endDate: competition.endDate,
                participantCount: competition._count.entries
            })),
            lowEnrollmentCompetitions,
            incompleteDogProfiles,
            users: users.map((user) => ({
                id: user.id,
                username: user.username ?? user.email.split('@')[0] ?? 'Ukjent',
                email: user.email,
                imageUrl: user.imageUrl,
                phoneNumber: user.phoneNumber,
                role: user.role,
                createdAt: user.createdAt,
                dogsCount: user._count.dogs
            })),
            mostActiveUsers,
            monthlyNewDogs,
            monthlyNewUsers
        })
    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error)
        return c.json({ error: 'Failed to fetch admin dashboard stats' }, 500)
    }
})

export default admin
