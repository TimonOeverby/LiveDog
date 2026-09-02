import { prisma } from './client'
import { hashPassword } from '../src/utils/password'

const ADMIN_AVATAR_URL = 'https://i.pravatar.cc/300?img=5'
const ADMIN2_AVATAR_URL = 'https://i.pravatar.cc/300?img=15'
const USER_AVATAR_URL = 'https://i.pravatar.cc/300?img=12'
const COMPETITOR1_AVATAR_URL = 'https://i.pravatar.cc/300?img=32'
const COMPETITOR2_AVATAR_URL = 'https://i.pravatar.cc/300?img=47'
const COMPETITOR3_AVATAR_URL = 'https://i.pravatar.cc/300?img=21'
const COMPETITOR4_AVATAR_URL = 'https://i.pravatar.cc/300?img=24'
const COMPETITOR5_AVATAR_URL = 'https://i.pravatar.cc/300?img=31'
const COMPETITOR6_AVATAR_URL = 'https://i.pravatar.cc/300?img=44'
const COMPETITOR7_AVATAR_URL = 'https://i.pravatar.cc/300?img=52'
const COMPETITOR8_AVATAR_URL = 'https://i.pravatar.cc/300?img=57'
const COMPETITOR9_AVATAR_URL = 'https://i.pravatar.cc/300?img=62'
const MAX_DOG_IMAGE_URL = 'https://placedog.net/640/640?id=23'
const LEO_DOG_IMAGE_URL = 'https://placedog.net/640/640?id=41'
const SIRIUS_DOG_IMAGE_URL = 'https://placedog.net/640/640?id=58'
const DEFAULT_AD_IMAGE_DATA =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300" viewBox="0 0 900 300"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231b2f5f"/><stop offset="100%" stop-color="%23453a94"/></linearGradient><linearGradient id="pack" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23ffd36f"/><stop offset="100%" stop-color="%23ff9f1c"/></linearGradient></defs><rect width="900" height="300" fill="url(%23bg)"/><circle cx="790" cy="60" r="120" fill="%23ffffff12"/><circle cx="90" cy="250" r="140" fill="%23ffffff10"/><rect x="70" y="70" rx="22" ry="22" width="230" height="170" fill="url(%23pack)" stroke="%23ffffff88" stroke-width="3"/><text x="185" y="135" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="%231b2f5f">TestMat</text><text x="185" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="%23322f63">Norges%20mest%20mistenkelig%20gode%20for</text><rect x="360" y="82" rx="14" ry="14" width="470" height="54" fill="%23ffffff19" stroke="%23ffffff50" /><text x="595" y="117" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="white">TESTMAT</text><text x="595" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="27" fill="%23e8f0ff">Smaker%20best%20i%20test,%20men%20er%20bare%20en%20test.</text><rect x="506" y="198" rx="999" ry="999" width="178" height="44" fill="%23ffd36f"/><text x="595" y="227" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="%231b2f5f">100%25%20TESTBAR</text></svg>'

function isMissingColumn(error: unknown, column: string): boolean {
    if (!error || typeof error !== 'object') return false
    const maybeError = error as { code?: string; message?: string }
    return maybeError.code === 'P2022' && (maybeError.message || '').includes(column)
}

function addDays(base: Date, days: number): Date {
    const next = new Date(base)
    next.setDate(next.getDate() + days)
    return next
}

function withDurationDays(startDate: Date, days: number): Date {
    return addDays(startDate, days)
}

function competitionStatus(startDate: Date, endDate: Date): 'UPCOMING' | 'ACTIVE' | 'COMPLETED' {
    const now = new Date()
    if (now < startDate) return 'UPCOMING'
    if (now <= endDate) return 'ACTIVE'
    return 'COMPLETED'
}

