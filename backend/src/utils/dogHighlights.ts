import { prisma } from '../../prisma/client'
import { isMissingUserImageColumn } from './prismaCompat'

export type DogBadgeKey =
    | 'DOUBLE_TOP_THREE'
    | 'COMPETITION_WINNER'
    | 'MORE_THAN_THREE_COMMENTS'
    | 'MORE_THAN_FIVE_LIKES'

export interface DogBadge {
    key: DogBadgeKey
    label: string
    description: string
}

export interface HighlightDog {
    id: string
    name: string
    breed: string
    description: string
    imageUrl: string | null
    owner: {
        id: string
        username: string
        email: string
        imageUrl: string | null
    } | null
    likesCount: number
    commentsCount: number
    top3Finishes: number
    weeklyEngagementScore: number
    badgeCount: number
    badges: DogBadge[]
}

export interface DogHighlightsPayload {
    generatedAt: string
    dogOfTheWeek: HighlightDog | null
    mostBadgedDogs: HighlightDog[]
    nextCompetition: {
        id: string
        name: string
        startDate: string
        endDate: string
    } | null
    allDogs: HighlightDog[]
}

const BADGE_META: Record<DogBadgeKey, DogBadge> = {
    DOUBLE_TOP_THREE: {
        key: 'DOUBLE_TOP_THREE',
        label: '2x topp 3',
        description: 'Har endt i topp 3 minst to ganger'
    },
    COMPETITION_WINNER: {
        key: 'COMPETITION_WINNER',
        label: 'Vunnet konkurranse',
        description: 'Har vunnet minst en avsluttet konkurranse'
    },
    MORE_THAN_THREE_COMMENTS: {
        key: 'MORE_THAN_THREE_COMMENTS',
        label: 'Over 3 kommentarer',
        description: 'Har mer enn tre kommentarer totalt'
    },
    MORE_THAN_FIVE_LIKES: {
        key: 'MORE_THAN_FIVE_LIKES',
        label: 'Over 5 likes',
        description: 'Har mer enn fem likes totalt'
    }
}

function isCompletedCompetition(endDate: Date): boolean {
    return endDate.getTime() < Date.now()
}

