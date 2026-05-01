import fs from 'fs';
import path from 'path';
import { test } from '@playwright/test';
import { generateNegativeCases } from '../negative-generator';

test('Generate Matrix', () => {
  const cases = generateNegativeCases();

  const output = cases.map(c => 
    `| ${c.name} | ${c.expectedStatus} | ${c.quirk ? 'Quirk: ' + c.quirk : ''} |`
  ).join('\n');

  const markdown = `# Negative Test Matrix\n\n| Case | Expected Status | Notes |\n|---|---|---|\n${output}\n`;

  fs.writeFileSync(path.resolve(__dirname, '../../../docs/negative-matrix.md'), markdown);
  fs.writeFileSync(path.resolve(__dirname, '../negative-cases.json'), JSON.stringify(cases, null, 2));

  console.log('Successfully generated docs/negative-matrix.md and tests/helpers/negative-cases.json');
});
