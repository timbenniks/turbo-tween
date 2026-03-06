import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:4174',
  },
  webServer: {
    command: 'pnpm vite --config tests/e2e/vite.e2e.config.ts --port 4174',
    port: 4174,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
