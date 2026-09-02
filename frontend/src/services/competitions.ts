import type {
    Competition,
    CompetitionParticipant,
    CompetitionRating,
    CompetitionRatingsResponse
} from '@/types'
import api from './api'

export async function getCompetitions(): Promise<Competition[]> {
    const response = await api.get<{ competitions: Competition[] }>('/competitions')

    // Konverter dato-strenger til Date-objekter
    return response.data.competitions.map((comp) => ({
        ...comp,
        startDate: new Date(comp.startDate),
        endDate: new Date(comp.endDate),
        createdAt: new Date(comp.createdAt)
    }))
}

export async function createCompetition(competitionData: {
    name: string
    description: string
    startDate: string
    endDate: string
}): Promise<Competition> {
    const response = await api.post<{ competition: Competition }>('/competitions', competitionData)

    // Konverter dato-strenger til Date-objekter
    return {
        ...response.data.competition,
        startDate: new Date(response.data.competition.startDate),
        endDate: new Date(response.data.competition.endDate),
        createdAt: new Date(response.data.competition.createdAt)
    }
}

export async function deleteCompetition(id: string): Promise<void> {
    await api.delete(`/competitions/${id}`)
}

export async function updateCompetition(
    id: string,
    competitionData: {
        name?: string
        description?: string
        startDate?: string
        endDate?: string
        status?: string
    }
): Promise<Competition> {
    const response = await api.put<{ competition: Competition }>(
        `/competitions/${id}`,
        competitionData
    )

    // Konverter dato-strenger til Date-objekter
    return {
        ...response.data.competition,
        startDate: new Date(response.data.competition.startDate),
        endDate: new Date(response.data.competition.endDate),
        createdAt: new Date(response.data.competition.createdAt)
    }
}

export async function getCompetitionParticipants(
    competitionId: string
): Promise<CompetitionParticipant[]> {
    // Leser deltakere for en konkurranse (inkludert hund + eier)
    const response = await api.get<{ participants: CompetitionParticipant[] }>(
        `/competitions/${competitionId}/participants`
    )

    // Konverter dato-strenger til Date-objekter
    return response.data.participants.map((participant) => ({
        ...participant,
        createdAt: new Date(participant.createdAt)
    }))
}

export async function registerDogForCompetition(
    competitionId: string,
    dogId: string
): Promise<CompetitionParticipant> {
    // Registrer en hund til en aktiv konkurranse
    const response = await api.post<{ entry: CompetitionParticipant }>(
        `/competitions/${competitionId}/entries`,
        { dogId }
    )

    // Konverter dato-strenger til Date-objekter
    return {
        ...response.data.entry,
        createdAt: new Date(response.data.entry.createdAt)
    }
}

export async function withdrawDogFromCompetition(
    competitionId: string,
    entryId: string
): Promise<void> {
    await api.delete(`/competitions/${competitionId}/entries/${entryId}`)
}

export async function submitCompetitionRating(
    competitionId: string,
    dogId: string,
    score: number
): Promise<CompetitionRating> {
    const response = await api.post<{ rating: CompetitionRating }>(
        `/competitions/${competitionId}/ratings`,
        { dogId, score }
    )

    return {
        ...response.data.rating,
        createdAt: new Date(response.data.rating.createdAt),
        updatedAt: new Date(response.data.rating.updatedAt)
    }
}

export async function getCompetitionRatingsSummary(
    competitionId: string
): Promise<CompetitionRatingsResponse> {
    const response = await api.get<CompetitionRatingsResponse>(
        `/competitions/${competitionId}/ratings`
    )

    return response.data
}
