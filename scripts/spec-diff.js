#!/usr/bin/env node

/**
 * Spec Drift Detector — checks if OpenAPI specs changed since last commit.
 * Usage: node scripts/spec-diff.js [base-ref]
 * Default base-ref: HEAD~1
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const baseRef = process.argv[2] || 'HEAD~1';
const specsDir = 'specs';

function getChangedSpecs() {
  try {
    const diff = execSync(`git diff --name-only ${baseRef} -- ${specsDir}/*.yaml`, { encoding: 'utf8' });
    return diff.trim().split('\n').filter(Boolean);
  } catch {
    console.log('No git history available. Listing all specs as "changed".');
    return fs.readdirSync(path.resolve(specsDir)).filter(f => f.endsWith('.yaml')).map(f => path.join(specsDir, f));
  }
}

function summarizeDiff(filePath) {
  const summary = [];
  try {
    const oldContent = execSync(`git show ${baseRef}:${filePath}`, { encoding: 'utf8' });
    const newContent = fs.readFileSync(path.resolve(filePath), 'utf8');
    const oldDoc = yaml.load(oldContent);
    const newDoc = yaml.load(newContent);

    const oldSchemas = Object.keys(oldDoc?.components?.schemas || {});
    const newSchemas = Object.keys(newDoc?.components?.schemas || {});

    const added = newSchemas.filter(s => !oldSchemas.includes(s));
    const removed = oldSchemas.filter(s => !newSchemas.includes(s));

    added.forEach(s => summary.push(`+ Added schema: ${s}`));
    removed.forEach(s => summary.push(`- Removed schema: ${s}`));

    // Check field changes in common schemas
    for (const schema of newSchemas.filter(s => oldSchemas.includes(s))) {
      const oldProps = Object.keys(oldDoc.components.schemas[schema]?.properties || {});
      const newProps = Object.keys(newDoc.components.schemas[schema]?.properties || {});
      const addedFields = newProps.filter(p => !oldProps.includes(p));
      const removedFields = oldProps.filter(p => !newProps.includes(p));
      addedFields.forEach(f => summary.push(`+ Added field '${f}' to ${schema}`));
      removedFields.forEach(f => summary.push(`- Removed field '${f}' from ${schema}`));
    }
  } catch (e) {
    summary.push(`New file: ${filePath}`);
  }

  return summary;
}

// Main
const changedSpecs = getChangedSpecs();
if (changedSpecs.length === 0) {
  console.log('No spec changes detected.');
  process.exit(0);
}

console.log(`\n=== Spec Changes Detected (${changedSpecs.length} file(s)) ===\n`);
for (const spec of changedSpecs) {
  console.log(`📄 ${spec}:`);
  const summary = summarizeDiff(spec);
  if (summary.length === 0) {
    console.log('  (minor changes — no schema additions/removals detected)');
  } else {
    summary.forEach(s => console.log(`  ${s}`));
  }
  console.log();
}
