# Tian OS Technical Architecture

**Status:** Working documentation
**Last updated:** June 2026

---

## 1. Purpose

This document explains how Tian OS is technically structured. It is written for engineers, technical leads, DevOps, and AI-native developers maintaining or extending the codebase.

For data models see [`06_DATA_MODELS.md`](06_DATA_MODELS.md).
For engineering conventions and safety rules see [`05_ENGINEERING_MANUAL.md`](05_ENGINEERING_MANUAL.md) and [`/CLAUDE.md`](/CLAUDE.md).

---

## 2. Stack

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node.js 22+, ESM | `"type": "module"` throughout |
| Backend framework | Express | Single process, `server.js` entry point |
| Primary database | PostgreSQL (via Prisma 7) | Reference data: skills, topics, curriculum mappings, question families |
| Session/mastery database | MongoDB (via Mongoose) | Mastery records, sessions, attempts, mistakes, student state |
| Frontend | Vite + React 18 + React Router v6 | Served separately on `:5173` in dev |
| Math rendering | KaTeX | Stacked fractions only — never slash notation |
| TTS | Kokoro JS (in-browser) + Web Speech API | Mascot narration; Kokoro loads on demand |
| Tests | Vitest (unit/integration) + Playwright (E2E) | |
| ORM/schema | Prisma 7 (Postgres), Mongoose (MongoDB) | Two separate schema management systems |

---

## 3. Two-database architecture

Tian OS uses two databases intentionally, and both must be running for the application to work.

**PostgreSQL (Prisma)** — reference and curriculum data that rarely changes:
- Skill catalog (`skills` table)
- Topic and subject hierarchies
- Curriculum mappings (MOE Singapore)
- Question family definitions
- Prerequisite graphs

**MongoDB (Mongoose)** — high-write operational and session data:
- Student mastery records (`MasteryRecord`) — one record per student × skill
- Practice sessions, diagnostic sessions, fluency/retention sessions
- Individual question attempts
- Mistake records
- User accounts, workspaces, assignments, billing

The Prisma schema lives in `prisma/schema.prisma`. Mongoose models live in `models/` and `models/mathpath/`. A Prisma migration does not touch MongoDB. Changes to a data structure shared across both must be updated in both places.

---

## 4. Directory structure

