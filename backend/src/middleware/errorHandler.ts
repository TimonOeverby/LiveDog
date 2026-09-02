export function errorHandler(error: unknown): Response {
    console.error('Error:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'

    return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    })
}
