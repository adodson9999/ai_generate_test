import { test, expect } from '@playwright/test';
import { generateNegativeCases } from '../negative-generator';

test.describe('Negative Generator Helper', () => {
  test('Generates at least 25 cases', () => {
    const cases = generateNegativeCases();
    expect(cases.length).toBeGreaterThanOrEqual(25);
  });

  test('Cases have deterministic names', () => {
    const cases = generateNegativeCases();
    expect(cases[0].name).toContain('POST /booking');
  });
});
