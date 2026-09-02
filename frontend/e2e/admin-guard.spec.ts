import { expect, test } from '@playwright/test'

test('non-admin users are redirected away from admin dashboard', async ({ page }) => {
    await page.goto('/admin-dashboard')
    await expect(page).toHaveURL(/\/$/)
})
