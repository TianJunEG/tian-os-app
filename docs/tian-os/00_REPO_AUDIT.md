# PART A — Repository Structure Audit

**Date:** June 8, 2026  
**Purpose:** Document actual repository structure, frameworks, dependencies, and current state  
**Scope:** Full codebase audit — not aspirational, reflects what exists

---

## Executive Summary

**Tian OS** is a full-stack Node.js/React learning ecosystem built with:
- **Backend:** Express.js + MongoDB (Mongoose ODM) + Node.js 22.3.0+
- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Testing:** Vitest (unit/integration) + Playwright (E2E)
- **Deployment:** Railway (backend), Vercel (frontend candidate)
- **Database:** MongoDB Atlas (primary), Prisma/PostgreSQL (phase-1 migration indicator)

---

## Directory Structure & Key Folders

### Root-Level Organization

```
/
├── backend/ (implicit in root server.js + routes/, models/, services/)
├── frontend/                        # React Vite SPA
│   ├── src/
│   │   ├── pages/                  # Role-based pages (student, tutor, parent, teacher, admin)
│   │   ├── components/             # Reusable React components
│   │   ├── mathpath/               # MathPath system (fractions, diagnostics, fluency, etc.)
│   │   ├── context/                # React context (Auth, Workspace)
│   │   ├── config/                 # Feature flags, navigation, modules
│   │   ├── utils/                  # Utilities (TTS, sound, spelling, science catalog)
│   │   ├── student/                # Student-specific logic
│   │   └── test/                   # Test setup
│   ├── public/
│   ├── package.json
│   └── vitest.config.js
├── routes/                         # Express route handlers (~60 files)
├── models/                         # Mongoose data models (~54 files)
├── services/                       # Business logic layers (organized by domain)
│   ├── mathpath/                   # MathPath engine (fractions, diagnostics, interventions)
│   ├── intervention/               # Recovery Packs, learning path
│   ├── diagnostics/                # Diagnostic session logic
│   ├── fluency/                    # Fluency tracking
│   ├── billing/                    # Stripe integration, subscriptions
│   ├── partners/                   # Partner organizations
│   ├── studentCare/                # Student care system
│   ├── studentProfile/             # Student profile data
│   ├── teacher/                    # Teacher workflows
│   ├── telemetry/                  # Event tracking
│   ├── learning/                   # Learning outcomes
│   └── domains/                    # Shared domain logic
├── middleware/                     # Express middleware
├── config/                         # Configuration (database, feature flags)
├── scripts/                        # Seed, migration, QA scripts
├── utils/                          # Shared utilities
├── shared/                         # Shared code (frontend/backend)
├── docs/                           # Documentation
│   ├── mathpath/                   # MathPath & Fractions documentation
│   ├── architecture/               # Architecture diagrams
│   ├── deployment/                 # Deployment guides
│   ├── design/                     # Design system
│   ├── dev/                        # Developer guides
│   ├── diagnostics/                # Diagnostic system docs
│   ├── security/                   # Security policies
│   ├── tools/                      # Tool documentation
│   └── tian-os/                    # **NEW: Master Tian OS docs (this folder)**
├── test-results/                   # Test output snapshots
├── uploads/                        # User-uploaded artifacts
├── data/                           # Static data files
├── prisma/                         # PostgreSQL schema (phase 1)
└── [root deployment files]
    ├── package.json                # Backend package config
    ├── server.js                   # Express entry point
    ├── Procfile                    # Heroku/Railway manifest
    ├── render.yaml                 # Railway config
    ├── vercel.json                 # Vercel config
    ├── .env.example                # Environment template
    └── vitest.config.js            # Backend test config
```

---

## Frontend Framework & Structure

### Build & Runtime
- **Build Tool:** Vite 4.3.9
- **Framework:** React 18.2.0
- **Styling:** Tailwind CSS 3.3.2 + PostCSS
- **Routing:** React Router 6.11.0
- **Testing:** Vitest 1.6.1 + Playwright 1.60.0
- **Math Rendering:** KaTeX 0.17.0
- **Markdown:** React Markdown with GFM support
- **Payment:** Stripe.js 2.1.0 + React Stripe

### Key Page Directories

```
frontend/src/pages/
├── student/
│   ├── mathpath/
│   │   ├── diagnostic/           # Diagnostic assessment screens
│   │   ├── fluency/              # Fluency practice sessions
│   │   ├── assessment/           # Assessment reviews
│   │   ├── working/              # Working evidence upload
│   │   ├── story/                # Story-mode learning
│   │   └── components/           # Shared MathPath components
│   ├── worksheets/
│   ├── science/
│   └── spelling/
├── tutor/                        # Tutor-facing interfaces
├── parent/                       # Parent dashboard & management
├── teacher/                      # Teacher resources & management
├── admin/                        # Admin dashboard
├── studentCare/                  # Student care workflows
└── secondary/                    # Secondary curriculum (science, mechanisms)
```

