import fs from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';

let API_BASE = process.env.QA_BASE || 'http://localhost:5001/api';
const WEB_BASE = process.env.PLAYWRIGHT_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
const ROOT = process.cwd();
const AUTO_SEED_PILOT_ACCOUNTS = process.env.AUTO_SEED_PILOT_ACCOUNTS === '1';

const DEMO_ACCOUNTS = [
  'demo.student@tianos.test',
  'demo.parent@tianos.test',
  'demo.tutor@tianos.test',
  'demo.teacher@tianos.test',
];

const PILOT_ACCOUNTS = [
  'pilot.student1@tianos.test',
  'pilot.student2@tianos.test',
  'pilot.student3@tianos.test',
  'pilot.student4@tianos.test',
  'pilot.student5@tianos.test',
  'pilot.parent@tianos.test',
  'pilot.tutor@tianos.test',
  'pilot.teacher@tianos.test',
];

function maskEmail(email) {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}***@${domain}`;
}

async function readEnvFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

function parseEnv(raw) {
  const lines = raw.split('\n');
  const out = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    out[key] = val;
  }
  return out;
}

function resolveApiBase(frontendEnv, rootEnv) {
  const configured = [
    process.env.QA_BASE,
    process.env.API_BASE,
    process.env.BACKEND_API_URL,
    process.env.API_URL,
    frontendEnv.VITE_API_URL,
    process.env.VITE_API_URL,
  ].find(Boolean);
  if (configured) return configured.replace(/\/$/, '');

  const port = process.env.PORT || rootEnv.PORT || 5001;
  return `http://localhost:${port}/api`;
}

async function apiCall(method, route, body) {
  const res = await fetch(`${API_BASE}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, data };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginWithRetry(email, password, retries = 4) {
  for (let i = 0; i < retries; i += 1) {
    const login = await apiCall('POST', '/auth/login', { email, password });
    if (login.status !== 429) return login;
    await sleep(1000 + i * 750);
  }
  return apiCall('POST', '/auth/login', { email, password });
}

function seedPilotAccounts() {
  if (!AUTO_SEED_PILOT_ACCOUNTS) {
    return {
      pass: true,
      detail: 'set AUTO_SEED_PILOT_ACCOUNTS=1 to auto-seed pilot accounts before checks',
    };
  }

  const result = spawnSync('node', ['scripts/seedPilotStudents.js'], {
    cwd: ROOT,
    env: { ...process.env, MONGODB_URI: process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status === 0) {
    return { pass: true, detail: 'pilot accounts seeded' };
  }
  return {
    pass: false,
    detail: `seed pilot accounts failed: status=${result.status} ${String(result.stderr || result.stdout || '').trim()}`,
  };
}

async function run() {
  const checks = [];
  const push = (area, check, pass, detail = '') => checks.push({ area, check, pass, detail });

  // Frontend API URL configuration check
  const frontendEnv = parseEnv(
    (await readEnvFile(path.join(ROOT, 'frontend/.env'))) ||
      (await readEnvFile(path.join(ROOT, 'frontend/.env.local'))) ||
      (await readEnvFile(path.join(ROOT, 'frontend/.env.example')))
  );
  const apiUrl = frontendEnv.VITE_API_URL || '';
  push('environment', 'frontend VITE_API_URL configured', Boolean(apiUrl), apiUrl || 'missing');

  // MongoDB configuration check
  const rootEnv = parseEnv(
    (await readEnvFile(path.join(ROOT, '.env'))) || (await readEnvFile(path.join(ROOT, '.env.example')))
  );

  const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || rootEnv.MONGODB_URI || rootEnv.MONGODB_URI_LOCAL || '';
  const apiBase = resolveApiBase(frontendEnv, rootEnv);
  API_BASE = apiBase;
  push('environment', 'QA_BASE configured', Boolean(apiBase), apiBase);

  push('environment', 'MONGODB_URI configured', Boolean(mongoUri), mongoUri ? 'present' : 'missing');
  const seedSetup = seedPilotAccounts();
  push('seed-setup', 'seed pilot accounts', seedSetup.pass, seedSetup.detail);

  // Backend reachable check
  let reachable = false;
  try {
    const probe = await loginWithRetry('nonexistent@tianos.test', 'invalid');
    reachable = [200, 400, 401].includes(probe.status);
    push('environment', 'backend API reachable', reachable, `status=${probe.status}`);
  } catch (err) {
    push('environment', 'backend API reachable', false, err?.message || 'request failed');
  }

  // CORS preflight check
  try {
    const corsRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: WEB_BASE,
        'Access-Control-Request-Method': 'POST',
      },
    });
    const allowOrigin = corsRes.headers.get('access-control-allow-origin') || '';
    const corsPass = corsRes.ok && (allowOrigin === '*' || allowOrigin.includes(new URL(WEB_BASE).origin));
    push('environment', 'CORS allows frontend origin', corsPass, `allow-origin=${allowOrigin || 'none'}`);
  } catch (err) {
    push('environment', 'CORS allows frontend origin', false, err?.message || 'preflight failed');
  }

  // Seed account smoke
  let pilotAccountSmokeFailed = false;
  for (const email of [...DEMO_ACCOUNTS, ...PILOT_ACCOUNTS]) {
    try {
      const login = await loginWithRetry(email, 'Passw0rd!');
      const ok = login.status === 200 && Boolean(login.data?.token);
      if (email.startsWith('pilot.') && !ok) pilotAccountSmokeFailed = true;
      push('seed-accounts', `login ${maskEmail(email)}`, ok, `status=${login.status}`);
    } catch (err) {
      if (email.startsWith('pilot.')) pilotAccountSmokeFailed = true;
      push('seed-accounts', `login ${maskEmail(email)}`, false, err?.message || 'login failed');
    }
  }

  if (pilotAccountSmokeFailed && AUTO_SEED_PILOT_ACCOUNTS) {
    const rerun = seedPilotAccounts();
    push('seed-accounts', 'reseed pilot accounts and recheck smoke', rerun.pass, rerun.detail);
  }
  
  const failCount = checks.filter((c) => !c.pass).length;
  const passCount = checks.length - failCount;
  // Only fail the gate on pilot account login failures — environment/setup
  // check failures are surfaced as warnings but don't block the gate.
  const criticalFails = checks.filter((c) => !c.pass && c.area === 'seed-accounts' && c.check.startsWith('login pi'));
  console.log(JSON.stringify({ checks, passCount, failCount }, null, 2));
  process.exit(criticalFails.length > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('qa-pilot-preflight failed:', err?.message || err);
  process.exit(1);
});
