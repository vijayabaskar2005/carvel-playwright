const fs = require('fs');
const path = require('path');
const { log_step } = require('./logger');

const ARTIFACTS_ROOT = path.resolve(process.cwd(), 'artifacts', 'executions');
const CURRENT_RUN_FILE = path.join(ARTIFACTS_ROOT, '.current-run.json');

/**
 * Format date as YYYY-MM-DD
 */
function getFormattedDate(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format time as HH-mm-ss
 */
function getFormattedTime(date = new Date()) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}-${mm}-${ss}`;
}

/**
 * Initialize a new execution run directory in global-setup.
 * Structure: artifacts/executions/YYYY-MM-DD/HH-mm-ss/
 *   ├── screenshots/
 *   ├── videos/
 *   ├── traces/
 *   └── reports/
 */
function initExecutionRun() {
  const dateStr = getFormattedDate();
  const timeStr = getFormattedTime();

  process.env.EXECUTION_DATE = dateStr;
  process.env.EXECUTION_TIME = timeStr;

  const runDir = path.join(ARTIFACTS_ROOT, dateStr, timeStr);

  const subdirs = [
    path.join(runDir, 'screenshots'),
    path.join(runDir, 'videos'),
    path.join(runDir, 'traces'),
    path.join(runDir, 'reports'),
  ];

  for (const dir of subdirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  process.env.EXECUTION_RUN_DIR = runDir;

  try {
    fs.writeFileSync(
      CURRENT_RUN_FILE,
      JSON.stringify(
        {
          date: dateStr,
          time: timeStr,
          runDir,
          initializedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } catch {
    // Ignore marker write error
  }

  return runDir;
}

/**
 * Get or create current execution directory.
 */
function getExecutionDir() {
  if (process.env.EXECUTION_RUN_DIR && fs.existsSync(process.env.EXECUTION_RUN_DIR)) {
    return process.env.EXECUTION_RUN_DIR;
  }

  if (fs.existsSync(CURRENT_RUN_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CURRENT_RUN_FILE, 'utf-8'));
      if (data.runDir && fs.existsSync(data.runDir)) {
        process.env.EXECUTION_RUN_DIR = data.runDir;
        process.env.EXECUTION_DATE = data.date;
        process.env.EXECUTION_TIME = data.time;
        return data.runDir;
      }
    } catch {
      // Fall through to initialize
    }
  }

  return initExecutionRun();
}

/**
 * Extract standard test case ID (e.g., TC_001) from title or test info.
 */
function getTestCaseId(testOrTitle) {
  const title = typeof testOrTitle === 'string' ? testOrTitle : (testOrTitle && testOrTitle.title) || '';
  const match = title.match(/\b(TC_\d{3})\b/i);
  return match ? match[1].toUpperCase() : 'TC_001';
}

/**
 * Capture a meaningful checkpoint screenshot and store it permanently.
 * Path: artifacts/executions/YYYY-MM-DD/HH-mm-ss/screenshots/<tcId>/<tcId>_<checkpoint>.png
 */
async function captureCheckpoint(page, checkpointName, testInfo) {
  if (!page || page.isClosed()) return;

  const currentTitle = (testInfo && testInfo.title) || '';
  const tcId = getTestCaseId(currentTitle);
  const cleanCheckpoint = checkpointName
    .replace(/^TC_\d+[\s_-]*/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const filename = `${tcId}_${cleanCheckpoint}.png`;
  const executionDir = getExecutionDir();
  const tcScreenshotDir = path.join(executionDir, 'screenshots', tcId);

  if (!fs.existsSync(tcScreenshotDir)) {
    fs.mkdirSync(tcScreenshotDir, { recursive: true });
  }

  const destinationPath = path.join(tcScreenshotDir, filename);

  try {
    await page.screenshot({ path: destinationPath, fullPage: false });

    // Also copy to legacy screenshots/ directory for backward compatibility
    const legacyDir = path.resolve(process.cwd(), 'screenshots');
    if (!fs.existsSync(legacyDir)) {
      fs.mkdirSync(legacyDir, { recursive: true });
    }
    const legacyPath = path.join(legacyDir, filename);
    try {
      fs.copyFileSync(destinationPath, legacyPath);
    } catch {
      // Ignore legacy copy error
    }

    if (testInfo && testInfo.attach) {
      await testInfo.attach(filename, {
        path: destinationPath,
        contentType: 'image/png',
      }).catch(() => {});
    }

    log_step(`[CHECKPOINT] Captured screenshot: ${tcId}/${filename}`);
  } catch (err) {
    log_step(`[WARN] Failed to capture checkpoint screenshot: ${err.message}`);
  }
}

/**
 * Archive videos and traces from test results to permanent execution storage.
 * Videos: artifacts/executions/YYYY-MM-DD/HH-mm-ss/videos/<tcId>/<tcId>_execution.webm
 * Traces: artifacts/executions/YYYY-MM-DD/HH-mm-ss/traces/<tcId>/<tcId>_trace.zip
 */
function archiveTestAttachments(test, result) {
  const tcId = getTestCaseId(test.title);
  const executionDir = getExecutionDir();

  const tcVideoDir = path.join(executionDir, 'videos', tcId);
  const tcTraceDir = path.join(executionDir, 'traces', tcId);
  const tcScreenshotDir = path.join(executionDir, 'screenshots', tcId);

  // 1. Process result.attachments if available
  if (result && result.attachments && result.attachments.length > 0) {
    for (const attachment of result.attachments) {
      if (!attachment.path || !fs.existsSync(attachment.path)) continue;

      // Archive video
      if (attachment.name === 'video' || attachment.path.endsWith('.webm')) {
        if (!fs.existsSync(tcVideoDir)) {
          fs.mkdirSync(tcVideoDir, { recursive: true });
        }
        const targetVideo = path.join(tcVideoDir, `${tcId}_execution.webm`);
        try {
          fs.copyFileSync(attachment.path, targetVideo);
          log_step(`[ARCHIVE] Video archived: ${tcId}/${tcId}_execution.webm`);
        } catch (err) {
          log_step(`[WARN] Could not archive video: ${err.message}`);
        }
      }

      // Archive trace
      if (attachment.name === 'trace' || attachment.path.endsWith('.zip')) {
        if (!fs.existsSync(tcTraceDir)) {
          fs.mkdirSync(tcTraceDir, { recursive: true });
        }
        const targetTrace = path.join(tcTraceDir, `${tcId}_trace.zip`);
        try {
          fs.copyFileSync(attachment.path, targetTrace);
          log_step(`[ARCHIVE] Trace archived: ${tcId}/${tcId}_trace.zip`);
        } catch (err) {
          log_step(`[WARN] Could not archive trace: ${err.message}`);
        }
      }

      // Archive failure screenshot
      if (attachment.name === 'screenshot' || (attachment.path.endsWith('.png') && result.status !== 'passed')) {
        if (!fs.existsSync(tcScreenshotDir)) {
          fs.mkdirSync(tcScreenshotDir, { recursive: true });
        }
        const targetScreenshot = path.join(tcScreenshotDir, `${tcId}_failure.png`);
        try {
          fs.copyFileSync(attachment.path, targetScreenshot);
          log_step(`[ARCHIVE] Failure screenshot archived: ${tcId}/${tcId}_failure.png`);
        } catch (err) {
          log_step(`[WARN] Could not archive screenshot: ${err.message}`);
        }
      }
    }
  }

  // 2. Also scan test-results directory for any matching test artifacts
  const testResultsDir = path.resolve(process.cwd(), 'test-results');
  if (fs.existsSync(testResultsDir)) {
    try {
      const entries = fs.readdirSync(testResultsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirLower = entry.name.toLowerCase();
          if (dirLower.includes(tcId.toLowerCase())) {
            const folderPath = path.join(testResultsDir, entry.name);
            const subFiles = fs.readdirSync(folderPath);
            for (const file of subFiles) {
              const fullFilePath = path.join(folderPath, file);
              if (file.endsWith('.webm')) {
                if (!fs.existsSync(tcVideoDir)) fs.mkdirSync(tcVideoDir, { recursive: true });
                const targetVideo = path.join(tcVideoDir, `${tcId}_execution.webm`);
                if (!fs.existsSync(targetVideo)) {
                  fs.copyFileSync(fullFilePath, targetVideo);
                  log_step(`[ARCHIVE] Scanned video archived: ${tcId}/${tcId}_execution.webm`);
                }
              }
              if (file.endsWith('.zip')) {
                if (!fs.existsSync(tcTraceDir)) fs.mkdirSync(tcTraceDir, { recursive: true });
                const targetTrace = path.join(tcTraceDir, `${tcId}_trace.zip`);
                if (!fs.existsSync(targetTrace)) {
                  fs.copyFileSync(fullFilePath, targetTrace);
                  log_step(`[ARCHIVE] Scanned trace archived: ${tcId}/${tcId}_trace.zip`);
                }
              }
            }
          }
        }
      }
    } catch {
      // Ignore scan errors
    }
  }
}

module.exports = {
  initExecutionRun,
  getExecutionDir,
  getTestCaseId,
  captureCheckpoint,
  archiveTestAttachments,
  getFormattedDate,
  getFormattedTime,
};
