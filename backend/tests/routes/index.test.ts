import { describe, expect, test } from 'bun:test'
import app from '../../src/routes/index'

describe('API smoke tests', () => {
    test('GET /api/health returns ok status', async () => {
        const response = await app.request('/api/health')
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body).toEqual({ status: 'ok' })
    })
})