export async function getDogHighlights(): Promise<DogHighlightsPayload> {
    let dogs: Array<{
        id: string
        name: string
        breed: string
        description: string
        imageUrl: string | null
        owner: {
            id: string
            username: string | null
            email: string
            imageUrl?: string | null
        } | null
        comments: Array<{ createdAt: Date }>
        likes: Array<{ createdAt: Date }>
        competitionEntries: Array<{
            id: string
            createdAt: Date
            competition: {
                id: string
                endDate: Date
            }
            ratings: Array<{ score: number; createdAt: Date }>
        }>
    }>

    try {
        dogs = await prisma.dog.findMany({
            orderBy: { name: 'asc' },
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        imageUrl: true
                    }
                },
                comments: {
                    select: { createdAt: true }
                },
                likes: {
                    select: { createdAt: true }
                },
                competitionEntries: {
                    select: {
                        id: true,
                        createdAt: true,
                        competition: {
                            select: {
                                id: true,
                                endDate: true
                            }
                        },
                        ratings: {
                            select: {
                                score: true,
                                createdAt: true
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

        const withoutImage = await prisma.dog.findMany({
            orderBy: { name: 'asc' },
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                },
                comments: {
                    select: { createdAt: true }
                },
                likes: {
                    select: { createdAt: true }
                },
                competitionEntries: {
                    select: {
                        id: true,
                        createdAt: true,
                        competition: {
                            select: {
                                id: true,
                                endDate: true
                            }
                        },
                        ratings: {
                            select: {
                                score: true,
                                createdAt: true
                            }
                        }
                    }
                }
            }
        })

        dogs = withoutImage.map((dog) => ({
            ...dog,
            owner: dog.owner ? { ...dog.owner, imageUrl: null } : null
        }))
    }

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const top3ByDogId: Record<string, number> = {}
    const winsByDogId: Record<string, number> = {}
    const completedCompetitionRows: Record<
        string,
        Array<{ dogId: string; averageRating: number; ratingCount: number }>
    > = {}

    for (const dog of dogs) {
        for (const entry of dog.competitionEntries) {
            if (!isCompletedCompetition(entry.competition.endDate) || entry.ratings.length === 0) {
                continue
            }

            const totalScore = entry.ratings.reduce((sum, rating) => sum + rating.score, 0)
            const averageRating = totalScore / entry.ratings.length
            const list = completedCompetitionRows[entry.competition.id] || []
            list.push({
                dogId: dog.id,
                averageRating,
                ratingCount: entry.ratings.length
            })
            completedCompetitionRows[entry.competition.id] = list
        }
    }

    for (const competitionId of Object.keys(completedCompetitionRows)) {
        const podium = completedCompetitionRows[competitionId]
            .sort((a, b) => {
                if (b.averageRating !== a.averageRating) {
                    return b.averageRating - a.averageRating
                }
                return b.ratingCount - a.ratingCount
            })
            .slice(0, 3)

        for (const [index, row] of podium.entries()) {
            top3ByDogId[row.dogId] = (top3ByDogId[row.dogId] || 0) + 1
            if (index === 0) {
                winsByDogId[row.dogId] = (winsByDogId[row.dogId] || 0) + 1
            }
        }
    }

    const allDogs: HighlightDog[] = dogs
        .map((dog) => {
            const weeklyComments = dog.comments.filter(
                (comment) => comment.createdAt.getTime() >= weekAgo
            ).length
            const weeklyLikes = dog.likes.filter(
                (like) => like.createdAt.getTime() >= weekAgo
            ).length
            const weeklyRatings = dog.competitionEntries.flatMap((entry) =>
                entry.ratings.filter((rating) => rating.createdAt.getTime() >= weekAgo)
            ).length

            const badges: DogBadge[] = []
            if ((top3ByDogId[dog.id] || 0) >= 2) {
                badges.push(BADGE_META.DOUBLE_TOP_THREE)
            }
            if ((winsByDogId[dog.id] || 0) >= 1) {
                badges.push(BADGE_META.COMPETITION_WINNER)
            }
            if (dog.comments.length > 3) {
                badges.push(BADGE_META.MORE_THAN_THREE_COMMENTS)
            }
            if (dog.likes.length > 5) {
                badges.push(BADGE_META.MORE_THAN_FIVE_LIKES)
            }

            return {
                id: dog.id,
                name: dog.name,
                breed: dog.breed,
                description: dog.description,
                imageUrl: dog.imageUrl,
                owner: dog.owner
                    ? {
                          id: dog.owner.id,
                          username: dog.owner.username || dog.owner.email.split('@')[0] || 'bruker',
                          email: dog.owner.email,
                          imageUrl: dog.owner.imageUrl || null
                      }
                    : null,
                likesCount: dog.likes.length,
                commentsCount: dog.comments.length,
                top3Finishes: top3ByDogId[dog.id] || 0,
                weeklyEngagementScore: weeklyComments * 3 + weeklyLikes * 2 + weeklyRatings * 4,
                badgeCount: badges.length,
                badges
            }
        })
        .sort((a, b) => {
            if (b.badgeCount !== a.badgeCount) return b.badgeCount - a.badgeCount
            if (b.weeklyEngagementScore !== a.weeklyEngagementScore) {
                return b.weeklyEngagementScore - a.weeklyEngagementScore
            }
            if (b.top3Finishes !== a.top3Finishes) return b.top3Finishes - a.top3Finishes
            if (b.likesCount !== a.likesCount) return b.likesCount - a.likesCount
            return b.commentsCount - a.commentsCount
        })

    const nextCompetition = await prisma.competition.findFirst({
        where: {
            startDate: {
                gt: new Date()
            }
        },
        orderBy: {
            startDate: 'asc'
        },
        select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true
        }
    })

    return {
        generatedAt: new Date().toISOString(),
        dogOfTheWeek: allDogs[0] || null,
        mostBadgedDogs: allDogs.filter((dog) => dog.badgeCount > 0).slice(0, 4),
        nextCompetition: nextCompetition
            ? {
                  id: nextCompetition.id,
                  name: nextCompetition.name,
                  startDate: nextCompetition.startDate.toISOString(),
                  endDate: nextCompetition.endDate.toISOString()
              }
            : null,
        allDogs
    }
}
