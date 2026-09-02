import { prisma } from '../../prisma/client'
import { Hono } from 'hono'
import { authRequired } from '../middleware/auth'
import { isMissingUserImageColumn } from '../utils/prismaCompat'
import { getDogHighlights } from '../utils/dogHighlights'

const dogs = new Hono()

dogs.get('/highlights', async (c) => {
    try {
        return c.json(await getDogHighlights())
    } catch (error) {
        console.error('Fetch dog highlights error:', error)
        return c.json({ error: 'Failed to fetch dog highlights' }, 500)
    }
})

//get all dogs
dogs.get('/', async (c) => {
    try {
        const allDogs = await prisma.dog.findMany({
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        imageUrl: true,
                        role: true,
                        createdAt: true
                    }
                }
            }
        })
        return c.json({ dogs: allDogs })
    } catch (error) {
        if (!isMissingUserImageColumn(error)) {
            console.error('Fetch dogs error:', error)
            return c.json({ error: 'Failed to fetch dogs' }, 500)
        }

        const allDogs = await prisma.dog.findMany({
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                }
            }
        })

        return c.json({
            dogs: allDogs.map((dog) => ({
                ...dog,
                owner: dog.owner ? { ...dog.owner, imageUrl: null } : null
            }))
        })
    }
})

//post, create dog profile
dogs.post('/', authRequired, async (c) => {
    try {
        const { name, breed, description, imageUrl } = await c.req.json()
        const user = c.get('user') as { userId: string; role: string }

        if (!name || !breed || !description) {
            return c.json({ error: 'Missing required fields' }, 400)
        }

        const dog = await prisma.dog.create({
            data: {
                name,
                breed,
                description,
                imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null,
                ownerId: user.userId
            }
        })

        return c.json(dog, 201)
    } catch (error) {
        console.error('Create dog error:', error)
        return c.json({ error: 'Failed to create dog' }, 500)
    }
})

// put, edit dog profile
dogs.put('/:id', authRequired, async (c) => {
    try {
        const id = c.req.param('id')
        const { name, breed, description, imageUrl } = await c.req.json()
        const user = c.get('user') as { userId: string; role: string }

        const existing = await prisma.dog.findUnique({ where: { id } })
        if (!existing) return c.json({ error: 'Dog not found' }, 404)
        if (existing.ownerId !== user.userId) return c.json({ error: 'Unauthorized' }, 403)

        const updated = await prisma.dog.update({
            where: { id },
            data: {
                name,
                breed,
                description,
                imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null
            }
        })

        return c.json(updated)
    } catch (error) {
        console.error('Update dog error:', error)
        return c.json({ error: 'Failed to update dog' }, 500)
    }
})

dogs.delete('/:id', authRequired, async (c) => {
    try {
        const id = c.req.param('id')
        const user = c.get('user') as { userId: string; role: string }

        const existing = await prisma.dog.findUnique({ where: { id } })
        if (!existing) return c.json({ error: 'Dog not found' }, 404)
        if (existing.ownerId !== user.userId && user.role !== 'ADMIN') {
            return c.json({ error: 'Unauthorized' }, 403)
        }

        await prisma.dog.delete({ where: { id } })
        return c.json({ deleted: true })
    } catch (error) {
        console.error('Delete dog error:', error)
        return c.json({ error: 'Failed to delete dog' }, 500)
    }
})

export default dogs
