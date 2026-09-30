const { defineConfig, devices } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = defineConfig({
  testDir: './tests',
  timeout: 180000,
  globalSetup: './global-setup.js',
  globalTeardown: './global-teardown.js',
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['./utils/excelReporter.js'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://car.uat.focusbrands.com',
    ignoreHTTPSErrors: true,
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 20000,
    navigationTimeout: 40000,
    permissions: ['geolocation'],
    geolocation: { latitude: 40.7048, longitude: -74.0137 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1400, height: 900 },
      },
    },
  ],
});
