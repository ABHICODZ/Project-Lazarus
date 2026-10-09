import { defineConfig, devices } from '@playwright/test';

const PORT = 4399;
const BASE = process.env.SITE_BASE ?? '/Project-Lazarus';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}${BASE.replace(/\/$/, '')}/`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  // Tests run against the production build, so `npm run build` must have run first.
  webServer: { command: `npx astro preview --port ${PORT}`, port: PORT, reuseExistingServer: !process.env.CI },
});
