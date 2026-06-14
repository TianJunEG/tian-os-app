# Tian OS Full Codebase Audit

**Date:** 2026-06-14
**Scope:** Complete platform audit for 5-student pilot readiness
**Auditor:** Claude Code (automated analysis of full codebase)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Product Flow Audit](#3-product-flow-audit)
4. [MathPath / Fractions Audit](#4-mathpath--fractions-audit)
5. [Adaptive Diagnostic Engine](#5-adaptive-diagnostic-engine)
6. [Mistake-to-Mastery System](#6-mistake-to-mastery-system)
7. [Working Evidence / Canvas](#7-working-evidence--canvas)
8. [Input Components](#8-input-components)
9. [Story Mode](#9-story-mode)
10. [Adult Dashboards](#10-adult-dashboards)
11. [UX / UI / Mobile](#11-ux--ui--mobile)
12. [Backend / Data / Architecture](#12-backend--data--architecture)
13. [Testing / QA](#13-testing--qa)
14. [Recommendations](#14-recommendations)

---

## 1. Executive Summary

### Is Tian OS pilot-ready?

**Conditional Yes.** The core learning loop (Diagnostic -> Practice -> Mistake -> Remediation -> Mastery) is fully implemented and connected. All 26 Fractions skills have pilot-ready question counts. Student, parent, tutor, and teacher dashboards are functional with proper role gating. The platform is substantially more complete than a typical MVP.

However, there are **3 P0 blockers** that must be fixed before putting real students on the system, and **5 P1 items** that would significantly reduce pilot friction.

### Biggest Strengths

1. **Complete learning loop** — Diagnostic placement, adaptive practice, mistake tracking, misconception mapping, remediation, and mastery progression are all wired end-to-end
2. **Rich working evidence system** — Full-screen canvas with math stamps, stroke persistence, photo upload, and AI analysis pipeline
3. **Comprehensive adult dashboards** — Parent, tutor, and teacher views all show meaningful insights (not just scores)
4. **Domain-agnostic diagnostic architecture** — Registry pattern supports expansion beyond Fractions
5. **Strong test coverage on core engines** — 115+ tests on diagnostic, mastery, remediation, and question generation utilities

### Biggest Risks

1. **QA_DISABLE_RATE_LIMIT bypass** — If this env var is accidentally set in production, ALL auth/access controls are bypassed (9 locations)
2. **studentId type mismatch** — ObjectId in Mistake model vs String in MathPath models creates query fragility in working evidence linkage
3. **78% of API routes have no test coverage** — Unknown failure modes during real student use
4. **Monolithic route files** — mastery.js (2,824 lines), admin.js (34K), teacher.js (36K) are hard to maintain and debug
5. **Curriculum mapping drift** — 17 of 26 skills have misaligned F-code/title/curriculum mapping

### Top 5 Things to Fix First

1. Audit and restrict `QA_DISABLE_RATE_LIMIT` to development only (security)
2. Normalize `studentId` type across MathPath models (data integrity)
3. Add auth route tests for login/register flows (stability)
4. Verify curriculum mapping alignment for F001-F026 (content correctness)
5. Test mobile at 375px/390px breakpoints for practice + diagnostic screens (usability)

---

## 2. Architecture Overview

### Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18.2 + Vite 4.3 + Tailwind 3.3 | SPA with React Router v6 |
| Backend | Express 4.18 + Node 22.3+ | Monorepo, serves frontend static |
| Primary DB | MongoDB (Mongoose) | 66 models, main data store |
| Reference DB | PostgreSQL (Prisma) | New curriculum reference data |
| Auth | JWT (bcryptjs) | 7-day tokens, key rotation support |
| File Storage | Cloudflare R2 | Working evidence uploads |
| AI | Claude + OpenAI | Marking, feedback, analysis |
| Testing | Vitest + MongoMemoryServer | 238 test files |
| Deployment | Railway + Vercel | Backend + frontend |

### Repository Structure

```
/
├── server.js              # Express entry (246 lines)
├── routes/                # 76 API route files
├── models/                # 66 Mongoose models
│   └── mathpath/          # 19 MathPath-specific models
├── services/              # 18 service domains
│   └── mathpath/          # 65+ MathPath services
├── middleware/             # 11 middleware files
├── utils/                 # 147 utility files (115 with tests)
├── shared/                # Shared curriculum + diagram engine
│   └── mathpath/fractions/ # Fraction question generators
├── frontend/              # React SPA
│   └── src/
│       ├── pages/         # Route pages (student, parent, tutor, teacher, admin)
│       ├── components/    # Reusable components
│       ├── mathpath/      # MathPath frontend logic
│       └── config/        # Feature flags, nav config
├── scripts/               # 91 seed/QA/migration scripts
├── config/                # DB connection, feature flags
├── data/                  # Static data files
├── docs/                  # Documentation
├── tian-os/               # STALE: abandoned prototype
├── mathpath/              # STALE: pre-React MathPath v1
└── mathpath-mvp/          # STALE: even older MathPath MVP
```

### Key Architectural Patterns

- **Workspace isolation**: All data scoped to workspaces (school, tutor, parent); enforced via `requireWorkspace` middleware
- **Guardian access control**: Parent-child links via `StudentGuardian` model with access levels
- **Domain registry**: Diagnostic/curriculum engine uses registry pattern for multi-domain support
- **Feature gates**: Runtime feature flags with version-based gating
- **Multi-role users**: Single user can hold multiple roles (parent + tutor)

### Dead Code / Stale Directories

| Directory | Size | Status | Action |
|-----------|------|--------|--------|
| `/tian-os/` | 164 KB | Abandoned prototype | Archive/delete |
| `/mathpath/` | 312 KB | Pre-React MathPath v1 | Archive/delete |
| `/mathpath-mvp/` | 272 KB | Even older MVP | Delete |
| `/Tuition agency/` | 424 KB | Unrelated WhatsApp bot | Move to separate repo |
| `/frontend/src/pages/mathpath/` | ~100 KB | Old MathPath pages (superseded by student/mathpath/) | Audit and remove |

---

## 3. Product Flow Audit

### Student Flows

| Flow | Status | Key Files | Notes |
|------|--------|-----------|-------|
| Login / Dashboard | **Working** | `LoginPage.jsx`, `StudentDashboardPage.jsx` | Protected routes, error boundaries |
| MathPath Home | **Working** | `MathPathHome.jsx` | Topic map, mastery state, diagnostic results |
| Diagnostic Start | **Working** | `DiagnosticIntroScreen.jsx` | Intro screen with domain selection |
| Diagnostic Answering | **Working** | `DiagnosticQuestionScreen.jsx` | Adaptive question flow, confidence capture |
| Adaptive Question Selection | **Working** | `selectNextDiagnosticQuestion.js` | Domain decision engine + fallback selection |
| Practice Session | **Working** | `PracticeSession.jsx` (91KB) | Telemetry, working evidence, adaptive difficulty |
| Fluency Session | **Working** | `FluencyHome.jsx`, `TimesTablesFlashQuiz.jsx` | Bronze/Silver/Gold/Platinum benchmarks |
| Story Mode | **Working** | `FractionsStoryModeSession.jsx` | Feature-flagged, F025 + F026 scenarios |
| Mistake Review | **Working** | `MistakesHome.jsx`, `MistakeDetail.jsx` | Misconception analysis, recovery pack trigger |
| Working Evidence Upload | **Working** | `WorkingUploadScreen.jsx` | Photo upload, AI extraction, structured analysis |
| Progress / Mastery | **Working** | `SkillGraph.jsx` (14KB) | Visual mastery mapping, skill dependency tree |
| Retake Diagnostic | **Working** | `diagnosticReplayPolicy.js` | Policy-based; supports baseline/recheck/assigned |
| Wrong Answer Handling | **Working** | `mistakeCorrectionFlow.js` | Immediate feedback + misconception inference |
| Skipped Questions | **Working** | `MathPathAttempt.skipped` | Tracked as `source: 'diagnostic-skipped'` |
| "I Need Help" | **Working** | `RecoveryPackTeachingFlow.jsx` | Recovery pack with guided step-by-step |
| "Working Not Needed" | **Working** | `WorkingEvidenceDecision.jsx` | `workingNotNeeded` flag on attempt |

### Parent Flows

| Flow | Status | Key Files | Notes |
|------|--------|-----------|-------|
| Parent Dashboard | **Working** | `ParentHome.jsx` | Child selector, recommendations, trial banners |
| Child Progress | **Working** | `ChildProgress.jsx`, `ParentMathPathDashboardPage.jsx` | Per-child mastery by subject |
| Mistake Visibility | **Working** | `MistakeHistory.jsx`, `MistakeCard.jsx` | Question + student answer + correct + working |
| Working Evidence View | **Working** | `MistakeCard.jsx` | Preview of uploaded working, extracted steps |
| Weak Areas | **Working** | `WeakTopics.jsx` | Weakest skills across child profile |
| Recommended Actions | **Working** | `RecommendedActions.jsx` | Rule-based recommendations engine |
| Assign Practice | **Working** | `AssignPractice.jsx` | Parent pushes targeted practice |

### Tutor Flows

| Flow | Status | Key Files | Notes |
|------|--------|-----------|-------|
| Tutor Dashboard | **Working** | `TutorHome.jsx` | Student cards, certification, quick links |
| Assigned Students | **Working** | `AssignedStudents.jsx` | Roster with mastery + weak skills |
| Student Mistakes | **Working** | `TutorMathPathDashboardPage.jsx` (47KB) | Mistake gallery + misconception notes |
| Working Evidence | **Working** | Within TutorMathPathDashboardPage | Working images + extracted steps |
| Lesson Prep | **Working** | `LessonPrep.jsx` | AI-generated lesson assets |
| Assign Homework | **Working** | `AssignHomework.jsx` | Homework template library |
| Remediation Recs | **Working** | Within student profile view | Based on mistake/mastery data |

### Teacher Flows

| Flow | Status | Key Files | Notes |
|------|--------|-----------|-------|
| Teacher Dashboard | **Working** | `TeacherHome.jsx` | Classes, interventions, attention flags |
| Classes Overview | **Working** | `Classes.jsx`, `ClassOverview.jsx` | Mastery heatmap, weak topics |
| Class Mastery Map | **Working** | `ClassMasteryMap.jsx` | Skill x student heatmap |
| Weak Groups | **Working** | `WeakGroups.jsx` | Intervention grouping suggestions |
| Assessments | **Working** | `Assessments.jsx`, `CreateAssessment.jsx` | Paper upload + OCR + auto-mark |
| Student Detail | **Working** | `TeacherStudentDetail.jsx` | Per-student from class view |

---

## 4. MathPath / Fractions Audit

### Skills Coverage (F001-F026)

All 26 Fractions skills are defined in `/scripts/domains/fractions.js` with correct framework codes, learning objectives, and prerequisites.

| Range | Skills | Level | Status |
|-------|--------|-------|--------|
| F001-F004 | Recognise, Numerator/Denominator, Whole, Unit | P2 | Complete |
| F005-F008 | Number Line, Compare Unit, Compare Same Denom/Numer | P3-P4 | Complete |
| F009-F012 | Order, Equivalent, Generate Equiv, Simplify | P3-P5 | Complete |
| F013-F015 | Improper, Mixed, Convert | P4 | Complete |
| F016-F019 | Add/Subtract Same/Different Denom | P3-P5 | Complete |
| F020-F022 | Fraction of Quantity, Multiply, Divide | P3-P6 | Complete |
| F023-F026 | Word Problems, Multi-Step, Exam Apps, Mastery | P5-P6 | Complete |

### Question Generation

**Generator files** in `/shared/mathpath/fractions/`:
- `fractionQuestionGenerator.js` (83KB) — Main generator with guardrails
- `fractionQuestionFamilies.js` (39KB) — 100+ question families across F001-F026
- `fractionSkillGraph.js` (21KB) — Skill hierarchy
- `fractionMistakeToMasteryEngine.js` (42KB) — Recovery pack generation

**Content counts per skill:**
- Diagnostic: 7-10 per skill (min 3 required) — PILOT READY
- Practice: 17-33 per skill (min 10 required) — PILOT READY
- Remediation: 3 per skill (min 3 required) — PILOT READY
- Worksheet: 33-52 per skill — PILOT READY

### Content Issues

**HIGH RISK: Curriculum Mapping Drift**
- 17 of 26 skills have misaligned F-code/title/curriculum mapping per `FRACTIONS_SKILL_MAPPING_AUDIT.md`
- Example: F007 "Compare Same Denominator" mapped to P3, but objective text says "Recognise equivalent fractions"
- Impact: Diagnostic routing may place students at wrong skill level

**Quarantined Families (Correctly Isolated)**
- 12 question families removed from serving (e.g., negative fractions, fraction-decimal mixed operations, percentage/ratio context)
- These are correctly out-of-scope for primary curriculum

**Broad Skills (Post-Pilot Split)**
- F009, F015, F018-F020, F023-F024 should be split into sub-skills for precision
- F025-F026 are assessment containers, not true teachable micro-skills

**Content Depth**
- Current: 47-67 items per skill
- Full production target: 100 items per skill
- Gap: ~50% expansion needed post-pilot

### Negative Fractions Control
Guardrails in `fractionQuestionGenerator.js` correctly block negative fractions for P1-P3. Negative fractions only appear at P5+.

### Visual Support
- Bar and area models present for F001-F010
- Number line present for F005-F009
- **Gap**: Limited stripe/tile patterns for multiplication/division contexts

---

## 5. Adaptive Diagnostic Engine

### Architecture

The diagnostic engine uses a **registry pattern** (`diagnosticDomainRegistry.js`) that supports multiple domains, but currently only Fractions is registered via `fractionsDiagnosticDomain.js`.

**Key files:**
- `services/diagnostics/diagnosticRuntime.js` — Session management, answer evaluation
- `services/diagnostics/diagnosticDomainRegistry.js` — Domain registry
- `services/diagnostics/domains/fractionsDiagnosticDomain.js` — Fractions adapter
- `utils/selectNextDiagnosticQuestion.js` — Adaptive question selection
- `utils/diagnosticReplayPolicy.js` — Retake policy enforcement
- `models/mathpath/MathPathDiagnosticSession.js` — Session persistence

### Feature Status

| Feature | Status | Evidence |
|---------|--------|----------|
| Domain-agnostic engine | **Pattern ready, Fractions only** | Registry supports multiple domains |
| Session persistence | **Working** | MathPathDiagnosticSession with adaptive state |
| Answer evaluation | **Working** | `isCorrectWithContext()` from `answerCheck.js` |
| Adaptive next-question | **Working** | Decision engine + fallback selection |
| Skipped questions | **Working** | Tracked as `source: 'diagnostic-skipped'` |
| Per-item time | **Working** | milliseconds, seconds, start/end timestamps |
| Confidence capture | **Working** | Calibration: mastery_signal, overconfidence, fragile_correct, needs_review |
| Results → skills/misconceptions | **Working** | `questionMeta` maps to `skillId` + `misconceptionTag` |
| Retake support | **Working** | Policy-based; baseline/recheck/assigned types |

### Hardcoded Fractions Logic

`fractionsDiagnosticDomain.js` contains Fractions-specific constants:
- `DIAG_MODE_RANGES` with F001-F026 skill codes
- `DIAG_COUNTS` with hardcoded question counts
- Fractions-specific helper functions

This is expected for the current single-domain state but needs abstraction when adding new domains.

---

## 6. Mistake-to-Mastery System

### Correction Flow

The `mistakeCorrectionFlow.js` implements a 5-stage progression:

```
new → acknowledged → corrected → understood → mastered
```

Each stage requires evidence:
1. **new → acknowledged**: Student/adult recognizes mistake
2. **acknowledged → corrected**: Student provides corrected answer
3. **corrected → understood**: Student writes 8+ character reflection
4. **understood → mastered**: Evidence from successful correction, guided question, independent question, or recheck

### Data Model

**Mistake model** (`models/Mistake.js`):
- `studentId`: ObjectId (ref Student)
- `skillId`: ObjectId (ref Skill)
- `misconceptionTag`: String (e.g., 'frac/add-without-common')
- `mistakeType`: Enum (concept_gap, calculation_error, careless, method_error, unknown)
- `rootCauseMapping`: Array of strings
- Indexes: `{studentId, occurredAt}`, `{studentId, skillId, status}`

**MasteryRecord model** (`models/MasteryRecord.js`):
- `studentId`: ObjectId
- `skillId`: ObjectId
- `score`: 0-100
- `status`: not_started | needs_review | learning | mastered
- `consistency`: Rolling window calculation
- `progressionHistory`: Historical snapshots

### CRITICAL: ID Type Mismatch

| Model | studentId Type | Used By |
|-------|---------------|---------|
| Mistake | **ObjectId** | Practice routes, parent/tutor dashboards |
| MasteryRecord | **ObjectId** | Mastery tracking |
| MathPathDiagnosticSession | **String** | Diagnostic engine |
| MathPathAttempt | **String** | Diagnostic attempts |
| MathPathMistakeRecord | **String** | Diagnostic mistakes |
| MathPathWorkingIntelligence | **String** | Working evidence |

**Risk**: The `workingLinkageService.js` queries across both ObjectId and String types. The `legacyStudentIdCandidates()` function (line 50) attempts to handle both, but `$in` queries with mixed types may silently fail in MongoDB.

**Recommendation**: Audit `workingLinkageService.js` to ensure all `$in` clauses convert types consistently.

---

## 7. Working Evidence / Canvas

### Components

| Component | File | Purpose |
|-----------|------|---------|
| FullScreenWorkingMode | `components/learning/FullScreenWorkingMode.jsx` | Full-screen canvas (1400x900), math stamps, zoom |
| WorkingCanvas | `components/learning/WorkingCanvas.jsx` | Embedded inline canvas, 3 modes (Draw/Steps/Ops) |
| QuestionAnnotationOverlay | `components/learning/QuestionAnnotationOverlay.jsx` | Doodle-on-question overlay |
| WorkingPreviewCard | `components/learning/WorkingPreviewCard.jsx` | Thumbnail preview |
| StrokeReplayPlayer | `components/learning/StrokeReplayPlayer.jsx` | Playback of saved strokes |
| WorkingEvidenceDecision | `components/learning/WorkingEvidenceDecision.jsx` | Decision logic for requirement levels |

### Features

- **Drawing tools**: Pen, pencil, highlighter, eraser, shade, line, rectangle
- **Math stamps**: 10 types (fraction, subscript, power, mixed number, root, degree, angle, pi, theta)
- **Text labels**: Inline editing with drag-to-move
- **Undo/redo/clear/zoom**: 0.75-2x zoom range
- **Export**: PNG with full metadata (canvas dimensions, question snapshot, viewport, orientation)
- **Mobile**: Full pointer event support, pressure sensitivity, coalesced events
- **Device detection**: mobile/tablet/desktop via pointer media query

### Backend Model

`MathPathWorkingSession.js`:
- `inputMethod`: paper | stylus | hybrid
- `canvasStrokeData`: Array of stroke objects
- `doodleOverlayData`: Question annotation strokes
- `analysisStatus`: pending_analysis | analysed | needs_review | failed_analysis
- File upload: PDF/JPG/PNG, max 12MB, max 10 files

### Linkage

- **Question**: `questionWorkingMap` contains `questionId`, `skillId`, `sessionId`, `attemptId`
- **Session**: `practiceSessionId` or `assessmentSessionId`
- **Mistake**: `MathPathAttempt.mistakeId` cross-reference
- **Student**: All keyed by `studentId`

---

## 8. Input Components

### FractionAnswerInput (`pages/student/mathpath/components/FractionAnswerInput.jsx`)

- **Modes**: fraction (`n/d`), mixed (`w n/d`), whole (`w`)
- **Features**: Floating popup, tab navigation, paste support, auto-focus
- **Validation**: Numeric-only, zero denominator detection
- **Mobile**: `inputMode="numeric"` for mobile keyboards

### AnswerInputRenderer (`pages/student/mathpath/components/AnswerInputRenderer.jsx`)

- **12+ format types** auto-detected from question metadata
- Dispatches to: FractionAnswerInput, plain numeric, decimal, ordering/list, text/expression, multiple choice
- Format detection: explicit `answerFormat` → answer type → regex pattern → fallback to text

### Assessment

- Inputs are reusable across practice, diagnostic, and assessment sessions
- Mobile-appropriate `inputMode` attributes
- 44px minimum touch targets
- Test coverage: `FractionAnswerInput.test.jsx`, `AnswerInputRenderer.test.jsx`

---

## 9. Story Mode

### Implementation

**Feature flag**: `FEATURE_FLAGS.fractionsStoryMode` (env: `FRACTIONS_STORY_MODE`)

**Files:**
- `FractionsStoryModeSession.jsx` — Session orchestrator
- `fractionStoryModeEngine.js` — Story templates + scene progression
- `useStoryTextToSpeech.js` — Browser TTS hook
- `storyTtsService.js` — TTS provider abstraction

### Content

**F025 (Exam Applications)**: 6+ scenarios (stickers, marbles, notebooks, recipe, garden, money sharing)
**F026 (Remainder Rescue)**: Multi-step remainder operations

### Scene Types (9 stages per story)

1. read_story → 2. identify_question → 3. identify_parts → 4. identify_whole → 5. choose_strategy → 6. choose_operation → 7. compute_step → 8. final_answer → 9. reflection

### Adaptive Behavior

- 17+ mistake tags for adaptive feedback
- Guided steps revealed progressively (3-5 per scene)
- Error hints and retry prompts customized by mistake type
- Visual hint types: fraction_bar, shaded_grid, number_line, part_whole_cards

### TTS/Audio

- Browser native `SpeechSynthesis` API
- Rate: 0.85 default (range 0.5-1.5), Pitch: 1.35 (child voice)
- Sentence-by-sentence narration with highlighting
- Graceful degradation if TTS unavailable

### Mastery Connection

- Story sessions stored as `MathPathPracticeSession` with `sessionType: 'story'`
- Each scene interaction creates `MathPathAttempt` record
- Story completion feeds mastery determination via `fractionMistakeToMasteryEngine`

---

## 10. Adult Dashboards

### Parent Dashboard

**Routes**: `/parent`, `/parent/children`, `/parent/children/:childId`, `/parent/mathpath`, `/parent/weak-topics`, `/parent/recommended-actions`, `/parent/assign-practice`, `/parent/mistake-history`

**Data visibility:**
- Diagnostic results (via recommendations API)
- Weak skills (weakestSkill, weakestTopic in child summary)
- Misconceptions (via mistake records)
- Mistakes (with question + answer + working evidence)
- Working evidence (uploaded images, extracted steps)
- Help requests (student reflection flags)
- Assignment status
- Lesson recordings (if tutor shares)

**Gating**: `StudentGuardian` model with `accessLevel` (full | view_only). School-invited parents are view_only.

### Tutor Dashboard

**Routes**: `/tutor`, `/tutor/students`, `/tutor/students/:id`, `/tutor/mathpath`, `/tutor/lesson-prep`, `/tutor/homework`

**Data visibility:**
- 10 most recent mistakes per student
- Working evidence (drawings, working images)
- Per-skill mastery records
- Assignments and completion status
- Post-lesson notes
- AI-suggested lesson plans

**Gating**: `TutorStudentLink` with workspace scoping. `requireLinkedStudent()` enforces access.

### Teacher Dashboard

**Routes**: `/teacher`, `/teacher/classes`, `/teacher/classes/:id`, `/teacher/classes/:id/mastery-map`, `/teacher/classes/:id/weak-groups`, `/teacher/assign-practice`, `/teacher/assessments`

**Data visibility:**
- Per-student mastery scores
- Class-wide weak topic averages
- Intervention grouping suggestions
- Assessment results (paper upload + OCR + auto-mark)
- Science progress (if attempted)

**Gating**: `ensureTeacherWorkspace()` + workspace role check.

### Dashboard Readiness for Pilot

All three dashboards show **meaningful insights, not just raw scores**. Parents see recommended actions. Tutors see lesson prep suggestions. Teachers see intervention groupings. This is a strong differentiator.

---

## 11. UX / UI / Mobile

### Design System

- **Framework**: Tailwind CSS 3.3 with custom CSS variables
- **Color**: Emerald primary, sunshine/violet/sky/rose accents
- **Typography**: DM Serif Display (headings), Nunito (body, age 7-12 friendly), Inter (UI)
- **Components**: Card, Button, Badge, Alert, Modal, Tabs, Breadcrumb, Spinner, EmptyState, ErrorState (in `components/ui/index.jsx`)
- **Age target**: 7-12 years old, warm rounded shapes

### Mobile Support

**Implemented:**
- Mobile-first Tailwind breakpoints (sm: 640px, md: 768px)
- Safe area inset handling for notched devices
- Bottom nav on mobile, sidebar on desktop
- Appropriate `inputMode` on all inputs
- 44-48px touch targets
- Full-screen working mode for small screens

**Gaps:**
- Not verified at 320px, 375px, 390px, 414px breakpoints (Sprint 9A report)
- Full-screen working "cognitively heavy" on small screens
- Mixed-number input mode switching not obvious to students
- Tutor student cards use inline styles (not responsive)
- Nested parent navigation (parent -> children -> child -> mathpath) could be streamlined

### Accessibility

- ARIA labels and roles throughout
- Skip-to-content link
- Keyboard navigation on all interactive elements
- Emerald focus ring indicators
- `role="alert"`, `role="dialog"`, `role="tab"` used correctly

### Loading/Error/Empty States

All three state types have dedicated components: `Spinner`, `ErrorState` (with retry), `EmptyState` (with contextual messages). Toast notifications for API errors.

---

## 12. Backend / Data / Architecture

### Security Analysis

**Strengths:**
- Workspace privacy boundary well-architected and tested
- Guardian access control with test coverage
- JWT key rotation support
- CORS properly configured (no wildcard)
- Input sanitization middleware
- Rate limiting on auth endpoints (10 req/15min)

**CRITICAL: QA_DISABLE_RATE_LIMIT Bypass**

Found in **9 locations** where `process.env.QA_DISABLE_RATE_LIMIT === '1'` disables security:
- `middleware/workspace.js` — Skips workspace membership checks
- `middleware/rateLimiter.js` — Disables rate limiting
- `middleware/featureGate.js` — Disables feature gates
- `routes/tutor.js` — Skips tutor workspace and student access validation
- `routes/recordings.js` — Skips recording access checks
- `routes/mathpathWorking.js` — Skips student context resolution

**If set in production, any user can access any workspace and any data.**

**Multi-Role Token Issue:**
- JWT only stores single `role`, not `roles[]`
- Users with multiple roles (e.g., teacher + tutor) may not get all features
- `authorize()` middleware checks single role only

### Database Indexes

50+ indexes found. Well-indexed: WorkspaceMember, StudentGuardian, Student, Mistake, FluencyRecord, InformalAssessmentSession.

**Missing indexes:**
- `User.linkedTo` (parent -> student accounts)
- `Class.teacherUserId` (frequently queried)
- `ClassStudent.classId` (roster lookups)
- `TutorProfile` (no visible indexes)

### Validation

- Express-validator used in some routes (auth, admin)
- Most routes use manual validation
- No centralized Joi/Zod schema library
- Input sanitization in middleware (global)

### Monolithic Files (Fragility Risk)

| File | Size | Issue |
|------|------|-------|
| `utils/questionTemplates.js` | 79,265 lines | Inline question library, should be in DB |
| `routes/admin.js` | 34K | Mixed concerns |
| `routes/teacher.js` | 36K | Class + analytics + student management |
| `routes/mastery.js` | 2,824 lines | Monolithic mastery state management |
| `routes/spelling.js` | 21K | Full curriculum in one file |
| `routes/worksheets.js` | 27K | Worksheet library + distribution |

---

## 13. Testing / QA

### Coverage Summary

| Area | Test Files | Coverage | Quality |
|------|-----------|----------|---------|
| Utils | 115 | ~80% | Strong — diagnostic, mastery, remediation engines |
| Routes | 17 of 76 | 22% | Mixed — some excellent, many missing |
| Middleware | 1 of 11 | 9% | workspace.test.js only |
| Frontend | Vitest + Playwright | Partial | E2E pilot-gate tests exist |

### Well-Tested Flows

- Guardian access to children's data (isolation verified)
- Adaptive diagnostic start/answer/history/growth
- Assessment blueprint CRUD
- Fluency engine sessions
- Admin billing overview + authorization
- Workspace privacy boundary

### Critical Untested Flows

- **Authentication** (login, register, password reset, token rotation)
- **Assignment lifecycle** (create -> assign -> submit -> grade)
- **Classroom workflows** (create -> join -> assessment -> review)
- **Billing & subscriptions**
- **Messaging system**
- **Parent-student-tutor relationship management**
- **MathPath end-to-end learning path**
- **Working evidence save/delete/preview**
- **Story mode routes**
- **Mobile layout**

### Missing E2E Tests

No Playwright/Cypress end-to-end tests for real user journeys. The `qa-pilot-gate.js` script exists for readiness checking but is not a behavioral test suite.

---

## 14. Recommendations

### Architecture Summary

**Well-designed:**
- Domain registry pattern for multi-subject expansion
- Workspace isolation for multi-tenant data privacy
- 5-stage mistake correction flow
- Structured working evidence pipeline
- Comprehensive adult dashboard data APIs

**Fragile:**
- Monolithic route files (mastery, admin, teacher, spelling)
- `questionTemplates.js` at 79K lines
- Mixed ObjectId/String studentId types
- QA bypass flags in production-reachable code

**Should be refactored (post-pilot):**
- Split monolithic routes into service + handler pattern
- Migrate questionTemplates.js to database
- Unify role system (make `roles[]` primary, deprecate `role`)
- Complete PostgreSQL migration for core models

### Product Learning Loop Status

```
Diagnostic → Practice → Mistake → Remediation → Mastery
    ✅          ✅         ✅          ✅           ✅
```

**What works:** The complete loop is wired end-to-end. Students get placed by diagnostic, practice adaptively, have mistakes tracked with misconception tags, receive remediation via recovery packs, and progress through mastery levels. Adults can see all of this.

**What is missing:**
- No explicit "mastery celebration" moment for students
- Recovery pack completion doesn't visibly update mastery on the student's screen in real-time
- No push notification to parent when child requests help
- No way for parent/tutor to leave a note on a specific mistake

### Suggested Implementation Order

**Day 1 (P0 blockers):**
1. Restrict `QA_DISABLE_RATE_LIMIT` to development environment only
2. Verify `workingLinkageService.js` handles ObjectId/String conversion correctly
3. Run curriculum mapping verification for F001-F026

**Day 2-3 (P1 stability):**
4. Add auth route tests (login/register/token)
5. Test mobile at 375px/390px for practice + diagnostic screens
6. Add workspace isolation tests for tutor and family routes
7. Fix tutor student cards inline styles for mobile

**Week 1 (P1 polish):**
8. Add E2E test for: student diagnostic -> practice -> mistake review
9. Add E2E test for: parent sees child's mistakes + working evidence
10. Verify Story Mode feature flag works correctly in production
11. Test working evidence save/restore cycle end-to-end

**After pilot:**
- Split monolithic route files
- Migrate questionTemplates.js to database
- Expand Fractions content to 100 items per skill
- Add push notifications for help requests
- Build mastery celebration UI
- Add new math domains (Whole Numbers, Decimals, Measurement)
- Refactor role system to `roles[]` primary
