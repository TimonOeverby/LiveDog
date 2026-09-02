export function isMissingUserImageColumn(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false
    }

    const maybeError = error as {
        code?: string
        message?: string
        meta?: { modelName?: string }
    }
    const message = maybeError.message || ''
    const isUnknownUserColumn =
        maybeError.code === 'P2022' &&
        maybeError.meta?.modelName === 'User' &&
        message.includes('(not available)')

    return (maybeError.code === 'P2022' && message.includes('imageUrl')) || isUnknownUserColumn
}

export function isMissingUserUsernameColumn(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false
    }

    const maybeError = error as {
        code?: string
        message?: string
        meta?: { modelName?: string }
    }
    const message = maybeError.message || ''
    const isUnknownUserColumn =
        maybeError.code === 'P2022' &&
        maybeError.meta?.modelName === 'User' &&
        message.includes('(not available)')

    return (maybeError.code === 'P2022' && message.includes('username')) || isUnknownUserColumn
}

export function isMissingCompetitionRatingStorage(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false
    }

    const maybeError = error as {
        code?: string
        message?: string
        meta?: { modelName?: string }
    }
    const message = maybeError.message || ''

    const isMissingRatingTable =
        maybeError.code === 'P2021' &&
        (message.includes('CompetitionRating') ||
            maybeError.meta?.modelName === 'CompetitionRating')

    const isUnknownRatingRelation =
        maybeError.code === 'P2022' &&
        maybeError.meta?.modelName === 'CompetitionEntry' &&
        (message.includes('ratings') || message.includes('(not available)'))

    const isOutdatedClientRelation = message.includes(
        'Unknown field `ratings` for include statement on model `CompetitionEntry`'
    )

    return isMissingRatingTable || isUnknownRatingRelation || isOutdatedClientRelation
}

export function isPrismaErrorCode(error: unknown, code: string): boolean {
    if (!error || typeof error !== 'object') {
        return false
    }

    const maybeError = error as { code?: string }
    return maybeError.code === code
}
