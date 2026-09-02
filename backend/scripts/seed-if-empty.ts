import { prisma } from '../prisma/client'

async function main() {
    const existingUsers = await prisma.user.count()

    if (existingUsers > 0) {
        console.log(`Skipping seed, database already has ${existingUsers} users.`)
        await prisma.$disconnect()
        return
    }

    const { main: seedDatabase } = await import('../prisma/seed')
    await seedDatabase()
}

main().catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
})
