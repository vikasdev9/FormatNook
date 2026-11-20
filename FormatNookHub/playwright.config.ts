import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT || 3007;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: 'chrome',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
  webServer: {
    command: `node ./node_modules/next/dist/bin/next start -H 127.0.0.1 -p ${PORT}`,
    cwd: __dirname,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
