import { defineConfig } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration for Adamjee Coaching
 * Configured safely for live application environments.
 */
export default defineConfig({
  testDir: './e2e',
  /* Maximum time one test can run for */
  timeout: 45 * 1000,
  expect: {
    /* Maximum time expect() should wait for condition to be met */
    timeout: 10 * 1000,
  },
  /* Run tests sequentially to avoid overloading the live database */
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Capture screenshot after each test failure */
    screenshot: 'only-on-failure',

    /* Capture video on failure */
    video: 'retain-on-failure',

    actionTimeout: 15 * 1000,
  },

  projects: [
    {
      name: 'Google Chrome',
      use: {
        channel: 'chrome',
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
