import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: process.env.E2E_BASE_URL ? undefined : { command: 'npm run preview', url: baseURL, reuseExistingServer: true },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], browserName: 'chromium' } },
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 390, height: 844 } } }
  ]
});