```
/
├── server.js                        Express app + route mounting
├── routes/                          95 route files (one per feature area)
├── middleware/
│   ├── auth.js                      JWT verification (protect)
│   ├── workspace.js                 Workspace scoping + role assertion
│   ├── featureGate.js               Feature flag enforcement
│   └── workspace.test.js            Workspace isolation tests
├── models/                          Mongoose models (~55 files)
│   ├── User.js                      Auth identity
│   ├── Student.js                   Learner record (workspace-scoped)
│   ├── Workspace.js                 Data boundary for role isolation
│   ├── MasteryRecord.js             Per-student × skill mastery (0–100 score)
│   ├── Mistake.js                   Wrong-answer records
│   ├── FluencyRecord.js             Fluency scores per skill
│   ├── RetentionReview.js           Spaced-repetition review scheduling
│   ├── Assignment.js                Tasks assigned by parent/tutor/teacher
│   ├── PracticeSession.js           Generic practice session
│   └── mathpath/                    MathPath-specific models (28 files)
│       ├── MathPathSkill.js
│       ├── MathPathStudentSkillState.js
│       ├── MathPathPracticeSession.js
│       ├── MathPathDiagnosticSession.js
│       ├── MathPathAttempt.js
│       ├── MathPathMistakeRecord.js
│       └── ... (22 more)
├── services/
│   ├── mathpath/                    MathPath business logic services
│   ├── diagnostics/                 Diagnostic engine + 17 domain adapters
│   │   ├── diagnosticRuntime.js
│   │   ├── diagnosticDomainRegistry.js
│   │   ├── genericDiagnosticAdapterFactory.js
│   │   └── domains/                 One adapter per domain (17 files)
│   ├── billing/                     Subscription and feature access
│   └── teacher/                     Class dashboard services
├── shared/mathpath/                 Skill graphs, engines, generators
│   ├── domainCatalog.js             Master catalog of 18 domains
│   ├── fractions/                   F001–F026 skill graph + all engines
│   ├── decimals/
│   ├── percentages/
│   ├── ratioRate/
│   ├── operations/
│   ├── numberSense/
│   ├── money/
│   ├── time/
│   ├── measurement/
│   ├── areaPerimeter/
│   ├── volume/
│   ├── geometry/
│   ├── circles/
│   ├── statistics/
│   ├── algebra/
│   └── curriculum/                  Canonical skill maps + curriculum selectors
├── config/
│   └── featureFlags.js              34 feature flags
├── scripts/                         Seed scripts + QA scripts
├── utils/                           Shared utilities (mastery engine, fluency engine, etc.)
├── prisma/
│   └── schema.prisma                PostgreSQL schema (Prisma 7)
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── student/mathpath/    17 domain learning pages
    │   │   ├── parent/              23 parent dashboard pages
    │   │   ├── tutor/               16 tutor dashboard pages
    │   │   ├── teacher/             22 teacher dashboard pages
    │   │   └── admin/               13 admin/QA pages
    │   ├── mathpath/
    │   │   ├── primary/             272 P1–P6 grade-level files
    │   │   ├── dashboard/           Dashboard calculation engines
    │   │   │   ├── parentMathPathDashboardEngine.js
    │   │   │   ├── tutorMathPathDashboardEngine.js
    │   │   │   ├── teacherMathPathDashboardEngine.js
    │   │   │   └── adultIntelligenceEngine.js
    │   │   └── orchestration/
    │   │       └── mathPathDomainOrchestrator.js
    │   ├── components/              Shared UI components
    │   ├── services/api.js          Axios API client
    │   └── config/featureFlags.js   Frontend feature flag mirror
    └── tests/e2e/                   Playwright pilot gate tests
```

---

## 5. Request lifecycle

```
Browser (Vite :5173)
  → React Router → Page component
  → services/api.js (Axios, sets X-Workspace-Id header)
  → Express (:5001)
  → middleware: protect (JWT) → requireWorkspace → featureGate
  → Route handler
  → Service layer (services/ or utils/)
  → MongoDB (Mongoose) and/or PostgreSQL (Prisma)
  → JSON response
  → Page updates state
```

Key middleware chain for any authenticated, workspace-scoped route:

1. `protect` — verifies JWT, attaches `req.user`
2. `requireWorkspace` — reads `X-Workspace-Id`, checks membership, attaches `req.workspace` and `req.workspaceRole`
3. `featureGate` — checks `FLAGS[feature]` from `config/featureFlags.js`
4. Route handler — asserts `req.workspaceRole === 'teacher'` (or tutor, parent, etc.)

---

## 6. MathPath learning loop

The core evidence chain that must never be broken:

```
Student answers question
  → MathPathAttempt saved (attempt per question)
  → MathPathPracticeSession / DiagnosticSession updated
  → On wrong answer: Mistake saved
  → On session complete: MasteryRecord updated (score 0–100)
  → Dashboard engines read MasteryRecord for parent / tutor / teacher views
  → MathPathStudentSkillState updated (fluency + retention status)
  → RetentionReview scheduled (3 / 7 / 30 / 90-day cycle)
```

The `MasteryRecord` is the single source of truth for mastery. Every adult-facing dashboard reads it. Do not update mastery outside of the mastery engine (`utils/masteryEngine.js`, `services/mathpath/masteryCriteriaEngine.js`).

---

## 7. Domain architecture

Each of the 18 MathPath domains follows the same file pattern in `shared/mathpath/{domain}/`:

| File | Purpose |
|---|---|
| `{Domain}SkillGraph.js` | Skill hierarchy with prerequisites and mastery criteria |
| `{Domain}QuestionFamilies.js` | Question family definitions (IDs, difficulty bands, working requirements) |
| `{Domain}QuestionGenerator.js` | Procedural question generation from families |
| `{Domain}PracticeEngine.js` | Next-question selection for practice sessions |
| `{Domain}LearningPathModel.js` | Learning pathway ordering |
| `{Domain}MisconceptionMap.js` | Misconception codes → remediation hints |
| `diagnosticAssetModel.js` | Diagnostic question assets |
| `remediationAssetModel.js` | Recovery pack assets |

