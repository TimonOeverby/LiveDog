import type { Competition, UserListItem, UserProfile } from '@/types'
import api from './api'

function toCompetitionDate(competition: Competition): Competition {
    return {
        ...competition,
        startDate: new Date(competition.startDate),
        endDate: new Date(competition.endDate),
        createdAt: new Date(competition.createdAt)
    }
}

export async function getUsers(search?: string): Promise<UserListItem[]> {
    const response = await api.get<{ users: UserListItem[] }>('/users', {
        params: search ? { search } : undefined
    })

    return response.data.users.map((user) => ({
        ...user,
        createdAt: new Date(user.createdAt)
    }))
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
    const response = await api.get<{ user: UserProfile }>(`/users/${userId}`)
    const profile = response.data.user

    return {
        ...profile,
        createdAt: new Date(profile.createdAt),
        dogs: profile.dogs.map((dog) => ({
            ...dog,
            createdAt: new Date(dog.createdAt),
            updatedAt: new Date(dog.updatedAt),
            competitionEntries: dog.competitionEntries.map((entry) => ({
                ...entry,
                createdAt: new Date(entry.createdAt),
                competition: toCompetitionDate(entry.competition)
            }))
        }))
    }
}

export async function updateUserAvatar(
    userId: string,
    imageUrl: string
): Promise<{
    id: string
    username: string
    email: string
    imageUrl?: string | null
    phoneNumber?: string | null
    role: string
}> {
    const response = await api.put<{
        user: {
            id: string
            username: string
            email: string
            imageUrl?: string | null
            phoneNumber?: string | null
            role: string
        }
    }>(`/users/${userId}/avatar`, { imageUrl })
    const user = response.data.user

    return user
}
