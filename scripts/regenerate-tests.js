#!/usr/bin/env node

/**
 * Regenerate tests from OpenAPI fragments using the hero prompt.
 *
 * Usage:
 *   node scripts/regenerate-tests.js --fragment specs/booking-openapi.yaml --framework playwright [--dry-run]
 *
 * This is a framework script. The actual LLM call requires an API key
 * set via environment variable: ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const fragmentIdx = args.indexOf('--fragment');
const frameworkIdx = args.indexOf('--framework');
const dryRun = args.includes('--dry-run');

if (fragmentIdx === -1) {
  console.error('Usage: node scripts/regenerate-tests.js --fragment <path> --framework <playwright|cypress> [--dry-run]');
  process.exit(1);
}

const fragment = args[fragmentIdx + 1];
const framework = frameworkIdx !== -1 ? args[frameworkIdx + 1] : 'playwright';

if (!fs.existsSync(fragment)) {
  console.error(`Fragment not found: ${fragment}`);
  process.exit(1);
}

const heroPromptPath = path.resolve(__dirname, '../prompts/api-test-gen.md');
const heroPrompt = fs.existsSync(heroPromptPath) ? fs.readFileSync(heroPromptPath, 'utf8') : '';
const specContent = fs.readFileSync(fragment, 'utf8');

console.log(`\n=== Test Regeneration ===`);
console.log(`Fragment:  ${fragment}`);
console.log(`Framework: ${framework}`);
console.log(`Dry run:   ${dryRun}`);
console.log(`Spec size: ${specContent.length} characters`);

if (specContent.length > 50000) {
  console.error('ERROR: Fragment exceeds 50k character limit. Aborting to prevent excessive API costs.');
  process.exit(1);
}

if (dryRun) {
  console.log('\n[DRY RUN] Would call LLM API with:');
  console.log(`  - Hero prompt: ${heroPrompt.length} chars`);
  console.log(`  - Spec fragment: ${specContent.length} chars`);
  console.log(`  - Target framework: ${framework}`);
  console.log(`  - Estimated tokens: ~${Math.ceil((heroPrompt.length + specContent.length) / 4)}`);
  console.log('\n[DRY RUN] No files modified.');
  process.exit(0);
}

// Check for API keys
const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('\nERROR: No LLM API key found. Set one of:');
  console.error('  ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY');
  console.error('\nFor CI, add the key as a GitHub Actions secret.');
  process.exit(1);
}

console.log('\nLLM API key detected. Ready to regenerate.');
console.log('TODO: Implement actual LLM call. This is a framework ready for integration.');
console.log('The hero prompt and spec fragment are loaded and validated.');
