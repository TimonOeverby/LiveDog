import api from './api'

export async function likeDog(competitionId: string, dogId: string) {
    const response = await api.post(`/competitions/${competitionId}/like/${dogId}`)
    return response.data
}

export async function unlikeDog(competitionId: string, dogId: string) {
    const response = await api.delete(`/competitions/${competitionId}/like/${dogId}`)
    return response.data
}

export async function getLikes(competitionId: string, dogId: string) {
    const response = await api.get(`/competitions/${competitionId}/likes/${dogId}`)
    return response.data
}

export async function addComment(competitionId: string, dogId: string, content: string) {
    const response = await api.post(`/competitions/${competitionId}/comment/${dogId}`, { content })
    return response.data
}

export async function getComments(competitionId: string, dogId: string) {
    const response = await api.get(`/competitions/${competitionId}/comments/${dogId}`)
    return response.data
}

export async function deleteComment(competitionId: string, commentId: string) {
    const response = await api.delete(`/competitions/${competitionId}/comment/${commentId}`)
    return response.data
}
