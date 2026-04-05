const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  outputDir: './e2e/test-results',
  reporter: [
    ['list'],
    ['json', { outputFile: 'e2e/test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',
    trace: 'on-first-retry',
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: 'npx serve . -p 3000 -s',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
