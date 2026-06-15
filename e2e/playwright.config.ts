import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 15000,
  expect: { timeout: 5000 },
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