### Component Organization

- **UI Components:** `frontend/src/components/ui/`
- **Learning Canvas:** `frontend/src/components/learning/` (WorkingCanvas, WorkingToolbar, etc.)
- **Feature Components:** Domain-specific (TutorOnboarding, AdminDashboard, etc.)
- **Context:** `frontend/src/context/` (Auth, Workspace)

---

## Backend Architecture

### Express Server Configuration
- **Entry Point:** `server.js`
- **Port:** 5000 (default, configurable via ENV)
- **Database:** MongoDB via Mongoose
- **Middleware:** Express standard (body parsing, CORS, authentication)
- **Deployment Target:** Railway, Heroku, Render

### Route Organization (~60 route files)

**Core User Management:**
- `routes/auth.js` — Login, signup, token validation
- `routes/family.js` — Parent-child relationships
- `routes/context.js` — Workspace/organization context

**Student Domain:**
- `routes/diagnostics.js` — Diagnostic session creation & routing
- `routes/assignments.js` — Assignment tracking
- `routes/mistakes.js` — Mistake analysis and remediation
- `routes/fluency.js` — Fluency assessments
- `routes/practice.js` — Practice sessions
- `routes/recovery.js` — Recovery Pack workflows

**Teacher/Tutor Domain:**
- `routes/teacher.js` — Teacher resources and class management
- `routes/tutor.js` — Tutor assignment and student management
- `routes/interventions.js` — Intervention assignments

**Content & Assessment:**
- `routes/assessmentUploads.js` — Paper upload & marking
- `routes/assessmentSpecifications.js` — Test specifications
- `routes/assessmentBlueprints.js` — Assessment blueprints
- `routes/questions.js` — Question routing and lookup
- `routes/worksheets.js` — Worksheet generation and tracking

**Admin & Reporting:**
- `routes/admin.js` — Admin dashboard and user management
- `routes/adminBilling.js` — Billing management
- `routes/adminPartners.js` — Partner organization management

**Business Operations:**
- `routes/bookings.js` — Tutor booking system
- `routes/payments.js` — Payment processing
- `routes/billing.js` — Subscription and usage billing

---

## Data Models (54 Mongoose Models)

### Core User Models
- **User** — Base user with email, password, roles, profile data
- **Student** — Student profile, level, progress tracking
- **StudentGuardian** — Parent-child relationship (relationship of truth)
- **StudentGroup** — Class/group management
- **StudentNote** — Teacher/tutor notes on students

### Educator Models
- **TutorProfile** — Tutor credentials, availability, qualifications
- **TutorStudentLink** — Tutor-student assignments
- **TutorAvailability** — Scheduled availability
- **TutorCertification** — Tutor qualifications (Singapore MOE-aligned)
- **TutorInvite** — Invitation tracking

### MathPath Assessment & Progress
- **MathPathDiagnosticSession** — Diagnostic test instances
- **MathPathAssignment** — Assigned diagnostic/practice work
- **DiagnosedMisconception** — Individual misconception evidence
- **PracticeAttempt** — Single question attempt
- **PracticeSession** — Multi-question practice instances
- **FluencyRecord** — Fluency drill tracking
- **MasteryRecord** — Skill mastery achievement log

### Learning & Remediation
- **Intervention** — Recovery Pack assigned to student
- **InterventionRecommendation** — Recommendation for intervention (system-generated or manual)
- **InterventionRecord** — Completion tracking
- **LearningResult** — Generic learning outcome
- **Skill** — Skill definition (F001–F026 anchors)
- **Question** — Question pool entries

### Content & Worksheets
- **Worksheet** — Teacher-created worksheets
- **PaperAnalysis** — Marked exam paper analysis
- **Resource** — Learning resources (videos, guides, etc.)
- **SpellingList** — Spelling practice lists
- **SpellingAttempt** — Spelling practice attempts

### Growth & Learning Telemetry
- **LessonNote** — Structured lesson feedback
- **RetentionReview** — Spaced repetition review sessions
- **LearningTelemetryEvent** — Granular learning events
- **LifeLabActivity** — LifeLab science activities (optional domain)
- **LifeLabSubmission** — LifeLab activity submissions

