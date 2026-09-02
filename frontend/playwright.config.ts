import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    retries: process.env.CI ? 2 : 0,
    reporter: 'list',
    use: {
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ],
    webServer: {
        command: 'bun run dev --host 127.0.0.1 --port 5173',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: true,
        timeout: 120000
    }
})
