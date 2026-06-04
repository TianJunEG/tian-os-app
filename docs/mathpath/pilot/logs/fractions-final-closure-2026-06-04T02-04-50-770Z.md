# Fractions Final Pilot Closure Checklist

Run at: 2026-06-04T02:05:03.231Z

| Gate | Check | Critical | Status | Exit |
|---:|---|---|---|---:|
| 1 | Fractions depth regression tests | Yes | PASS | 0 |
| 2 | Regenerate Fractions coverage report | No | PASS | 0 |
| 3 | Seeded DB coverage proof (alpha pack seed) | Yes | FAIL | 1 |
| 4 | Pilot API preflight (backend/CORS/seed accounts) | Yes | FAIL | 1 |

Final decision: **NO-GO**

## Failure evidence

### Gate 3: Seeded DB coverage proof (alpha pack seed)
```txt
⚠️ Remote Mongo unavailable (_mongodb._tcp.tutor-match.u5yqp2q.mongodb.net). Falling back to local Mongo: mongodb://127.0.0.1:27017/tutor-match
❌ Fractions alpha content pack failed
MongooseServerSelectionError: connect EPERM 127.0.0.1:27017 - Local (0.0.0.0:0)
    at _handleConnectionErrors (/Users/mco/Documents/edu-os-app/node_modules/mongoose/lib/connection.js:816:11)
    at NativeConnection.openUri (/Users/mco/Documents/edu-os-app/node_modules/mongoose/lib/connection.js:791:11)
    at async main (file:///Users/mco/Documents/edu-os-app/scripts/seedFractionsAlphaPack.js:388:5) {
  reason: TopologyDescription {
    type: 'Unknown',
    servers: Map(1) { '127.0.0.1:27017' => [ServerDescription] },
    stale: false,
    compatible: true,
    heartbeatFrequencyMS: 10000,
    localThresholdMS: 15,
    setName: null,
    maxElectionId: null,
    maxSetVersion: null,
    commonWireVersion: 0,
    logicalSessionTimeoutMinutes: null
  },
  code: undefined
}
```

### Gate 4: Pilot API preflight (backend/CORS/seed accounts)
```txt
    {
      "area": "seed-accounts",
      "check": "login pi***@tianos.test",
      "pass": false,
      "detail": "fetch failed"
    },
    {
      "area": "seed-accounts",
      "check": "login pi***@tianos.test",
      "pass": false,
      "detail": "fetch failed"
    },
    {
      "area": "seed-accounts",
      "check": "login pi***@tianos.test",
      "pass": false,
      "detail": "fetch failed"
    },
    {
      "area": "seed-accounts",
      "check": "login pi***@tianos.test",
      "pass": false,
      "detail": "fetch failed"
    },
    {
      "area": "seed-accounts",
      "check": "login pi***@tianos.test",
      "pass": false,
      "detail": "fetch failed"
    },
    {
      "area": "seed-accounts",
      "check": "login pi***@tianos.test",
      "pass": false,
      "detail": "fetch failed"
    }
  ],
  "passCount": 2,
  "failCount": 14
}
```
