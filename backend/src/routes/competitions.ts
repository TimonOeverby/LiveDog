import { Hono } from 'hono'
import { prisma } from '../../prisma/client'
import { adminAuth, authRequired } from '../middleware/auth'
import {
    isMissingCompetitionRatingStorage,
    isMissingUserImageColumn,
    isPrismaErrorCode
} from '../utils/prismaCompat'
const competitions = new Hono()

// GET / - List all competitions
competitions.get('/', async (c) => {
    try {
        const allCompetitions = await prisma.competition.findMany({
            orderBy: {
                startDate: 'desc'
            }
        })
        return c.json({ competitions: allCompetitions })
    } catch (error) {
        console.error('Error fetching competitions:', error)
        return c.json({ error: 'Failed to fetch competitions' }, 500)
    }
})

// GET /:id/participants - List deltakere for en konkurranse
competitions.get('/:id/participants', async (c) => {
    try {
        const id = c.req.param('id')

        const competition = await prisma.competition.findUnique({
            where: { id }
        })

        if (!competition) {
            return c.json({ error: 'Competition not found' }, 404)
        }

        // Henter deltakere med hund + eier slik at navn vises i klienten
        let participants: any[]

        try {
            participants = await prisma.competitionEntry.findMany({
                where: { competitionId: id },
                orderBy: { createdAt: 'asc' },
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
                                    email: true,
                                    imageUrl: true
                                }
                            }
                        }
                    }
                }
            })
        } catch (error) {
            if (!isMissingUserImageColumn(error)) {
                throw error
            }

            const withoutUserImage = await prisma.competitionEntry.findMany({
                where: { competitionId: id },
                orderBy: { createdAt: 'asc' },
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
                                    email: true
                                }
                            }
                        }
                    }
                }
            })

            participants = withoutUserImage.map((entry) => ({
                ...entry,
                dog: {
                    ...entry.dog,
                    owner: entry.dog.owner ? { ...entry.dog.owner, imageUrl: null } : null
                }
            }))
        }

        return c.json({ participants })
    } catch (error) {
        console.error('Error fetching participants:', error)
        return c.json({ error: 'Failed to fetch participants' }, 500)
    }
})

// POST /:id/entries - Registrer hund før påmeldingsfrist (startDate)
competitions.post('/:id/entries', authRequired, async (c) => {
    try {
        const competitionId = c.req.param('id')
        const { dogId } = await c.req.json()

        if (!dogId) {
            return c.json({ error: 'Dog ID is required' }, 400)
        }

        const competition = await prisma.competition.findUnique({
            where: { id: competitionId }
        })

        if (!competition) {
            return c.json({ error: 'Competition not found' }, 404)
        }

        const now = new Date()
        // Påmeldingsfrist er ved konkurransestart
        if (now >= competition.startDate) {
            return c.json({ error: 'Registration deadline has passed' }, 400)
        }

        const dog = await prisma.dog.findUnique({
            where: { id: dogId }
        })

        if (!dog) {
            return c.json({ error: 'Dog not found' }, 404)
        }

        const user = c.get('user') as { userId: string; role: string }

        // Sikkerhet: brukeren kan bare melde på egne hunder
        if (dog.ownerId !== user.userId) {
            return c.json({ error: 'Forbidden - not your dog' }, 403)
        }

        // Hindrer duplikate påmeldinger
        const existingEntry = await prisma.competitionEntry.findFirst({
            where: {
                competitionId,
                dogId
            }
        })

        if (existingEntry) {
            return c.json({ error: 'Dog already registered for this competition' }, 409)
        }

        let entry: any
        try {
            entry = await prisma.competitionEntry.create({
                data: {
                    competitionId,
                    dogId
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
                                    email: true,
                                    imageUrl: true
                                }
                            }
                        }
                    }
                }
            })
        } catch (error) {
            if (!isMissingUserImageColumn(error)) {
                throw error
            }

            const created = await prisma.competitionEntry.create({
                data: {
                    competitionId,
                    dogId
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
                                    email: true
                                }
                            }
                        }
                    }
                }
            })

            entry = {
                ...created,
                dog: {
                    ...created.dog,
                    owner: created.dog.owner ? { ...created.dog.owner, imageUrl: null } : null
                }
            }
        }

        return c.json({ entry }, 201)
    } catch (error) {
        console.error('Error registering dog:', error)
        return c.json({ error: 'Failed to register dog' }, 500)
    }
})

