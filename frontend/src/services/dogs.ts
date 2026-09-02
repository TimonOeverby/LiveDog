import type { Dog, DogHighlightsResponse } from '@/types'
import api from './api'

export async function getDogs(): Promise<Dog[]> {
    const response = await api.get<{ dogs: Dog[] }>('/dogs')

    // Konverter dato-felter til Date-objekter for enklere bruk i UI
    return response.data.dogs.map((dog) => ({
        ...dog,
        createdAt: new Date(dog.createdAt),
        updatedAt: new Date(dog.updatedAt)
    }))
}

export async function deleteDog(id: string): Promise<void> {
    await api.delete(`/dogs/${id}`)
}

export async function getDogHighlights(): Promise<DogHighlightsResponse> {
    const response = await api.get<DogHighlightsResponse>('/dogs/highlights')
    return response.data
}
