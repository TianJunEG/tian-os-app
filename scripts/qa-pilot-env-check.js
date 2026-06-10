// Pilot environment doctor — run BEFORE the live preflight / browser gate.
//
// The live gates (qa-pilot-preflight, Playwright pilot gate, coverage report)
// fail in confusing ways when the environment isn't ready: an unseeded or
// unreachable database yields 0/100 reports and auth failures, a missing build
// breaks the browser gate, and an old Node version breaks the backend. This
// checks those prerequisites up front and prints the exact next commands.
//
// Usage: node scripts/qa-pilot-env-check.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED_NODE = '22.3.0';

// Returns true when `current` >= `required` (numeric major.minor.patch compare).
export function satisfiesNodeVersion(current, required) {
  const norm = (v) => String(v).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const [a, b] = [norm(current), norm(required)];
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return true;
}

const results = [];
const record = (name, ok, detail) => results.push({ name, ok, detail });

async function main() {
  // 1. Node version (backend requires >=22.3.0).
  record('Node version', satisfiesNodeVersion(process.versions.node, REQUIRED_NODE),
    `need >=${REQUIRED_NODE}, have ${process.versions.node}`);

  // 2. Database URI configured.
  const uri = process.env.MONGODB_URI;
  record('MONGODB_URI configured', Boolean(uri), uri ? 'present' : 'missing — set MONGODB_URI in .env');

  // 3. Frontend production build present (the browser gate serves it).
  const distIndex = path.join(ROOT, 'frontend', 'dist', 'index.html');
  record('Frontend build present', fs.existsSync(distIndex),
    fs.existsSync(distIndex) ? 'frontend/dist/index.html' : 'run: npm --prefix frontend run build');

  // 4. Database reachable AND seeded with fraction content (the unseeded-DB
  //    footgun: gates run but every coverage/score reads as empty).
  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      record('Database reachable', true, 'connected');
      const families = await mongoose.connection.db
        .collection('mathpath_question_families')
        .countDocuments({ domainId: 'fractions' });
      record('Seeded fraction content', families > 0,
        families > 0 ? `${families} fraction question families` : 'no seeded content — run the DB seed before the gates');
    } catch (err) {
      record('Database reachable', false, `${err.message} — is MongoDB running at MONGODB_URI?`);
    } finally {
      await mongoose.disconnect().catch(() => {});
    }
  }

  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} ${r.name}: ${r.detail}`);
  }
  console.log('');
  if (failed.length) {
    console.log(`Environment not ready: ${failed.length} check(s) failed. Fix the above, then re-run.`);
    process.exit(1);
  }
  console.log('Environment ready. Next, with the backend + frontend running:');
  console.log('  QA_BASE=<api>/api PLAYWRIGHT_BASE_URL=<web> node scripts/qa-pilot-preflight.js');
  console.log('  node scripts/updateFractionsCoverageReport.js');
  console.log('  npm --prefix frontend run test:pilot-gate');
}

// Only run when invoked directly (so tests can import satisfiesNodeVersion).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Environment check failed to run:', err?.message || err);
    process.exit(1);
  });
}
