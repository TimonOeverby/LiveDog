import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './auth'
import competitions from './competitions'
import dogs from './dogs'
import advertisements from './advertisements'
import users from './users'
import admin from './admin'

const app = new Hono()

// Add CORS middleware FIRST - before any routes
app.use(
    '*',
    cors({
        origin: '*',
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400
    })
)

// Health check
app.get('/api/health', (c) => {
    return c.json({ status: 'ok' })
})

// Mount route modules
app.route('/api/auth', auth)
app.route('/api/competitions', competitions)
app.route('/api/dogs', dogs)
app.route('/api/advertisements', advertisements)
app.route('/api/users', users)
app.route('/api/admin', admin)

export default app