competitions.delete('/:id/entries/:entryId', authRequired, async (c) => {
    try {
        const competitionId = c.req.param('id')
        const entryId = c.req.param('entryId')
        const requester = c.get('user') as { userId: string; role: string }

        const entry = await prisma.competitionEntry.findFirst({
            where: {
                id: entryId,
                competitionId
            },
            include: {
                dog: {
                    select: {
                        id: true,
                        ownerId: true,
                        name: true
                    }
                },
                competition: {
                    select: {
                        id: true,
                        startDate: true
                    }
                }
            }
        })

        if (!entry) {
            return c.json({ error: 'Competition entry not found' }, 404)
        }

        if (requester.role !== 'ADMIN' && entry.dog.ownerId !== requester.userId) {
            return c.json({ error: 'Forbidden - not your dog' }, 403)
        }

        if (requester.role !== 'ADMIN' && new Date() >= entry.competition.startDate) {
            return c.json({ error: 'Kan bare trekke hunder før konkurransen starter' }, 400)
        }

        await prisma.competitionEntry.delete({
            where: { id: entryId }
        })

        return c.json({ removed: true })
    } catch (error) {
        console.error('Error withdrawing dog from competition:', error)
        return c.json({ error: 'Failed to withdraw dog from competition' }, 500)
    }
})

// POST /:id/ratings - Rate a dog in a competition (1-5 stars)
competitions.post('/:id/ratings', authRequired, async (c) => {
    try {
        const competitionId = c.req.param('id')
        const { dogId, score } = await c.req.json()

        if (!dogId || score === undefined || score === null) {
            return c.json({ error: 'Dog ID and score are required' }, 400)
        }

        if (!Number.isInteger(score) || score < 1 || score > 5) {
            return c.json({ error: 'Score must be an integer between 1 and 5' }, 400)
        }

        const entry = await prisma.competitionEntry.findFirst({
            where: {
                competitionId,
                dogId
            }
        })

        if (!entry) {
            return c.json({ error: 'Dog is not registered in this competition' }, 404)
        }

        const user = c.get('user') as { userId: string; role: string }
        const userExists = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { id: true }
        })

        if (!userExists) {
            return c.json({ error: 'Bruker finnes ikke lenger. Logg inn pa nytt.' }, 401)
        }

        const competitionRatingModel = (prisma as any).competitionRating
        if (!competitionRatingModel || typeof competitionRatingModel.upsert !== 'function') {
            return c.json(
                {
                    error: 'Rating-systemet er ikke aktivert i Prisma-klienten. Kjor prisma generate + migration.'
                },
                503
            )
        }

        let rating
        try {
            rating = await competitionRatingModel.upsert({
                where: {
                    userId_competitionEntryId: {
                        userId: user.userId,
                        competitionEntryId: entry.id
                    }
                },
                create: {
                    userId: user.userId,
                    competitionEntryId: entry.id,
                    score
                },
                update: {
                    score
                }
            })
        } catch (error) {
            if (!isMissingCompetitionRatingStorage(error)) {
                throw error
            }

            return c.json(
                {
                    error: 'Rating-systemet er ikke aktivert i databasen. Kjor Prisma migration.'
                },
                503
            )
        }

        return c.json({ rating })
    } catch (error) {
        console.error('Error rating competition dog:', error)
        if (isPrismaErrorCode(error, 'P2003')) {
            return c.json({ error: 'Ugyldig bruker eller data. Logg inn pa nytt.' }, 400)
        }
        return c.json({ error: 'Failed to submit rating' }, 500)
    }
})