Plus for fully built domains (Fractions, Percentage, Ratio):

| File | Purpose |
|---|---|
| `{domain}FluencyEngine.js` | Fluency score calculation |
| `{domain}RetentionEngine.js` | Spaced-repetition scheduling |
| `{domain}PracticeFlow.js` | Session flow control |
| `{domain}MistakeToMasteryEngine.js` | Remediation planning from mistakes |

The domain orchestrator (`frontend/src/mathpath/orchestration/mathPathDomainOrchestrator.js`) coordinates all domains. The diagnostic domain registry (`services/diagnostics/diagnosticDomainRegistry.js`) registers all 17 diagnostic adapters.

---

## 8. P1–P6 grade-level engines

`frontend/src/mathpath/primary/` (272 files) contains grade-scoped versions of the above pattern for P1–P6 Singapore primary math topics. These differ from the shared domain engines:

- Scoped to a single grade and topic (e.g. P3 Fractions, P5 Percentage)
- Each grade has its own orchestrator (`p{N}Orchestrator.js`) and practice flow
- Used for grade-targeted practice and diagnostic sessions
- Separate from the cross-grade shared domain engines in `shared/mathpath/`

---

## 9. Workspace isolation

Data privacy is enforced at the workspace layer, not just at the auth layer.

- A `Workspace` is the data boundary. Type: `parent | tutor | teacher | school | admin`.
- Every student record has a `workspaceId`. A student in a tutor workspace is a different record than the same child in a teacher workspace.
- Tutor routes require `workspaceRole === 'tutor'` AND the student must be linked via `TutorStudentLink`.
- Teacher routes require `workspaceRole === 'teacher'` AND the student must be enrolled in a class in that workspace.
- A dual-role user switches workspace via `X-Workspace-Id`. The switch is the data boundary — teacher and tutor data never mix in a single request.
- Parent data is isolated by `parentUserId` and a guardian isolation check.

---

## 10. Feature flags

`config/featureFlags.js` controls which features are live. The frontend mirror at `frontend/src/config/featureFlags.js` must be kept in sync manually.

- Flags that default **on**: all domain flags (`decimals`, `percentages`, `ratioRate`, etc.), `parent`, `tutor`, `teacher`, `psl`, `spelling`, `lifelab`, `worksheets`.
- Flags that default **off**: `science`, `mechanisms` (require `FEAT_*=1` in env).
- Flags hardcoded `true`: `mathpath`, `fluency`, `mistakes`, `progress`, `admin`.

See `CLAUDE.md` for the full flag table.

---

## 11. Ports and services

| Service | Port | Command |
|---|---|---|
| Express API | 5001 | `npm run dev` |
| Vite frontend | 5173 | `cd frontend && npm run dev` |
| PostgreSQL | 5432 | Must be running before server start |
| MongoDB | 27017 | Must be running before server start |

Production deploys to Railway (single service). See `docs/deployment/` for deployment guides.

---

## 12. Safety-critical systems

Do not modify these without reading the full chain first:

| System | Files | Risk if broken |
|---|---|---|
| Mastery engine | `utils/masteryEngine.js`, `services/mathpath/masteryCriteriaEngine.js` | Wrong thresholds silently stall students |
| Fractions skill graph | `shared/mathpath/fractions/fractionSkillGraph.js` | F-code ID changes break diagnostic → mistake → recovery chain for pilot students |
| Workspace middleware | `middleware/workspace.js` | Data isolation failure = privacy breach |
| Feature gate | `middleware/featureGate.js`, `config/featureFlags.js` | Wrong defaults expose unfinished features |
| Attempt → mastery pipeline | `MathPathAttempt` → `MasteryRecord` update | Corrupts all adult dashboards silently |
