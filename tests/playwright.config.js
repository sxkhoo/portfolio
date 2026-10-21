import { defineConfig, devices } from '@playwright/test';

const viewport = { width: 1440, height: 900 };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4173' },
  // the site has no build step: serve the repo root as-is
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory ..',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: true,
    stderr: 'ignore',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport } },
  ],
});
