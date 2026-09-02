export interface User {
    id: string
    username: string
    email: string
    imageUrl?: string | null
    phoneNumber?: string | null
    role: 'USER' | 'ADMIN'
    createdAt: Date
}

export interface UserListItem {
    id: string
    username: string
    email: string
    imageUrl?: string | null
    phoneNumber?: string | null
    role: 'USER' | 'ADMIN'
    createdAt: Date
    dogsCount: number
}

export interface Dog {
    id: string
    name: string
    breed: string
    description: string
    imageUrl?: string
    ownerId: string
    createdAt: Date
    updatedAt: Date
    owner?: User
}

export interface DogBadge {
    key:
        | 'DOUBLE_TOP_THREE'
        | 'COMPETITION_WINNER'
        | 'MORE_THAN_THREE_COMMENTS'
        | 'MORE_THAN_FIVE_LIKES'
    label: string
    description: string
}

export interface HighlightDog {
    id: string
    name: string
    breed: string
    description: string
    imageUrl?: string | null
    owner?: {
        id: string
        username: string
        email: string
        imageUrl?: string | null
    } | null
    likesCount: number
    commentsCount: number
    top3Finishes: number
    weeklyEngagementScore: number
    badgeCount: number
    badges: DogBadge[]
}

export interface DogHighlightsResponse {
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

export interface Competition {
    id: string
    name: string
    description: string
    startDate: Date
    endDate: Date
    status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
    createdAt: Date
}

export interface CompetitionParticipant {
    // Representerer en påmelding med hund + eier-informasjon
    id: string
    dogId: string
    competitionId: string
    createdAt: Date
    dog: {
        id: string
        name: string
        breed: string
        imageUrl?: string | null
        owner?: User
    }
}

export interface CompetitionRating {
    id: string
    userId: string
    competitionEntryId: string
    score: number
    createdAt: Date
    updatedAt: Date
}

export interface CompetitionDogRatingSummary {
    id: string
    competitionId: string
    dogId: string
    dog: {
        id: string
        name: string
        breed: string
        imageUrl?: string | null
    }
    ratingCount: number
    averageRating: number
}

export interface CompetitionRatingsResponse {
    ratings: CompetitionDogRatingSummary[]
    topRatedDog: CompetitionDogRatingSummary | null
}

export interface AdminDashboardActiveParticipant {
    id: string
    joinedAt: Date
    dog: {
        id: string
        name: string
        breed: string
        imageUrl?: string | null
    }
    owner: {
        id: string
        username: string
        email: string
        imageUrl?: string | null
        role: 'USER' | 'ADMIN'
    }
}

export interface AdminDashboardActiveCompetition {
    id: string
    name: string
    startDate: Date
    endDate: Date
    participantCount: number
    participants: AdminDashboardActiveParticipant[]
}

export interface AdminDashboardUpcomingCompetition {
    id: string
    name: string
    startDate: Date
    endDate: Date
    participantCount: number
}

export interface AdminDashboardOverview {
    totalDogs: number
    totalUsers: number
    totalCompetitions: number
    activeCompetitionsCount: number
    activeCompetitionDogCount: number
    percentageOfDogsInActiveCompetitions: number
    averageDogsPerUser: number
    averageCompetitionsPerMonth: number
    upcomingCompetitionsNext7Days: number
    upcomingCompetitionsNext30Days: number
    recentUsersCount: number
    incompleteDogProfilesCount: number
    lowEnrollmentCompetitionsCount: number
    lowEnrollmentThreshold: number
}

export interface AdminDashboardUser {
    id: string
    username: string
    email: string
    imageUrl?: string | null
    phoneNumber?: string | null
    role: 'USER' | 'ADMIN'
    createdAt: Date
    dogsCount: number
}

export interface AdminDashboardMostActiveUser {
    id: string
    username: string
    email: string
    imageUrl?: string | null
    role: 'USER' | 'ADMIN'
    dogsCount: number
    commentsCount: number
    likesCount: number
    ratingsCount: number
    activityScore: number
}

export interface AdminDashboardMonthlyCount {
    month: string
    count: number
}

export interface AdminDashboardIncompleteDogProfile {
    id: string
    name: string
    breed: string
    owner: {
        id: string
        username: string
        email: string
    }
    missingImage: boolean
    missingDescription: boolean
}

export interface AdminDashboardStats {
    overview: AdminDashboardOverview
    activeCompetitions: AdminDashboardActiveCompetition[]
    upcomingCompetitions: AdminDashboardUpcomingCompetition[]
    lowEnrollmentCompetitions: Array<{
        id: string
        name: string
        startDate: Date
        participantCount: number
    }>
    incompleteDogProfiles: AdminDashboardIncompleteDogProfile[]
    users: AdminDashboardUser[]
    mostActiveUsers: AdminDashboardMostActiveUser[]
    monthlyNewDogs: AdminDashboardMonthlyCount[]
    monthlyNewUsers: AdminDashboardMonthlyCount[]
}

export interface DogCompetitionEntry {
    id: string
    createdAt: Date
    competition: Competition
}

export interface UserProfileDog {
    id: string
    name: string
    breed: string
    description: string
    imageUrl?: string
    createdAt: Date
    updatedAt: Date
    competitionEntries: DogCompetitionEntry[]
}

export interface UserProfile {
    id: string
    username: string
    email: string
    imageUrl?: string | null
    phoneNumber?: string | null
    role: 'USER' | 'ADMIN'
    createdAt: Date
    dogs: UserProfileDog[]
}
