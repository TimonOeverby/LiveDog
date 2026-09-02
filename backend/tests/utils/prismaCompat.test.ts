import { describe, expect, test } from 'bun:test'
import {
    isMissingCompetitionRatingStorage,
    isMissingUserImageColumn,
    isMissingUserUsernameColumn,
    isPrismaErrorCode
} from '../../src/utils/prismaCompat'

describe('prisma compatibility helpers', () => {
    test('detects missing user image and username columns', () => {
        const missingImageError = {
            code: 'P2022',
            message: 'The column `imageUrl` does not exist in the current database.'
        }
        const missingUsernameError = {
            code: 'P2022',
            message: 'The column `username` does not exist in the current database.'
        }
        const unknownUserColumnError = {
            code: 'P2022',
            message: 'Column User.something (not available)',
            meta: { modelName: 'User' }
        }

        expect(isMissingUserImageColumn(missingImageError)).toBe(true)
        expect(isMissingUserImageColumn(unknownUserColumnError)).toBe(true)
        expect(isMissingUserUsernameColumn(missingUsernameError)).toBe(true)
        expect(isMissingUserUsernameColumn(unknownUserColumnError)).toBe(true)
    })

    test('detects missing competition rating storage scenarios', () => {
        const missingRatingTable = {
            code: 'P2021',
            message: 'Table CompetitionRating does not exist',
            meta: { modelName: 'CompetitionRating' }
        }
        const missingRatingsRelation = {
            code: 'P2022',
            message: 'Column ratings (not available)',
            meta: { modelName: 'CompetitionEntry' }
        }
        const outdatedClientRelation = {
            code: 'P2000',
            message: 'Unknown field `ratings` for include statement on model `CompetitionEntry`'
        }

        expect(isMissingCompetitionRatingStorage(missingRatingTable)).toBe(true)
        expect(isMissingCompetitionRatingStorage(missingRatingsRelation)).toBe(true)
        expect(isMissingCompetitionRatingStorage(outdatedClientRelation)).toBe(true)
    })

    test('matches prisma error codes safely', () => {
        expect(isPrismaErrorCode({ code: 'P2002' }, 'P2002')).toBe(true)
        expect(isPrismaErrorCode({ code: 'P2025' }, 'P2002')).toBe(false)
        expect(isPrismaErrorCode(null, 'P2002')).toBe(false)
        expect(isPrismaErrorCode('not-an-error-object', 'P2002')).toBe(false)
    })

    test('returns false for unrelated objects and unknown errors', () => {
        const unrelated = { code: 'P2003', message: 'Foreign key violation' }

        expect(isMissingUserImageColumn(unrelated)).toBe(false)
        expect(isMissingUserUsernameColumn(unrelated)).toBe(false)
        expect(isMissingCompetitionRatingStorage(unrelated)).toBe(false)
    })
})