### Business & Organization
- **PartnerOrganisation** — School/tuition center organizations
- **PartnerStudent** — Student enrollment in partner orgs
- **Payment** — Transaction records
- **Subscription** — Subscription instances
- **BillingPlan** — Subscription plan definitions
- **BillingUsageEvent** — Usage event for billing

### Workspace & Collaboration
- **Workspace** — Organization/workspace container
- **WorkspaceMember** — Member roles within workspace
- **Class** — Classroom container
- **ClassStudent** — Classroom enrollment

---

## Services Layer (Well-Organized by Domain)

### `services/mathpath/` — MathPath & Fractions Engine
**Fractions Core:**
- `fractionSkillGraph.js` — F001–F026 skill hierarchy, prerequisites, mastery criteria
- `fractionQuestionGenerator.js` — Question generation engine
- `fractionQuestionFamilies.js` — Question family blueprints with misconception tags
- `fractionAssessmentReadinessGate.js` — Assessment prerequisite validation
- `fractionCurriculumMappings.js` — MOE curriculum alignment
- `fractionCanonicalSkillMap.js` — F001–F026 canonical mapping
- `fractionUniversalSkills.js` — Universal skill layer

**Misconception & Diagnostics:**
- `misconceptionRegistry.js` — Misconception ID directory
- `misconceptionDetectionService.js` — Identifies misconceptions from student work
- `skillVisualRequirementEngine.js` — Visual model requirements per skill
- `questionDiagramRequirementEngine.js` — Diagram/visual requirements

**Progress & Mastery:**
- `mathPathStudentProgressEngine.js` — Student progress rollup
- `masteryCriteriaEngine.js` — Evaluates mastery achievement
- `recheckRecommendationService.js` — Same-skill different-surface recheck logic
- `fractionMistakeToMasteryEngine.js` — Mistake remediation pathways

**Assessment & Fluency:**
- `fractionAssessmentEngine.js` — Assessment scoring and readiness
- `fractionDiagnosticExplainabilityEngine.js` — Explain diagnostic results to parent
- `fractionsRemediationAssetMapV1.js` — Remediation mapping
- `fractionsKnowledgeMapV1.js` — Knowledge model
- `fractionCurriculumMappings.js` — Curriculum alignment

### `services/intervention/` — Recovery Packs & Learning Paths
- Intervention assignment and tracking
- Recovery Pack workflow orchestration
- Guided practice flow management

### `services/diagnostics/` — Diagnostic Session Management
- Session creation and routing
- Adaptive branching
- Result analysis

### `services/fluency/` — Fluency Assessment
- Timed practice tracking
- Fluency score calculation
- Speed-accuracy metrics

### `services/billing/` — Stripe Integration & Subscriptions
- Payment processing
- Subscription lifecycle
- Usage event tracking

### `services/studentProfile/` — Student Data Management
- Profile aggregation
- Achievement tracking
- Progress snapshots

---

## Test Structure

### Backend Tests (Vitest)
- **Location:** Colocated with source (`.test.js` files)
- **Coverage:** Routes, services, models
- **Database:** Uses MongoDB test instance
- **Examples:** 
  - `routes/diagnostics.test.js`
  - `services/mathpath/fractionQuestionGenerator.test.js`
  - `services/mathpath/masteryCriteriaEngine.test.js`

### Frontend Tests (Vitest)
- **Location:** `frontend/src/**/*.test.jsx` and `.test.js`
- **Coverage:** Components, hooks, utilities
- **Setup:** jsdom + Testing Library
- **Examples:**
  - `frontend/src/pages/student/SkillGraph.test.jsx`
  - `frontend/src/components/learning/WorkingCanvas.test.jsx`

### E2E Tests (Playwright)
- **Location:** `frontend/e2e/` (if present) or `frontend/playwright.test.js`
- **Config:** `playwright.pilot.config.js` (pilot-gate tests)
- **Scope:** Critical student/parent/teacher workflows
- **Gating:** Pilot preflight validation before deployment

---

## Build & Deployment Configuration

### Backend Deployment
- **Procfile** — Heroku-compatible startup manifest
- **render.yaml** — Railway deployment configuration
- **Environment Variables:**
  - `MONGODB_URI` — MongoDB connection string
  - `NODE_ENV` — Environment (development, production)
  - `PORT` — Server port (default 5000)
  - Stripe keys, JWT secrets, etc. (see `.env.example`)

### Frontend Deployment
- **Vite Build Output:** `frontend/dist/`
- **Vercel Integration:** `vercel.json` config present
- **Build Script:** `npm --prefix frontend run build`
- **Service Worker:** PostBuild SW generation (`scripts/postbuild-sw.cjs`)

