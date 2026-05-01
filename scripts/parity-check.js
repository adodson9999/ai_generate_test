#!/usr/bin/env node
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tmpDir = path.resolve(__dirname, '../parity-tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
const paritySpecs = [
  'tests/auth.spec.ts',
  'tests/booking.spec.ts',
  'tests/booking-lifecycle.spec.ts',
  'tests/booking.negative.spec.ts',
];

console.log('=== Running Playwright with JSON reporter ===');
const pwOutFile = path.join(tmpDir, 'playwright.json');
const pwRun = spawnSync(
  'npx',
  [
    'playwright',
    'test',
    '--reporter=json',
    ...paritySpecs,
  ],
  {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      // Force JSON reporter output to file across Playwright versions.
      PLAYWRIGHT_JSON_OUTPUT_FILE: pwOutFile,
      PLAYWRIGHT_JSON_OUTPUT_NAME: path.basename(pwOutFile),
    },
  }
);

// Playwright JSON reporter writes the report to stdout. Preserve it regardless of exit code.
const pwStdout = pwRun.stdout || '';
const pwStderr = pwRun.stderr || '';
if (!fs.existsSync(pwOutFile)) {
  fs.writeFileSync(pwOutFile, pwStdout || '{}');
}

const pwReportRaw = fs.readFileSync(pwOutFile, 'utf8');
if (!pwReportRaw.trim()) {
  console.error('ERROR: Playwright produced empty JSON output.');
  if (pwStderr.trim()) {
    console.error('\n=== Playwright stderr ===');
    console.error(pwStderr);
  }
  process.exit(1);
}

console.log('=== Running Cypress with mochawesome reporter ===');
execSync(
  `npx cypress run --spec 'cypress/e2e/auth.cy.js,cypress/e2e/booking.cy.js,cypress/e2e/booking-lifecycle.cy.js,cypress/e2e/booking.negative.cy.js' --reporter mochawesome --reporter-options reportDir=${tmpDir}/cypress-reports,overwrite=false,html=false,json=true`,
  { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' }
);

// Parse Playwright results
const pwRawText = pwReportRaw;
let pwRaw;
try {
  pwRaw = JSON.parse(pwRawText);
} catch (_e) {
  // Defensive parse: tolerate incidental non-JSON noise around report output
  const jsonStart = pwRawText.indexOf('{');
  const jsonEnd = pwRawText.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    pwRaw = JSON.parse(pwRawText.slice(jsonStart, jsonEnd + 1));
  } else {
    throw new Error('Could not parse Playwright JSON report.');
  }
}
const pwTests = [];
for (const suite of pwRaw.suites || []) {
  const walkPw = (s, parentTitle) => {
    const suiteName = parentTitle ? parentTitle + ' › ' + s.title : s.title;
    for (const spec of s.specs || []) {
      const status = spec.tests?.[0]?.results?.[0]?.status || 'unknown';
      pwTests.push({ suite: suiteName, test: spec.title, status: status === 'passed' ? 'passed' : 'failed' });
    }
    for (const child of s.suites || []) {
      walkPw(child, suiteName);
    }
  };
  walkPw(suite, '');
}

// Parse Cypress results (mochawesome)
const cyReportFiles = fs.readdirSync(path.join(tmpDir, 'cypress-reports'))
  .filter(f => f.endsWith('.json'))
  .sort();
const cyTests = [];
for (const file of cyReportFiles) {
  const report = JSON.parse(fs.readFileSync(path.join(tmpDir, 'cypress-reports', file), 'utf8'));
  const walkCy = (suite, parentTitle) => {
    const suiteName = parentTitle ? parentTitle + ' › ' + suite.title : suite.title;
    for (const test of suite.tests || []) {
      cyTests.push({ suite: suiteName, test: test.title, status: test.pass ? 'passed' : 'failed' });
    }
    for (const child of suite.suites || []) {
      walkCy(child, suiteName);
    }
  };
  for (const suite of report.results || []) {
    for (const s of suite.suites || []) {
      walkCy(s, '');
    }
  }
}

// Filter out framework-specific tests
const filterFrameworkSpecific = (tests) => tests.filter(t =>
  !t.test.includes('@playwright-only') && !t.test.includes('@cypress-only') &&
  !t.suite.includes('Schema Validator Helper') && !t.suite.includes('Negative Generator Helper') &&
  !t.test.includes('Generate Matrix') && !t.test.includes('Flush perf results')
);

const pwFiltered = filterFrameworkSpecific(pwTests);
const cyFiltered = filterFrameworkSpecific(cyTests);

// Normalize test names for comparison
const normalize = (t) => t.test.trim().replace(/\s+/g, ' ');

const pwNames = new Set(pwFiltered.map(normalize));
const cyNames = new Set(cyFiltered.map(normalize));

const onlyPw = [...pwNames].filter(n => !cyNames.has(n));
const onlyCy = [...cyNames].filter(n => !pwNames.has(n));

// Check for empty
if (pwFiltered.length === 0) {
  console.error('ERROR: Playwright returned 0 tests. Parity check aborted.');
  if (pwRaw?.stats) {
    console.error(`Playwright stats: ${JSON.stringify(pwRaw.stats)}`);
  }
  if (pwStderr.trim()) {
    console.error('\n=== Playwright stderr ===');
    console.error(pwStderr);
  }
  process.exit(1);
}
if (cyFiltered.length === 0) {
  console.error('ERROR: Cypress returned 0 tests. Parity check aborted.');
  process.exit(1);
}

// Status divergence
const statusDivergences = [];
for (const pwt of pwFiltered) {
  const name = normalize(pwt);
  const cyt = cyFiltered.find(c => normalize(c) === name);
  if (cyt && pwt.status !== cyt.status) {
    statusDivergences.push({ test: pwt.test, playwright: pwt.status, cypress: cyt.status });
  }
}

// Report
console.log('\n=== PARITY REPORT ===');
console.log(`Playwright tests: ${pwFiltered.length}`);
console.log(`Cypress tests:    ${cyFiltered.length}`);

let exitCode = 0;

if (onlyPw.length > 0) {
  console.log(`\n❌ Tests only in Playwright (${onlyPw.length}):`);
  onlyPw.forEach(t => console.log(`  - ${t}`));
  exitCode = 1;
}
if (onlyCy.length > 0) {
  console.log(`\n❌ Tests only in Cypress (${onlyCy.length}):`);
  onlyCy.forEach(t => console.log(`  - ${t}`));
  exitCode = 1;
}
if (statusDivergences.length > 0) {
  console.log(`\n❌ Status divergences (${statusDivergences.length}):`);
  console.log('| Test | Playwright | Cypress |');
  console.log('|---|---|---|');
  statusDivergences.forEach(d => console.log(`| ${d.test} | ${d.playwright} | ${d.cypress} |`));
  exitCode = 1;
}

if (exitCode === 0) {
  const commonCount = [...pwNames].filter(n => cyNames.has(n)).length;
  console.log(`\n✅ PARITY ACHIEVED: ${commonCount} tests in both runners, 0 divergences.`);
} else {
  console.log('\n❌ PARITY CHECK FAILED');
}

// Cleanup
fs.rmSync(tmpDir, { recursive: true, force: true });

process.exit(exitCode);
