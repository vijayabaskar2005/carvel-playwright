const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { archiveTestAttachments, getExecutionDir } = require('./artifactManager');

class ExcelReporter {
  constructor() {
    this.records = [];
    this.testMap = new Map();
  }

  onStepEnd(test, result, step) {
    // Only capture top-level validation steps defined via test.step()
    if (step.category !== 'test.step' || (step.parent && step.parent.category === 'test.step')) {
      return;
    }

    const testIdMatch = test.title.match(/^(TC_\d+|Smoke\s*\d+)/i);
    const testCaseId = testIdMatch ? testIdMatch[1].toUpperCase() : 'TC_001';
    const testName = test.title.replace(/^(TC_\d+|Smoke\s*\d+)[\s:–-]+/i, '').trim();

    let stepKey = step.title;
    let expectedResult = step.title;

    if (step.title.includes('|')) {
      const parts = step.title.split('|').map((p) => p.trim());
      stepKey = parts[0];
      expectedResult = parts[1];
    }

    const isPassed = !step.error;
    const status = isPassed ? 'PASS' : 'FAIL';

    // Format clean timestamp (YYYY-MM-DD HH:MM:SS)
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    // Clean any terminal ANSI color escape codes from error messages
    const rawError = (step.error && step.error.message) || '';
    const cleanError = rawError
      .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
      .replace(/^Error:\s*/i, '')
      .split('\n')[0]
      .trim();

    const actualResult = isPassed ? 'Validated successfully' : (cleanError || 'Validation failed');

    const record = {
      testCaseId,
      testName,
      stepKey,
      expectedResult,
      actualResult,
      status,
      timestamp,
    };

    const testKey = test.id;
    if (!this.testMap.has(testKey)) {
      this.testMap.set(testKey, []);
    }
    this.testMap.get(testKey).push(record);
  }

  onTestEnd(test, result) {
    const testKey = test.id;
    const records = this.testMap.get(testKey) || [];

    // Match step-level actual result annotations (e.g. excel-actual:homepage)
    if (result.annotations && result.annotations.length > 0) {
      for (const annotation of result.annotations) {
        if (annotation.type.startsWith('excel-actual:')) {
          const stepPrefix = annotation.type.replace('excel-actual:', '').trim().toLowerCase();
          const targetRecord = records.find(
            (r) =>
              r.stepKey.toLowerCase().includes(stepPrefix) ||
              r.expectedResult.toLowerCase().includes(stepPrefix)
          );
          if (targetRecord && annotation.description) {
            targetRecord.actualResult = annotation.description;
          }
        }
      }
    }

    // Fallback if test had no test.step() calls
    if (records.length === 0) {
      const testIdMatch = test.title.match(/^(TC_\d+|Smoke\s*\d+)/i);
      const testCaseId = testIdMatch ? testIdMatch[1].toUpperCase() : 'TC_001';
      const testName = test.title.replace(/^(TC_\d+|Smoke\s*\d+)[\s:–-]+/i, '').trim();
      const status = result.status === 'passed' ? 'PASS' : 'FAIL';
      const rawError = (result.error && result.error.message) || '';
      const cleanError = rawError
        .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
        .replace(/^Error:\s*/i, '')
        .split('\n')[0]
        .trim();
      const actualResult = result.status === 'passed' ? 'Test passed successfully' : (cleanError || 'Test failed');

      records.push({
        testCaseId,
        testName,
        stepKey: 'Overall',
        expectedResult: 'Test scenario should complete and pass all assertions',
        actualResult,
        status,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    }

    this.records.push(...records);

    // Archive historical artifacts (videos, traces, failure screenshots)
    try {
      archiveTestAttachments(test, result);
    } catch {
      // Ignore archiving error during test execution
    }
  }

  async onEnd(result) {
    const outputDir = path.resolve(process.cwd(), 'reports', 'excel');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, 'execution-report.xlsx');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Carvel Playwright QA Automation';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Execution Report', {
      views: [{ showGridLines: true }],
    });

    worksheet.columns = [
      { header: 'Test Case ID', key: 'testCaseId', width: 16 },
      { header: 'Test Name', key: 'testName', width: 32 },
      { header: 'Assertion / Expected Result', key: 'expectedResult', width: 50 },
      { header: 'Actual Result', key: 'actualResult', width: 68 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Timestamp', key: 'timestamp', width: 22 },
    ];

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add Data Rows & Style
    this.records.forEach((record, idx) => {
      const row = worksheet.addRow({
        testCaseId: record.testCaseId,
        testName: record.testName,
        expectedResult: record.expectedResult,
        actualResult: record.actualResult,
        status: record.status,
        timestamp: record.timestamp,
      });

      row.height = 24;
      row.font = { name: 'Calibri', size: 10 };

      // Alternating row background
      if (idx % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };
      }

      // Column Alignments
      row.getCell('testCaseId').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('testName').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('expectedResult').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      row.getCell('actualResult').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      row.getCell('timestamp').alignment = { vertical: 'middle', horizontal: 'center' };

      // Status cell styling
      const statusCell = row.getCell('status');
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (record.status === 'PASS') {
        statusCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF2E7D32' } };
      } else {
        statusCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFC62828' } };
      }

      // Thin borders
      ['A', 'B', 'C', 'D', 'E', 'F'].forEach((col) => {
        row.getCell(col).border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
      });
    });

    // Write primary report
    await workbook.xlsx.writeFile(filePath);

    // Also write to permanent historical execution directory
    try {
      const executionDir = getExecutionDir();
      const historicalReportDir = path.join(executionDir, 'reports');
      if (!fs.existsSync(historicalReportDir)) {
        fs.mkdirSync(historicalReportDir, { recursive: true });
      }
      const historicalExcelPath = path.join(historicalReportDir, 'execution-report.xlsx');
      await workbook.xlsx.writeFile(historicalExcelPath);
    } catch {
      // Ignore historical report write failure
    }
  }
}

module.exports = ExcelReporter;
module.exports.ExcelReporter = ExcelReporter;
module.exports.default = ExcelReporter;
