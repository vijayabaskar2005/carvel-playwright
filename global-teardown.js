const path = require('path');
const fs = require('fs');
const { getExecutionDir } = require('./utils/artifactManager');

module.exports = async function globalTeardown(config) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const excelReportPath = path.resolve(process.cwd(), 'reports', 'excel', 'execution-report.xlsx');
  const excelExists = fs.existsSync(excelReportPath);
  const runDir = getExecutionDir();

  // eslint-disable-next-line no-console
  console.log(`\n[${timestamp}] [GLOBAL TEARDOWN] Suite execution finished`);
  // eslint-disable-next-line no-console
  console.log(`[${timestamp}] [GLOBAL TEARDOWN] Historical Execution Artifacts: ${runDir}`);
  // eslint-disable-next-line no-console
  console.log(`[${timestamp}] [GLOBAL TEARDOWN] Excel Report: ${excelExists ? excelReportPath : 'Pending/Created'}\n`);
};
