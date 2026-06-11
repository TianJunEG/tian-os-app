#!/usr/bin/env node
// Master PSL seed script — runs all skill + template seeds in order.
// Usage: node scripts/seedPSLAll.js

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SEEDS = [
  // Skills first
  'seedPSLSkills.js',
  'seedPSLP4Skills.js',
  'seedPSLP5Skills.js',
  'seedPSLP6Skills.js',
  'seedPSLBeforeAfterSkills.js',
  'seedPSLWorkBackwardsSkills.js',
  'seedPSLMultiStepSkills.js',
  'seedPSLGuessCheckSkills.js',
  // Then templates
  'seedPSLTemplates.js',
  'seedPSLP4Templates.js',
  'seedPSLP5Templates.js',
  'seedPSLP6Templates.js',
  'seedPSLBeforeAfterTemplates.js',
  'seedPSLWorkBackwardsTemplates.js',
  'seedPSLMultiStepTemplates.js',
  'seedPSLGuessCheckTemplates.js',
];

console.log('=== PSL Full Seed ===\n');

for (const seed of SEEDS) {
  const fullPath = path.join(__dirname, seed);
  console.log(`Running ${seed}...`);
  try {
    execSync(`node "${fullPath}"`, { stdio: 'inherit', env: process.env });
  } catch (err) {
    console.error(`FAILED: ${seed}`);
    process.exit(1);
  }
}

console.log('\n=== All PSL seeds complete ===');