// GET /:id/ratings - Get rating summary for a competition
competitions.get('/:id/ratings', async (c) => {
    try {
        const competitionId = c.req.param('id')

        const competition = await prisma.competition.findUnique({
            where: { id: competitionId }
        })

        if (!competition) {
            return c.json({ error: 'Competition not found' }, 404)
        }

        let entries: any[] = []
        let hasRatingStorage = true

        try {
            entries = await prisma.competitionEntry.findMany({
                where: { competitionId },
                orderBy: { createdAt: 'asc' },
                include: {
                    dog: {
                        select: {
                            id: true,
                            name: true,
                            breed: true,
                            imageUrl: true
                        }
                    },
                    ratings: {
                        select: {
                            score: true
                        }
                    }
                }
            })
        } catch (error) {
            if (!isMissingCompetitionRatingStorage(error)) {
                throw error
            }

            hasRatingStorage = false
            const withoutRatings = await prisma.competitionEntry.findMany({
                where: { competitionId },
                orderBy: { createdAt: 'asc' },
                include: {
                    dog: {
                        select: {
                            id: true,
                            name: true,
                            breed: true,
                            imageUrl: true
                        }
                    }
                }
            })

            entries = withoutRatings.map((entry) => ({ ...entry, ratings: [] }))
        }

        const ratingSummaries = entries.map((entry) => {
            const ratingCount = hasRatingStorage ? entry.ratings.length : 0
            const totalScore = entry.ratings.reduce((sum, rating) => sum + rating.score, 0)
            const averageRating =
                ratingCount > 0 ? Number((totalScore / ratingCount).toFixed(2)) : 0

            return {
                id: entry.id,
                competitionId: entry.competitionId,
                dogId: entry.dogId,
                dog: entry.dog,
                ratingCount,
                averageRating,
                entryCreatedAt: entry.createdAt
            }
        })

        const topRated = [...ratingSummaries]
            .filter((summary) => summary.ratingCount > 0)
            .sort((a, b) => {
                if (b.averageRating !== a.averageRating) {
                    return b.averageRating - a.averageRating
                }

                if (b.ratingCount !== a.ratingCount) {
                    return b.ratingCount - a.ratingCount
                }

                return a.entryCreatedAt.getTime() - b.entryCreatedAt.getTime()
            })[0]

        const summaries = ratingSummaries.map(({ entryCreatedAt, ...summary }) => summary)
        const topRatedDog = topRated
            ? {
                  id: topRated.id,
                  competitionId: topRated.competitionId,
                  dogId: topRated.dogId,
                  dog: topRated.dog,
                  ratingCount: topRated.ratingCount,
                  averageRating: topRated.averageRating
              }
            : null

        return c.json({ ratings: summaries, topRatedDog })
    } catch (error) {
        console.error('Error fetching competition ratings:', error)
        return c.json({ error: 'Failed to fetch ratings' }, 500)
    }
})

// POST / - Create competition (ADMIN only)
competitions.post('/', adminAuth, async (c) => {
    try {
        const { name, description, startDate, endDate } = await c.req.json()

        if (!name || !description || !startDate || !endDate) {
            return c.json(
                { error: 'Name, description, start date, and end date are required' },
                400
            )
        }

        const start = new Date(startDate)
        const end = new Date(endDate)

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return c.json({ error: 'Invalid date format' }, 400)
        }

        if (start >= end) {
            return c.json({ error: 'Start date must be before end date' }, 400)
        }

        const competition = await prisma.competition.create({
            data: {
                name,
                description,
                startDate: start,
                endDate: end,
                status: 'UPCOMING'
            }
        })

        return c.json({ competition }, 201)
    } catch (error) {
        console.error('Error creating competition:', error)
        return c.json({ error: 'Failed to create competition' }, 500)
    }
})

// DELETE /:id - Delete competition (ADMIN only)
competitions.delete('/:id', adminAuth, async (c) => {
    try {
        const id = c.req.param('id')

        const existingCompetition = await prisma.competition.findUnique({
            where: { id }
        })

        if (!existingCompetition) {
            return c.json({ error: 'Competition not found' }, 404)
        }

        await prisma.competition.delete({
            where: { id }
        })

        return c.json({ message: 'Competition deleted successfully' })
    } catch (error) {
        console.error('Error deleting competition:', error)
        return c.json({ error: 'Failed to delete competition' }, 500)
    }
})

// PUT /:id - Update competition (ADMIN only)
competitions.put('/:id', adminAuth, async (c) => {
    try {
        const id = c.req.param('id')
        const { name, description, startDate, endDate, status } = await c.req.json()

        const existingCompetition = await prisma.competition.findUnique({
            where: { id }
        })

        if (!existingCompetition) {
            return c.json({ error: 'Competition not found' }, 404)
        }

        const updateData: any = {}
        if (name) updateData.name = name
        if (description) updateData.description = description
        if (startDate) updateData.startDate = new Date(startDate)
        if (endDate) updateData.endDate = new Date(endDate)
        if (status) updateData.status = status

        const competition = await prisma.competition.update({
            where: { id },
            data: updateData
        })

        return c.json({ competition })
    } catch (error) {
        console.error('Error updating competition:', error)
        return c.json({ error: 'Failed to update competition' }, 500)
    }
})

