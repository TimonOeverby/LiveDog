import api from './api'

export interface Advertisement {
    id: string
    imageData: string
    isActive: boolean
    followsCursor: boolean
    createdAt: string
    updatedAt: string
}

export const advertisementService = {
    async getActive(): Promise<Advertisement | null> {
        const response = await api.get('/advertisements/active')
        return response.data.advertisement
    },

    async getActiveList(): Promise<Advertisement[]> {
        const response = await api.get('/advertisements/active')
        return (
            response.data.advertisements ??
            (response.data.advertisement ? [response.data.advertisement] : [])
        )
    },

    async create(imageData: string, followsCursor: boolean = false): Promise<Advertisement> {
        const response = await api.post('/advertisements', { imageData, followsCursor })
        return response.data.advertisement
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/advertisements/${id}`)
    }
}
