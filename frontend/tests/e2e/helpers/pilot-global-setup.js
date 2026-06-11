const backendPort = process.env.BACKEND_PORT || '5001';
const apiBase = process.env.PLAYWRIGHT_API_BASE_URL || `http://localhost:${backendPort}/api`;

async function globalSetup() {
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${apiBase}/health`);
      if (res.ok) break;
    } catch {
      if (i === maxRetries - 1) throw new Error(`Backend not reachable at ${apiBase} after ${maxRetries} attempts`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo.student@tianos.test', password: 'Passw0rd!' }),
  });

  if (!res.ok) {
    console.log('[pilot-global-setup] Demo accounts not found — running seedDemo...');
    const { execSync } = await import('child_process');
    execSync('node scripts/seedDemo.js', {
      cwd: `${process.cwd()}/..`,
      stdio: 'inherit',
      env: { ...process.env, QA_DISABLE_RATE_LIMIT: '1' },
    });
  } else {
    console.log('[pilot-global-setup] Demo accounts ready.');
  }
}

export default globalSetup;