async function createSeedUser(input: {
    id: string
    username: string
    email: string
    password: string
    imageUrl?: string
    phoneNumber?: string
    role: 'USER' | 'ADMIN'
}) {
    try {
        return await prisma.user.create({
            data: input,
            select: {
                id: true,
                email: true
            }
        })
    } catch (error) {
        if (
            !isMissingColumn(error, 'username') &&
            !isMissingColumn(error, 'imageUrl') &&
            !isMissingColumn(error, 'phoneNumber')
        ) {
            throw error
        }

        return prisma.user.create({
            data: {
                id: input.id,
                email: input.email,
                password: input.password,
                role: input.role
            },
            select: {
                id: true,
                email: true
            }
        })
    }
}

async function createSeedDog(input: {
    id: string
    name: string
    breed: string
    description: string
    imageUrl?: string | null
    ownerId: string
}) {
    return prisma.dog.create({
        data: {
            ...input,
            imageUrl: input.imageUrl ?? null
        }
    })
}

export async function main() {
    try {
        console.log('Start seeding...')

        await prisma.advertisement.deleteMany({})
        await prisma.competitionRating.deleteMany({})
        await prisma.like.deleteMany({})
        await prisma.comment.deleteMany({})
        await prisma.competitionEntry.deleteMany({})
        await prisma.dog.deleteMany({})
        await prisma.user.deleteMany({})
        await prisma.competition.deleteMany({})
        console.log('Cleared existing data')

        const adminPassword = await hashPassword('admin123')
        const userPassword = await hashPassword('test123')

        const adminUser = await createSeedUser({
            id: 'admin-1',
            username: 'TestAdmin',
            email: 'admin@test.com',
            password: adminPassword,
            imageUrl: ADMIN_AVATAR_URL,
            phoneNumber: '+47 901 10 101',
            role: 'ADMIN'
        })
        await createSeedUser({
            id: 'admin-2',
            username: 'AdminSupport',
            email: 'admin2@test.com',
            password: adminPassword,
            imageUrl: ADMIN2_AVATAR_URL,
            phoneNumber: '+47 901 20 202',
            role: 'ADMIN'
        })

        const testUser = await createSeedUser({
            id: 'user-1',
            username: 'TestUser',
            email: 'user@test.com',
            password: userPassword,
            imageUrl: USER_AVATAR_URL,
            phoneNumber: '+47 901 30 303',
            role: 'USER'
        })

        const leoDog = await createSeedDog({
            id: 'dog-leo-1',
            name: 'Leo',
            breed: 'Border Collie',
            description: 'Svært lærevillig og fokusert hund som trives i konkurranser og agility.',
            imageUrl: LEO_DOG_IMAGE_URL,
            ownerId: adminUser.id
        })
        const siriusDog = await createSeedDog({
            id: 'dog-sirius-1',
            name: 'Sirius',
            breed: 'Siberian Husky',
            description: 'Sosial og utholdende hund med mye energi og et rolig konkurransehode.',
            imageUrl: SIRIUS_DOG_IMAGE_URL,
            ownerId: adminUser.id
        })
        const maxDog = await createSeedDog({
            id: 'dog-max-1',
            name: 'Max',
            breed: 'Golden Retriever',
            description:
                'Vennlig og energisk familiehund som elsker turer, apport og nye hundevenner.',
            imageUrl: MAX_DOG_IMAGE_URL,
            ownerId: testUser.id
        })

        const competitorDefinitions = [
            {
                id: 'user-2',
                username: 'competitor1',
                email: 'competitor1@test.com',
                imageUrl: COMPETITOR1_AVATAR_URL,
                dogs: [
                    {
                        id: 'dog-bella-1',
                        name: 'Bella',
                        breed: 'Labrador Retriever',
                        description: 'Trygg og sosial hund som trives med nye miljøer.',
                        imageUrl: 'https://placedog.net/640/640?id=77'
                    }
                ]
            },
            {
                id: 'user-3',
                username: 'competitor2',
                email: 'competitor2@test.com',
                imageUrl: COMPETITOR2_AVATAR_URL,
                dogs: [
                    {
                        id: 'dog-rocky-1',
                        name: 'Rocky',
                        breed: 'Australian Shepherd',
                        description: 'Aktiv og fokusert hund med god kontroll i konkurranser.',
                        imageUrl: 'https://placedog.net/640/640?id=91'
                    }
                ]
            },
            {
                id: 'user-4',
                username: 'competitor3',
                email: 'competitor3@test.com',
                imageUrl: COMPETITOR3_AVATAR_URL,
                dogs: [
                    {
                        id: 'dog-milo-3',
                        name: 'Milo',
                        breed: 'Whippet',
                        description: 'Rask og lett hund med mye selvtillit i ringen.',
                        imageUrl: 'https://placedog.net/640/640?id=101'
                    },
                    {
                        id: 'dog-luna-3',
                        name: 'Luna',
                        breed: 'Samoyed',
                        description: 'Blid og fluffy hund som elsker oppmerksomhet.',
                        imageUrl: 'https://placedog.net/640/640?id=102'
                    }
                ]
            },
            {
                id: 'user-5',
                username: 'competitor4',
                email: 'competitor4@test.com',
                imageUrl: COMPETITOR4_AVATAR_URL,
                dogs: [
                    {
                        id: 'dog-ivy-4',
                        name: 'Ivy',
                        breed: 'Dalmatiner',
                        description: 'Leken og elegant hund med mye fart.',
                        imageUrl: 'https://placedog.net/640/640?id=103'
                    },
                    {
                        id: 'dog-ember-4',
                        name: 'Ember',
                        breed: 'Basenji',
                        description: '',
                        imageUrl: 'https://placedog.net/640/640?id=104'
                    },
                    {
                        id: 'dog-nova-4',
                        name: 'Nova',
                        breed: 'Belgisk Furehund',
                        description: 'Oppmerksom og lydig hund med sterke konkurransenerver.',
                        imageUrl: 'https://placedog.net/640/640?id=105'
                    }
                ]
            },
            {
                id: 'user-6',
                username: 'competitor5',
                email: 'competitor5@test.com',
                imageUrl: COMPETITOR5_AVATAR_URL,
                dogs: [
                    {
                        id: 'dog-otis-5',
                        name: 'Otis',
                        breed: 'Cocker Spaniel',
                        description: 'Sosial hund som holder hodet kaldt i nye settinger.',
                        imageUrl: 'https://placedog.net/640/640?id=106'
                    }
                ]
            },
            {
                id: 'user-7',
                username: 'competitor6',
                email: 'competitor6@test.com',
                imageUrl: COMPETITOR6_AVATAR_URL,
                dogs: [
                    {
                        id: 'dog-koda-6',
                        name: 'Koda',
                        breed: 'Nova Scotia Duck Tolling Retriever',
                        description: 'Lettlært hund med fokus på tempo og presisjon.',
                        imageUrl: 'https://placedog.net/640/640?id=107'
                    },
                    {
                        id: 'dog-nellie-6',
                        name: 'Nellie',
                        breed: 'Puddel',
                        description: 'Stødig hund med mye energi og tydelig scenetekke.',
                        imageUrl: 'https://placedog.net/640/640?id=108'
                    }
                ]
            },
            {
                id: 'user-8',
                username: 'competitor7',
                email: 'competitor7@test.com',
                imageUrl: COMPETITOR7_AVATAR_URL,
                dogs: [
                    {
                        id: 'dog-finn-7',
                        name: 'Finn',
                        breed: 'Schäferhund',
                        description: 'Fokusert og rolig hund som jobber godt under press.',
                        imageUrl: 'https://placedog.net/640/640?id=109'
                    },
                    {
                        id: 'dog-freya-7',
                        name: 'Freya',
                        breed: 'Vizsla',
                        description: 'Energisk og vennlig hund med mye driv.',
                        imageUrl: 'https://placedog.net/640/640?id=110'
                    }
                ]
            },
            {
                id: 'user-9',
                username: 'competitor8',
                email: 'competitor8@test.com',
                imageUrl: COMPETITOR8_AVATAR_URL,
                dogs: [
                    {
                        id: 'dog-poppy-8',
                        name: 'Poppy',
                        breed: 'Shiba Inu',
                        description: 'Selvstendig hund med overraskende god ringdisiplin.',
                        imageUrl: 'https://placedog.net/640/640?id=111'
                    },
                    {
                        id: 'dog-ruby-8',
                        name: 'Ruby',
                        breed: 'Boxer',
                        description: 'Glad og energisk hund som liker publikum.',
                        imageUrl: 'https://placedog.net/640/640?id=112'
                    }
                ]
            },
            {
                id: 'user-10',
                username: 'competitor9',
                email: 'competitor9@test.com',
                imageUrl: COMPETITOR9_AVATAR_URL,
                dogs: [
                    {
                        id: 'dog-ziggy-9',
                        name: 'Ziggy',
                        breed: 'Border Terrier',
                        description: 'Kompakt hund med stor selvtillit og masse sjarm.',
                        imageUrl: 'https://placedog.net/640/640?id=113'
                    },
                    {
                        id: 'dog-echo-9',
                        name: 'Echo',
                        breed: 'Mudi',
                        description: 'Oppmerksom hund med eksplosiv energi og raske vendinger.',
                        imageUrl: null
                    }
                ]
            }
        ] as const

        for (const competitorDefinition of competitorDefinitions) {
            const competitor = await createSeedUser({
                id: competitorDefinition.id,
                username: competitorDefinition.username,
                email: competitorDefinition.email,
                password: userPassword,
                imageUrl: competitorDefinition.imageUrl,
                role: 'USER'
            })

            for (const dogDefinition of competitorDefinition.dogs) {
                await createSeedDog({
                    ...dogDefinition,
                    ownerId: competitor.id
                })
            }
        }

        const today = new Date()
        const competitions = [
            {
                id: 'comp-upcoming-1',
                name: 'Mock Trondheim Vaarcup',
                description: 'Kommende mock-konkurranse i Trondheim',
                startDate: addDays(today, 5),
                endDate: withDurationDays(addDays(today, 5), 16)
            },
            {
                id: 'comp-upcoming-2',
                name: 'Mock Bergen Open',
                description: 'Kommende mock-konkurranse i Bergen',
                startDate: addDays(today, 12),
                endDate: withDurationDays(addDays(today, 12), 12)
            },
            {
                id: 'comp-active-1',
                name: 'Mock Midt-Norsk Dagskonkurranse',
                description: 'Pagaende mock-konkurranse for dashboard og engasjement',
                startDate: addDays(today, -2),
                endDate: addDays(today, 18)
            },
            {
                id: 'comp-active-2',
                name: 'Mock Kveldsfinale',
                description: 'Ekstra pagaende mock-konkurranse for rating og kommentarer',
                startDate: addDays(today, -1),
                endDate: addDays(today, 9)
            },
            {
                id: 'comp-completed-1',
                name: 'Mock Vintermesterskap',
                description: 'Avsluttet mock-konkurranse med tydelig podium',
                startDate: addDays(today, -42),
                endDate: addDays(today, -28)
            },
            {
                id: 'comp-completed-2',
                name: 'Mock Fjordcup',
                description: 'Avsluttet mock-konkurranse med sterke topp 3-hunder',
                startDate: addDays(today, -26),
                endDate: addDays(today, -12)
            },
            {
                id: 'comp-completed-3',
                name: 'Mock Skogsmesterskap',
                description: 'Nyere avsluttet konkurranse brukt i badge-systemet',
                startDate: addDays(today, -18),
                endDate: addDays(today, -5)
            }
        ] as const

        for (const competition of competitions) {
            await prisma.competition.create({
                data: {
                    ...competition,
                    status: competitionStatus(competition.startDate, competition.endDate)
                }
            })
        }

        const competitionEntries = new Map<string, { id: string; dogId: string }>()

        async function createEntry(
            competitionId: string,
            dogId: string,
            createdAt: Date
        ): Promise<void> {
            const entry = await prisma.competitionEntry.create({
                data: {
                    competitionId,
                    dogId,
                    createdAt
                }
            })
            competitionEntries.set(`${competitionId}:${dogId}`, { id: entry.id, dogId })
        }

        await createEntry('comp-active-1', leoDog.id, addDays(today, -3))
        await createEntry('comp-active-1', siriusDog.id, addDays(today, -3))
        await createEntry('comp-active-1', maxDog.id, addDays(today, -3))
        await createEntry('comp-active-1', 'dog-bella-1', addDays(today, -3))
        await createEntry('comp-active-1', 'dog-rocky-1', addDays(today, -3))
        await createEntry('comp-active-1', 'dog-milo-3', addDays(today, -2))
        await createEntry('comp-active-1', 'dog-luna-3', addDays(today, -2))
        await createEntry('comp-active-1', 'dog-ivy-4', addDays(today, -2))
        await createEntry('comp-active-1', 'dog-otis-5', addDays(today, -2))

        await createEntry('comp-active-2', 'dog-koda-6', addDays(today, -2))
        await createEntry('comp-active-2', 'dog-nellie-6', addDays(today, -2))
        await createEntry('comp-active-2', 'dog-finn-7', addDays(today, -1))
        await createEntry('comp-active-2', 'dog-freya-7', addDays(today, -1))
        await createEntry('comp-active-2', 'dog-poppy-8', addDays(today, -1))
        await createEntry('comp-active-2', 'dog-ruby-8', addDays(today, -1))
        await createEntry('comp-active-2', 'dog-ziggy-9', addDays(today, -1))

        await createEntry('comp-upcoming-1', 'dog-echo-9', addDays(today, -1))
        await createEntry('comp-upcoming-1', 'dog-nova-4', addDays(today, -2))
        await createEntry('comp-upcoming-1', maxDog.id, addDays(today, -2))
        await createEntry('comp-upcoming-1', 'dog-otis-5', addDays(today, -2))
        await createEntry('comp-upcoming-2', 'dog-bella-1', addDays(today, -4))
        await createEntry('comp-upcoming-2', 'dog-rocky-1', addDays(today, -4))
        await createEntry('comp-upcoming-2', 'dog-luna-3', addDays(today, -4))

        await createEntry('comp-completed-1', leoDog.id, addDays(today, -45))
        await createEntry('comp-completed-1', 'dog-bella-1', addDays(today, -45))
        await createEntry('comp-completed-1', 'dog-rocky-1', addDays(today, -45))
        await createEntry('comp-completed-1', maxDog.id, addDays(today, -45))

        await createEntry('comp-completed-2', leoDog.id, addDays(today, -29))
        await createEntry('comp-completed-2', siriusDog.id, addDays(today, -29))
        await createEntry('comp-completed-2', 'dog-ivy-4', addDays(today, -29))
        await createEntry('comp-completed-2', 'dog-koda-6', addDays(today, -29))

        await createEntry('comp-completed-3', leoDog.id, addDays(today, -21))
        await createEntry('comp-completed-3', 'dog-bella-1', addDays(today, -21))
        await createEntry('comp-completed-3', 'dog-milo-3', addDays(today, -21))
        await createEntry('comp-completed-3', 'dog-nellie-6', addDays(today, -21))

        await prisma.like.createMany({
            data: [
                { userId: 'user-1', dogId: 'dog-bella-1', createdAt: addDays(today, -1) },
                { userId: 'admin-1', dogId: 'dog-bella-1', createdAt: addDays(today, -2) },
                { userId: 'admin-2', dogId: 'dog-bella-1', createdAt: addDays(today, -2) },
                { userId: 'user-3', dogId: 'dog-bella-1', createdAt: addDays(today, -3) },
                { userId: 'user-4', dogId: 'dog-bella-1', createdAt: addDays(today, -4) },
                { userId: 'user-5', dogId: 'dog-bella-1', createdAt: addDays(today, -6) },
                { userId: 'user-1', dogId: leoDog.id, createdAt: addDays(today, -3) },
                { userId: 'admin-2', dogId: leoDog.id, createdAt: addDays(today, -6) },
                { userId: 'user-6', dogId: leoDog.id, createdAt: addDays(today, -10) },
                { userId: 'user-7', dogId: leoDog.id, createdAt: addDays(today, -13) },
                { userId: 'admin-1', dogId: 'dog-rocky-1', createdAt: addDays(today, -9) },
                { userId: 'user-5', dogId: 'dog-rocky-1', createdAt: addDays(today, -8) },
                { userId: 'user-8', dogId: 'dog-rocky-1', createdAt: addDays(today, -7) },
                { userId: 'user-2', dogId: maxDog.id, createdAt: addDays(today, -5) },
                { userId: 'user-9', dogId: maxDog.id, createdAt: addDays(today, -4) },
                { userId: 'user-8', dogId: 'dog-milo-3', createdAt: addDays(today, -3) },
                { userId: 'user-10', dogId: 'dog-milo-3', createdAt: addDays(today, -4) }
            ]
        })

        await prisma.comment.createMany({
            data: [
                {
                    content: 'Leo leverte et veldig stabilt show hele helgen.',
                    userId: 'user-1',
                    dogId: leoDog.id,
                    createdAt: addDays(today, -12)
                },
                {
                    content: 'Publikum elsker fokuset til Leo.',
                    userId: 'admin-2',
                    dogId: leoDog.id,
                    createdAt: addDays(today, -7)
                },
                {
                    content: 'Leo ser skarp ut i vendingene.',
                    userId: 'user-6',
                    dogId: leoDog.id,
                    createdAt: addDays(today, -4)
                },
                {
                    content: 'Sterk avslutning fra Leo i dag.',
                    userId: 'user-8',
                    dogId: leoDog.id,
                    createdAt: addDays(today, -2)
                },
                {
                    content: 'Leo har klart podium-aura akkurat na.',
                    userId: 'admin-1',
                    dogId: leoDog.id,
                    createdAt: addDays(today, -1)
                },
                {
                    content: 'Bella hadde masse publikum rundt ringen i kveld.',
                    userId: 'user-3',
                    dogId: 'dog-bella-1',
                    createdAt: addDays(today, -3)
                },
                {
                    content: 'Bella holder energien oppe fra start til slutt.',
                    userId: 'user-4',
                    dogId: 'dog-bella-1',
                    createdAt: addDays(today, -2)
                },
                {
                    content: 'Dette er ukens crowd pleaser.',
                    userId: 'user-7',
                    dogId: 'dog-bella-1',
                    createdAt: addDays(today, -1)
                },
                {
                    content: 'Max er trygg og fin i kontakt med publikum.',
                    userId: 'user-2',
                    dogId: maxDog.id,
                    createdAt: addDays(today, -6)
                },
                {
                    content: 'Max har hatt en veldig fin progresjon siden sist.',
                    userId: 'admin-1',
                    dogId: maxDog.id,
                    createdAt: addDays(today, -4)
                },
                {
                    content: 'Rocky var bedre enn forrige konkurranse.',
                    userId: 'admin-2',
                    dogId: 'dog-rocky-1',
                    createdAt: addDays(today, -9)
                },
                {
                    content: 'Milo er rask, men fortsatt ganske kontrollert.',
                    userId: 'user-9',
                    dogId: 'dog-milo-3',
                    createdAt: addDays(today, -5)
                }
            ]
        })

        function entryId(competitionId: string, dogId: string): string {
            const entry = competitionEntries.get(`${competitionId}:${dogId}`)
            if (!entry) {
                throw new Error(`Missing entry for ${competitionId}:${dogId}`)
            }
            return entry.id
        }

        await prisma.competitionRating.createMany({
            data: [
                {
                    userId: 'admin-1',
                    competitionEntryId: entryId('comp-completed-1', leoDog.id),
                    score: 5,
                    createdAt: addDays(today, -35)
                },
                {
                    userId: 'admin-2',
                    competitionEntryId: entryId('comp-completed-1', leoDog.id),
                    score: 5,
                    createdAt: addDays(today, -35)
                },
                {
                    userId: 'user-1',
                    competitionEntryId: entryId('comp-completed-1', leoDog.id),
                    score: 4,
                    createdAt: addDays(today, -34)
                },
                {
                    userId: 'admin-1',
                    competitionEntryId: entryId('comp-completed-1', 'dog-bella-1'),
                    score: 4,
                    createdAt: addDays(today, -35)
                },
                {
                    userId: 'admin-2',
                    competitionEntryId: entryId('comp-completed-1', 'dog-bella-1'),
                    score: 4,
                    createdAt: addDays(today, -35)
                },
                {
                    userId: 'user-1',
                    competitionEntryId: entryId('comp-completed-1', 'dog-bella-1'),
                    score: 4,
                    createdAt: addDays(today, -34)
                },
                {
                    userId: 'admin-1',
                    competitionEntryId: entryId('comp-completed-1', 'dog-rocky-1'),
                    score: 4,
                    createdAt: addDays(today, -35)
                },
                {
                    userId: 'admin-2',
                    competitionEntryId: entryId('comp-completed-1', 'dog-rocky-1'),
                    score: 3,
                    createdAt: addDays(today, -35)
                },
                {
                    userId: 'user-1',
                    competitionEntryId: entryId('comp-completed-1', 'dog-rocky-1'),
                    score: 3,
                    createdAt: addDays(today, -34)
                },
                {
                    userId: 'admin-1',
                    competitionEntryId: entryId('comp-completed-1', maxDog.id),
                    score: 3,
                    createdAt: addDays(today, -35)
                },
                {
                    userId: 'admin-2',
                    competitionEntryId: entryId('comp-completed-1', maxDog.id),
                    score: 2,
                    createdAt: addDays(today, -35)
                },
                {
                    userId: 'user-1',
                    competitionEntryId: entryId('comp-completed-1', maxDog.id),
                    score: 3,
                    createdAt: addDays(today, -34)
                },

                {
                    userId: 'admin-1',
                    competitionEntryId: entryId('comp-completed-2', leoDog.id),
                    score: 5,
                    createdAt: addDays(today, -19)
                },
                {
                    userId: 'admin-2',
                    competitionEntryId: entryId('comp-completed-2', leoDog.id),
                    score: 5,
                    createdAt: addDays(today, -19)
                },
                {
                    userId: 'user-1',
                    competitionEntryId: entryId('comp-completed-2', leoDog.id),
                    score: 5,
                    createdAt: addDays(today, -18)
                },
                {
                    userId: 'admin-1',
                    competitionEntryId: entryId('comp-completed-2', siriusDog.id),
                    score: 5,
                    createdAt: addDays(today, -19)
                },
                {
                    userId: 'admin-2',
                    competitionEntryId: entryId('comp-completed-2', siriusDog.id),
                    score: 4,
                    createdAt: addDays(today, -19)
                },
                {
                    userId: 'user-1',
                    competitionEntryId: entryId('comp-completed-2', siriusDog.id),
                    score: 4,
                    createdAt: addDays(today, -18)
                },
                {
                    userId: 'admin-1',
                    competitionEntryId: entryId('comp-completed-2', 'dog-ivy-4'),
                    score: 4,
                    createdAt: addDays(today, -19)
                },
                {
                    userId: 'admin-2',
                    competitionEntryId: entryId('comp-completed-2', 'dog-ivy-4'),
                    score: 4,
                    createdAt: addDays(today, -19)
                },
                {
                    userId: 'user-1',
                    competitionEntryId: entryId('comp-completed-2', 'dog-ivy-4'),
                    score: 3,
                    createdAt: addDays(today, -18)
                },
                {
                    userId: 'admin-1',
                    competitionEntryId: entryId('comp-completed-2', 'dog-koda-6'),
                    score: 3,
                    createdAt: addDays(today, -19)
                },
                {
                    userId: 'admin-2',
                    competitionEntryId: entryId('comp-completed-2', 'dog-koda-6'),
                    score: 2,
                    createdAt: addDays(today, -19)
                },
                {
                    userId: 'user-1',
                    competitionEntryId: entryId('comp-completed-2', 'dog-koda-6'),
                    score: 4,
                    createdAt: addDays(today, -18)
                },

                {
                    userId: 'admin-1',
                    competitionEntryId: entryId('comp-completed-3', 'dog-bella-1'),
                    score: 5,
                    createdAt: addDays(today, -8)
                },
                {
                    userId: 'admin-2',
                    competitionEntryId: entryId('comp-completed-3', 'dog-bella-1'),
                    score: 5,
                    createdAt: addDays(today, -8)
                },
                {
                    userId: 'user-1',
                    competitionEntryId: entryId('comp-completed-3', 'dog-bella-1'),
                    score: 4,
                    createdAt: addDays(today, -7)
                },
                {
                    userId: 'admin-1',
                    competitionEntryId: entryId('comp-completed-3', leoDog.id),
                    score: 4,
                    createdAt: addDays(today, -8)
                },
                {
                    userId: 'admin-2',
                    competitionEntryId: entryId('comp-completed-3', leoDog.id),
                    score: 4,
                    createdAt: addDays(today, -8)
                },
                {
                    userId: 'user-1',
                    competitionEntryId: entryId('comp-completed-3', leoDog.id),
                    score: 4,
                    createdAt: addDays(today, -7)
                },
                {
                    userId: 'admin-1',
                    competitionEntryId: entryId('comp-completed-3', 'dog-milo-3'),
                    score: 4,
                    createdAt: addDays(today, -8)
                },
                {
                    userId: 'admin-2',
                    competitionEntryId: entryId('comp-completed-3', 'dog-milo-3'),
                    score: 4,
                    createdAt: addDays(today, -8)
                },
                {
                    userId: 'user-1',
                    competitionEntryId: entryId('comp-completed-3', 'dog-milo-3'),
                    score: 3,
                    createdAt: addDays(today, -7)
                },
                {
                    userId: 'admin-1',
                    competitionEntryId: entryId('comp-completed-3', 'dog-nellie-6'),
                    score: 3,
                    createdAt: addDays(today, -8)
                },
                {
                    userId: 'admin-2',
                    competitionEntryId: entryId('comp-completed-3', 'dog-nellie-6'),
                    score: 3,
                    createdAt: addDays(today, -8)
                },
                {
                    userId: 'user-1',
                    competitionEntryId: entryId('comp-completed-3', 'dog-nellie-6'),
                    score: 2,
                    createdAt: addDays(today, -7)
                }
            ]
        })

        await prisma.advertisement.create({
            data: {
                imageData: DEFAULT_AD_IMAGE_DATA,
                isActive: true,
                followsCursor: false
            }
        })

        console.log('Created demo users, dogs, competitions, likes, comments and ratings.')
        console.log('Seeding finished.')
    } catch (error) {
        console.error(error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

if (import.meta.main) {
    main()
}
