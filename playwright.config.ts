import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  reporter: [['list']],
  use: {
    extraHTTPHeaders: { 'Accept': 'application/json' },
  },
});
