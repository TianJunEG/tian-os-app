# Fractions Final Pilot Closure Checklist

Run at: 2026-05-31T07:26:49.770Z

| Gate | Check | Critical | Status | Exit |
|---:|---|---|---|---:|
| 1 | Fractions depth regression tests | Yes | PASS | 0 |
| 2 | Regenerate Fractions coverage report | No | PASS | 0 |
| 3 | Seeded DB coverage proof (alpha pack seed) | Yes | PASS | 0 |
| 4 | Pilot API preflight (backend/CORS/seed accounts) | Yes | FAIL | 1 |

Final decision: **NO-GO**

## Failure evidence

### Gate 4: Pilot API preflight (backend/CORS/seed accounts)
```txt
    {
      "area": "environment",
      "check": "backend API reachable",
      "pass": true,
      "detail": "status=401"
    },
    {
      "area": "environment",
      "check": "CORS allows frontend origin",
      "pass": true,
      "detail": "allow-origin=http://127.0.0.1:3000"
    },
    {
      "area": "seed-accounts",
      "check": "login de***@tianos.test",
      "pass": true,
      "detail": "status=200"
    },
    {
      "area": "seed-accounts",
      "check": "login de***@tianos.test",
      "pass": false,
      "detail": "fetch failed"
    },
    {
      "area": "seed-accounts",
      "check": "login de***@tianos.test",
      "pass": false,
      "detail": "fetch failed"
    },
    {
      "area": "seed-accounts",
      "check": "login de***@tianos.test",
      "pass": false,
      "detail": "fetch failed"
    }
  ],
  "passCount": 5,
  "failCount": 3
}
```
