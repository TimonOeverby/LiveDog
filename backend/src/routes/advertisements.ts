import { Hono } from 'hono'
import { prisma } from '../../prisma/client'
import { adminAuth } from '../middleware/auth'

const advertisements = new Hono()

// Get active advertisement (public)
advertisements.get('/active', async (c) => {
    try {
        const ads = await prisma.advertisement.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        })

        return c.json({
            advertisement: ads[0] ?? null, // Backward compatible single active ad
            advertisements: ads // Full active list for admin UI
        })
    } catch (error) {
        console.error('Get advertisement error:', error)
        return c.json({ error: 'Failed to fetch advertisement' }, 500)
    }
})

// Create or update advertisement (admin only)
advertisements.post('/', adminAuth, async (c) => {
    try {
        const { imageData, followsCursor } = await c.req.json()

        if (!imageData) {
            return c.json({ error: 'Image data is required' }, 400)
        }

        // Create a new active ad without deactivating existing active ads.
        const ad = await prisma.advertisement.create({
            data: {
                imageData,
                isActive: true,
                followsCursor: followsCursor ?? false
            }
        })

        return c.json({ advertisement: ad }, 201)
    } catch (error) {
        console.error('Create advertisement error:', error)
        return c.json({ error: 'Failed to create advertisement' }, 500)
    }
})

// Delete advertisement (admin only)
advertisements.delete('/:id', adminAuth, async (c) => {
    try {
        const id = c.req.param('id')

        await prisma.advertisement.delete({
            where: { id }
        })

        return c.json({ message: 'Advertisement deleted successfully' })
    } catch (error) {
        console.error('Delete advertisement error:', error)
        return c.json({ error: 'Failed to delete advertisement' }, 500)
    }
})

export default advertisements