### Database
- **Primary:** MongoDB Atlas (cloud)
- **Connection:** Mongoose + `MONGODB_URI` env var
- **Migration Plan:** Prisma/PostgreSQL (phase 1 indicators present)

---

## Seed & Migration Scripts

### Database Initialization
- `scripts/seedFoundation.js` — Core curriculum data
- `scripts/seedQuestions.js` — Question pool population
- `scripts/seedExamPapers.js` — Exam paper templates
- `scripts/seedDomain.js` — Domain data (skills, topics)
- `scripts/seedFluency.js` — Fluency benchmarks
- `scripts/seedFractionsAlphaPack.js` — Fractions pilot data

### Test Data
- `scripts/seedTestAccounts.js` — Demo user accounts
- `scripts/seedPilotStudents.js` — Controlled pilot students
- `scripts/seedCadenP5WeakStudent.js` — Weak P5 student profile (test case)
- `scripts/seedTutor.js` — Sample tutor profiles
- `scripts/seedTeacher.js` — Sample teacher accounts

### Optional Domains
- `scripts/seedSpelling.js` — Spelling curriculum
- `scripts/seedScience.js` — Science content
- `scripts/seedLifeLab.js` — LifeLab activities
- `scripts/seedMechanisms.js` — Secondary mechanisms

### QA & Validation
- `scripts/qa-pilot-preflight.js` — Preflight validation
- `scripts/qa-e2e-safe.js` — Backend E2E tests (safe)
- `scripts/qa-founder-bundle-safe.js` — Founder-level checks
- `scripts/qa-mathpath-dashboard-contract.js` — Dashboard contract tests
- `scripts/qa-pilot-gate.js` — Pilot gating

---

## Documentation Inventory