// POST /:id/like/:dogId - Like a dog in competition
competitions.post('/:id/like/:dogId', authRequired, async (c) => {
    try {
        const competitionId = c.req.param('id')
        const dogId = c.req.param('dogId')
        const user = c.get('user') as { userId: string; role: string }
        const userId = user.userId

        // Verify dog is in this competition
        const entry = await prisma.competitionEntry.findFirst({
            where: { competitionId, dogId }
        })

        if (!entry) {
            return c.json({ error: 'Dog is not participating in this competition' }, 400)
        }

        // Check if already liked
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_dogId: {
                    userId,
                    dogId
                }
            }
        })

        if (existingLike) {
            return c.json({ error: 'Already liked this dog' }, 400)
        }

        const like = await prisma.like.create({
            data: {
                userId,
                dogId
            }
        })

        return c.json({ like, liked: true })
    } catch (error) {
        console.error('Error creating like:', error)
        return c.json({ error: 'Failed to like dog' }, 500)
    }
})

// DELETE /:id/like/:dogId - Unlike a dog
competitions.delete('/:id/like/:dogId', authRequired, async (c) => {
    try {
        const dogId = c.req.param('dogId')
        const user = c.get('user') as { userId: string; role: string }
        const userId = user.userId

        const existingLike = await prisma.like.findUnique({
            where: {
                userId_dogId: {
                    userId,
                    dogId
                }
            }
        })

        if (!existingLike) {
            return c.json({ error: 'Like not found' }, 404)
        }

        await prisma.like.delete({
            where: {
                userId_dogId: {
                    userId,
                    dogId
                }
            }
        })

        return c.json({ liked: false })
    } catch (error) {
        console.error('Error deleting like:', error)
        return c.json({ error: 'Failed to unlike dog' }, 500)
    }
})

// GET /:id/likes/:dogId - Get likes for a dog
competitions.get('/:id/likes/:dogId', async (c) => {
    try {
        const dogId = c.req.param('dogId')
        const userId = c.get('userId')

        const count = await prisma.like.count({
            where: { dogId }
        })

        let userLiked = false
        if (userId) {
            const userLike = await prisma.like.findUnique({
                where: {
                    userId_dogId: {
                        userId,
                        dogId
                    }
                }
            })
            userLiked = !!userLike
        }

        return c.json({ count, userLiked })
    } catch (error) {
        console.error('Error fetching likes:', error)
        return c.json({ error: 'Failed to fetch likes' }, 500)
    }
})

// POST /:id/comment/:dogId - Add comment to dog
competitions.post('/:id/comment/:dogId', authRequired, async (c) => {
    try {
        const competitionId = c.req.param('id')
        const dogId = c.req.param('dogId')
        const user = c.get('user') as { userId: string; role: string }
        const userId = user.userId
        const { content } = await c.req.json()

        if (!content || content.trim().length === 0) {
            return c.json({ error: 'Comment cannot be empty' }, 400)
        }

        if (content.length > 500) {
            return c.json({ error: 'Comment too long (max 500 characters)' }, 400)
        }

        // Verify dog is in this competition
        const entry = await prisma.competitionEntry.findFirst({
            where: { competitionId, dogId }
        })

        if (!entry) {
            return c.json({ error: 'Dog is not participating in this competition' }, 400)
        }

        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                userId,
                dogId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        imageUrl: true
                    }
                }
            }
        })

        return c.json({ comment })
    } catch (error) {
        console.error('Error creating comment:', error)
        return c.json({ error: 'Failed to add comment' }, 500)
    }
})

// GET /:id/comments/:dogId - Get comments for a dog
competitions.get('/:id/comments/:dogId', async (c) => {
    try {
        const dogId = c.req.param('dogId')

        const comments = await prisma.comment.findMany({
            where: { dogId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        imageUrl: true
                    }
                }
            }
        })

        return c.json({ comments })
    } catch (error) {
        console.error('Error fetching comments:', error)
        return c.json({ error: 'Failed to fetch comments' }, 500)
    }
})

// DELETE /:id/comment/:commentId - Delete own comment
competitions.delete('/:id/comment/:commentId', authRequired, async (c) => {
    try {
        const commentId = c.req.param('commentId')
        const user = c.get('user') as { userId: string; role: string }
        const userId = user.userId

        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        })

        if (!comment) {
            return c.json({ error: 'Comment not found' }, 404)
        }

        if (comment.userId !== userId) {
            return c.json({ error: 'Can only delete your own comments' }, 403)
        }

        await prisma.comment.delete({
            where: { id: commentId }
        })

        return c.json({ deleted: true })
    } catch (error) {
        console.error('Error deleting comment:', error)
        return c.json({ error: 'Failed to delete comment' }, 500)
    }
})

export default competitions
