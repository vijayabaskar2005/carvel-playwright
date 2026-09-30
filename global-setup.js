const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { initExecutionRun } = require('./utils/artifactManager');

module.exports = async function globalSetup(config) {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  // Ensure output directories exist
  const dirs = [
    path.resolve(process.cwd(), 'reports', 'excel'),
    path.resolve(process.cwd(), 'playwright-report'),
    path.resolve(process.cwd(), 'test-results'),
    path.resolve(process.cwd(), 'screenshots'),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Initialize unique timestamped execution run directory:
  // artifacts/executions/YYYY-MM-DD/HH-mm-ss/
  const runDir = initExecutionRun();

  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  // eslint-disable-next-line no-console
  console.log(`\n[${timestamp}] [GLOBAL SETUP] Initialized Carvel test environment`);
  // eslint-disable-next-line no-console
  console.log(`[${timestamp}] [GLOBAL SETUP] Historical Artifacts Directory: ${runDir}`);
  // eslint-disable-next-line no-console
  console.log(`[${timestamp}] [GLOBAL SETUP] Base URL: ${process.env.BASE_URL || 'https://car.uat.focusbrands.com'}`);
};
