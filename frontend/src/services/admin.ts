import type { AdminDashboardStats } from '@/types'
import api from './api'

export async function getAdminDashboardStats(
    lowEnrollmentThreshold?: number
): Promise<AdminDashboardStats> {
    const response = await api.get<AdminDashboardStats>('/admin/dashboard', {
        params: typeof lowEnrollmentThreshold === 'number' ? { lowEnrollmentThreshold } : undefined
    })
    return response.data
}

export async function deleteAdminComment(commentId: string) {
    const response = await api.delete(`/admin/comments/${commentId}`)
    return response.data
}

export async function clearUserAvatar(userId: string) {
    const response = await api.delete(`/admin/users/${userId}/avatar`)
    return response.data
}

export async function clearDogDescription(dogId: string) {
    const response = await api.delete(`/admin/dogs/${dogId}/description`)
    return response.data
}

export async function removeCompetitionEntry(competitionId: string, entryId: string) {
    const response = await api.delete(`/admin/competitions/${competitionId}/entries/${entryId}`)
    return response.data
}
