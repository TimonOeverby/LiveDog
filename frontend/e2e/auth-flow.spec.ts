import { expect, test } from '@playwright/test'

test('register, logout, and login flow works for a regular user', async ({ page }) => {
    const id = Date.now()
    const email = `e2e-user-${id}@example.com`
    const password = 'secret123'

    const user = {
        id: `user-${id}`,
        username: `e2euser${id}`,
        email,
        role: 'USER',
        imageUrl: null
    }

    await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ sessionId: `session-${id}`, token: `session-${id}`, user })
        })
    })

    await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ sessionId: `session-${id}`, token: `session-${id}`, user })
        })
    })

    await page.goto('/register')
    await page.fill('#email', email)
    await page.fill('#password', password)
    await page.fill('#confirmPassword', password)
    await page.getByRole('button', { name: 'Registrer' }).click()

    await page.waitForURL('**/', { timeout: 5000 })
    await expect(page.locator('header .avatar-wrapper .avatar')).toBeVisible()

    await page.locator('header .avatar-wrapper .avatar').click()
    await page.getByRole('button', { name: 'Logg ut' }).click()
    await expect(page.getByRole('link', { name: 'Logg inn' })).toBeVisible()

    await page.goto('/login')
    await page.fill('#email', email)
    await page.fill('#password', password)
    await page.getByRole('button', { name: 'Logg inn' }).click()

    await page.waitForURL('**/', { timeout: 5000 })
    await expect(page.locator('header .avatar-wrapper .avatar')).toBeVisible()
})
