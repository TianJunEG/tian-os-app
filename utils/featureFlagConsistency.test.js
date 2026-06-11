import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendSrc = fs.readFileSync(path.join(root, 'config/featureFlags.js'), 'utf8');
const frontendSrc = fs.readFileSync(path.join(root, 'frontend/src/config/featureFlags.js'), 'utf8');

function parseBackendDefaults(src) {
  const defaults = new Map();
  const block = src.match(/export const FLAGS\s*=\s*\{([\s\S]*?)\};/);
  if (!block) return defaults;
  for (const line of block[1].split('\n')) {
    const hardTrue = line.match(/^\s*(\w+)\s*:\s*true\b/);
    if (hardTrue) { defaults.set(hardTrue[1], true); continue; }
    const hardFalse = line.match(/^\s*(\w+)\s*:\s*false\b/);
    if (hardFalse) { defaults.set(hardFalse[1], false); continue; }
    const onByDefault = line.match(/^\s*(\w+)\s*:.*!==\s*'0'/);
    if (onByDefault) { defaults.set(onByDefault[1], true); continue; }
    const offByDefault = line.match(/^\s*(\w+)\s*:.*===\s*'1'/);
    if (offByDefault) { defaults.set(offByDefault[1], false); continue; }
  }
  return defaults;
}

function parseFrontendDefaults(src) {
  const defaults = new Map();
  const block = src.match(/export const FEATURE_FLAGS\s*=\s*\{([\s\S]*?)\};/);
  if (!block) return defaults;
  for (const line of block[1].split('\n')) {
    const hardTrue = line.match(/^\s*(\w+)\s*:\s*true\b/);
    if (hardTrue) { defaults.set(hardTrue[1], true); continue; }
    const hardFalse = line.match(/^\s*(\w+)\s*:\s*false\b/);
    if (hardFalse) { defaults.set(hardFalse[1], false); continue; }
    const flagCall = line.match(/^\s*(\w+)\s*:\s*flagEnabled\([^,)]+,\s*true\)/);
    if (flagCall) { defaults.set(flagCall[1], true); continue; }
    const flagCallOff = line.match(/^\s*(\w+)\s*:\s*flagEnabled\([^,)]+\)/);
    if (flagCallOff) { defaults.set(flagCallOff[1], false); continue; }
    const constRef = line.match(/^\s*(\w+)\s*:\s*(\w+_ENABLED)\b/);
    if (constRef) {
      const varMatch = src.match(new RegExp(`const ${constRef[2]}\\s*=\\s*flagEnabled\\([^,)]+,\\s*true\\)`));
      defaults.set(constRef[1], !!varMatch);
      continue;
    }
  }
  return defaults;
}

const backendFlags = parseBackendDefaults(backendSrc);
const frontendFlags = parseFrontendDefaults(frontendSrc);

const FRONTEND_ONLY = new Set([
  'assessments', 'modelTrainer', 'workingMathInserts',
  'worksheetsComingSoon', 'parentComingSoon',
  'payments', 'tutorMarketplace', 'certification', 'fractionsStoryMode',
]);

const INTENTIONAL_MISMATCH = new Set([
  'fluency',
]);

describe('feature flag consistency (backend ↔ frontend)', () => {
  it('parses backend flags', () => {
    expect(backendFlags.size).toBeGreaterThanOrEqual(10);
  });

  it('parses frontend flags', () => {
    expect(frontendFlags.size).toBeGreaterThanOrEqual(10);
  });

  it('every backend flag exists in frontend (or is documented as backend-only)', () => {
    const missing = [];
    for (const key of backendFlags.keys()) {
      if (!frontendFlags.has(key) && !INTENTIONAL_MISMATCH.has(key)) {
        missing.push(key);
      }
    }
    expect(missing, `backend flags missing from frontend: ${missing.join(', ')}`).toEqual([]);
  });

  it('every frontend flag exists in backend (or is documented as frontend-only)', () => {
    const missing = [];
    for (const key of frontendFlags.keys()) {
      if (!backendFlags.has(key) && !FRONTEND_ONLY.has(key) && !INTENTIONAL_MISMATCH.has(key)) {
        missing.push(key);
      }
    }
    expect(missing, `frontend flags missing from backend: ${missing.join(', ')}`).toEqual([]);
  });

  it('shared flags have matching defaults', () => {
    const mismatches = [];
    for (const [key, backendDefault] of backendFlags) {
      if (FRONTEND_ONLY.has(key) || INTENTIONAL_MISMATCH.has(key)) continue;
      if (!frontendFlags.has(key)) continue;
      const frontendDefault = frontendFlags.get(key);
      if (backendDefault !== frontendDefault) {
        mismatches.push(`${key}: backend=${backendDefault}, frontend=${frontendDefault}`);
      }
    }
    expect(mismatches, `flag default mismatches:\n  ${mismatches.join('\n  ')}`).toEqual([]);
  });
});