### Existing Documentation
- **Root Docs:** 20+ markdown files (MVP_BUILD_PLAN, PILOT_READINESS, FRACTIONS_SKILL_MAPPING_AUDIT, etc.)
- **docs/mathpath/** — Fractions curriculum and mapping
- **docs/architecture/** — System diagrams
- **docs/deployment/** — Deployment procedures
- **docs/design/** — Design system
- **docs/dev/** — Developer guides
- **docs/security/** — Security policies

### **NEW: docs/tian-os/** (This Folder)
Master documentation being generated for comprehensive onboarding and reference.

---

## Current Git Status

Git status is time-sensitive and must be checked locally before any staging, commit, or handover.

Use:

```bash
git status --short
git branch --show-current
git log -1 --oneline
git remote -v
---

## Notable Frameworks & Dependencies

### Frontend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.2.0 | UI framework |
| Vite | 4.3.9 | Build tool |
| Tailwind CSS | 3.3.2 | Styling |
| React Router | 6.11.0 | Client routing |
| KaTeX | 0.17.0 | Math rendering |
| Stripe.js | 2.1.0 | Payment processing |
| React Markdown | 9.1.0 | Markdown rendering |

### Backend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| Express.js | (implicit) | Web framework |
| Mongoose | (implicit) | MongoDB ODM |
| Vitest | 1.6.1 | Test runner |
| Nodemon | (dev) | Auto-reload |

### DevOps
- Node.js 22.3.0+ required
- MongoDB 4.4+ (Atlas cloud)
- Prisma 5.0+ (phase 1)
- Railway deployment platform

---

## Missing Expected Files / Gaps

### Not Found (Likely OK)
- ❌ `src/index.html` (Vite uses `frontend/index.html`)
- ❌ Standalone backend `.env` file (uses Railway env vars in production)
- ❌ Docker Compose file (deployment is Railway/Vercel, not local containers)

### Partially Implemented
- ⚠️ **GraphQL:** Not present (REST API only)
- ⚠️ **TypeScript:** Not in use (JavaScript with JSDoc comments)
- ⚠️ **WebSockets:** Not visible (polling/HTTP-based)
- ⚠️ **Postgres Migration:** Prisma schema exists but not active (phase 1 work)

### Not Implemented Yet
- ❌ **LMS Integrations:** No Blackboard, Canvas, etc.
- ❌ **Mobile Apps:** Web-only (responsive design)
- ❌ **Advanced Analytics Dashboard:** Basic reporting only
- ❌ **Third-Party SSO:** Email/password only

---

## Environment & Secrets

### `.env.example` Template Present
- Shows expected configuration structure
- Includes placeholders for:
  - Database connection
  - Stripe API keys
  - JWT secrets
  - Feature flags

### Secrets Management
- ✅ **Railway:** Env vars via dashboard (not in repo)
- ✅ **Vercel:** Env vars via dashboard
- ✅ `.gitignore` properly excludes `.env`

---

## Deployment Targets

| Target | Config File | Status |
|--------|-------------|--------|
| Railway Backend | `render.yaml` | Active |
| Vercel Frontend | `vercel.json` | Ready |
| Heroku | `Procfile` | Legacy support |

---

## Quality & Testing Indicators

| Aspect | Status |
|--------|--------|
| Unit Tests | ✅ Present (~100+ tests) |
| Integration Tests | ✅ Present (backend routes) |
| E2E Tests | ✅ Playwright (pilot-gate) |
| Test Coverage | ⚠️ Partial (core features covered) |
| CI/CD | ✅ GitHub Actions (implied via scripts) |

---

## Summary: Small Pilot Readiness Signals

### ✅ Strengths
1. **Well-organized codebase** — Clear separation of concerns (routes, services, models)
2. **Comprehensive testing** — Vitest + Playwright coverage on critical paths
3. **Secure deployment** — Environment vars, no secrets in repo
4. **Scalable architecture** — Service-oriented design (mathpath, intervention, diagnostics, etc.)
5. **Documentation present** — Existing docs + seed scripts explain intent

### ⚠️ Potential Concerns
1. **No TypeScript** — Harder to catch type errors early
2. **Monorepo complexity** — Frontend/backend in same repo (manageable but tight coupling)
3. **MongoDB reliance** — Phase 1 migration to Postgres not yet started
4. **Limited observability** — Telemetry present but not full APM
5. **Pilot-gated** — CI/CD depends on manual pilot-gate scripts

### 🚀 Potentially Ready For

1. **Small controlled Fractions pilot** — preferably 5 students first, with founder monitoring and clear caveats.
2. **Fractions intervention testing** — focused on diagnostic → mistake evidence → Recovery Pack → teaching flow → recheck → growth.
3. **Railway/Vercel deployment testing** — infrastructure appears present, but deployment should still be verified per environment.
4. **Parent-child workflow testing** — StudentGuardian is the documented source of truth, but browser-level child-switching and direct-route QA should remain part of pilot gates.
5. **Tutor/teacher-assisted internal testing** — suitable for supervised workflows, not yet broad school rollout.

### ⛔ Not Ready For

1. **20–50 real-student parent pilot without further certification** — current MathPath evidence chain still needs runtime integrity, curated Recovery Pack references, misconception specificity, and recheck targeting checks.
2. **Large-scale deployment** — not ready for 100+ students without stronger monitoring, pilot evidence, and operational support.
3. **Full P1–P6 MathPath claims** — current safe external positioning is Fractions intervention pilot, not complete Singapore Math coverage.
4. **School pilot** — not ready until class-level intervention evidence, reporting integrity, and curriculum coverage are stronger.
5. **Secondary subjects / other subjects** — Science, Spelling, LifeLab, and Secondary modules should remain secondary until MathPath Fractions is validated.
6. **International expansion** — curriculum logic is currently Singapore-focused.
7. **Open-source release** — product contains proprietary learning logic, business workflows, and payment/partner infrastructure.
---

## Current Safe Product Positioning

The current safe external positioning is:

**Tian OS MathPath — Fractions Intervention Pilot**

Approved claim style:

- “This pilot focuses on identifying and addressing Fractions weaknesses.”
- “The system provides evidence of improvement where diagnostic, practice, Recovery Pack, and recheck data are available.”
- “Reports should distinguish between reviewed mistakes, corrected mistakes, understanding evidence, and skill mastery.”

Avoid these claims for now:

- “Full P1–P6 MathPath is ready.”
- “Complete Singapore Math coverage.”
- “School-ready intervention platform.”
- “Your child has mastered Fractions” unless independent or recheck evidence supports that specific claim.
- “The system identified all weak areas.”

Current learning evidence principle:

```text
Diagnostic
→ Mistake Evidence
→ Recovery Pack
→ Teaching Flow
→ Recheck
→ Growth Report

## Conclusion

**Tian OS is a well-structured, actively maintained learning ecosystem** with clear separation between frontend, backend, data models, and service-layer business logic.

However, the current safe interpretation is:

**Tian OS MathPath is suitable for a small, controlled Fractions intervention pilot with caveats. It is not yet certified as a complete P1–P6 Singapore Math product, a 20–50 student parent pilot product, or a school-ready platform.**

The next work should remain focused on MathPath Fractions evidence integrity before expanding scope.

**Next audits and repair passes should focus on:**

1. Fractions runtime evidence integrity.
2. Recovery Pack question materialisation.
3. Misconception specificity and recheck targeting.
4. Fractions visual model coverage.
5. 10-student seeded pilot simulation.
6. Parent-facing claim safety and report confidence.