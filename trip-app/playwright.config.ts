import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { launchOptions: process.env.CI ? {} : { executablePath: '/opt/pw-browsers/chromium' }, baseURL: 'http://localhost:5180', viewport: { width: 400, height: 800 }, trace: 'off' },
  webServer: { command: 'npm run dev -- --port 5180 --strictPort', url: 'http://localhost:5180', reuseExistingServer: true, timeout: 60_000 },
});
