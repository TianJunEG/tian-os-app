# Tian OS Technical Blueprint -- Remote Developer Reference

Last updated: 2026-06-10

---

## 1. Product Vision

Tian OS is a learning platform for Singapore primary-school students. The initial module is **MathPath** (fractions curriculum, skills F001-F161). The platform serves three adult roles alongside students:

- **Parents** -- monitor child progress, review mistakes, view mastery summaries
- **Tutors** -- manage linked students across workspaces, track learning outcomes
- **Teachers** -- manage classes, assign work, review submissions, view class analytics

The platform is **multi-workspace**: each user type operates in their own workspace with role-based access. A student is not a workspace member -- the child record lives in the parent's workspace, and student-facing routes resolve access from the logged-in user.

---

## 2. Architecture

| Layer | Stack |
|---|---|
| Frontend | React 18 + Vite, React Router v6, Tailwind CSS + CSS variables |
| Backend | Node.js + Express, MongoDB via Mongoose |
| Testing | Vitest + jsdom (frontend), Vitest (backend) |
| Auth | JWT-based, `protect` middleware on all authenticated routes |
| Feature gating | Env-var feature flags on both frontend and backend |

### Key patterns

- **Role-based shell**: `AppShell` renders a bottom navigation bar for mobile, with nav items filtered by the user's role and active feature flags.
- **Lazy routes**: All page components are `React.lazy()` imports in `App.jsx`.
- **Workspace scoping**: Every API request carries `X-Workspace-Id` header. Backend middleware (`middleware/workspace.js`) extracts and validates it.
- **Student visual modes**: `resolveStudentVisualMode()` adapts the UI (colours, sizing) for lower primary, upper primary, or secondary students.

---

## 3. Engineering Rules

1. **Feature flags required** for every new module or experimental feature. No unreleased code ships without a flag.
2. **Seeded data** must set `seeded: true` on the document. Seeded records are filtered out of student-facing views by default (e.g., seeded mistakes are hidden in Mistake-to-Mastery).
3. **Access control**: Use `resolveStudent(req, explicitId)` from `utils/studentContext.js` for any route that acts on a student. It checks ownership, guardian relationship, tutor link, or workspace membership and throws `{status, message}` on failure.
4. **Modern practice flow**: Start sessions with `{ skillId, sessionType, questionCount }`, not the legacy `items` array. `PracticeSession` still supports the legacy path but new code should not use it.
5. **Navigation**: Use the `replace` prop on `<Navigate>` and `navigate(path, { replace: true })` to prevent history stack pollution in session flows.
6. **No direct model imports in frontend** -- all data goes through `services/api.js`.

---

## 4. Feature Flag System

### Frontend (`frontend/src/config/featureFlags.js`)

```
flagEnabled(name, fallback = false)
```

- Reads `import.meta.env.VITE_ENABLE_{name}` or `import.meta.env.ENABLE_{name}`.
- Returns `fallback` if neither env var is set.
- Truthy check: value is `'true'` or `'1'`.

Exported as `FEATURE_FLAGS` object. Route guards use `<FeatureGuard feature="name">`.

### Backend (`config/featureFlags.js`)

- Reads `process.env.FEAT_{name}`.
- Opt-out pattern for on-by-default features: `!== '0'` (e.g., `worksheets`, `parent`).
- Opt-in pattern for disabled features: `=== '1'` (e.g., `lifelab`, `science`).
- Server also has `TIANOS_VERSION` (default `'v0.1'`) for version-gated endpoints.

### Currently enabled by default

| Flag | Frontend | Backend |
|---|---|---|
| mathpath | `true` | `true` |
| mistakes | `true` | `true` |
| progress | `true` | `true` |
| worksheets | `true` (opt-out) | `!== '0'` (opt-out) |
| parent | `true` (opt-out) | `!== '0'` (opt-out) |
| tutor | `true` (opt-out) | `=== '1'` (opt-in) |
| teacher | `true` (opt-out) | `=== '1'` (opt-in) |

### Currently disabled by default

`lifelab`, `science`, `mechanisms`, `spelling`, `fluency` (pilot), `assessments` (pilot), `modelTrainer` (pilot), `payments`, `tutorMarketplace`, `certification`, `fractionsStoryMode`.

---

## 5. MathPath Module

### Skill graph

- Skills coded F001 through F161, stored in the `Skill` model.
- Graph defines prerequisite chains for the fractions curriculum.
- 142 of 161 skills have automated questions; the remainder require figure-based input.

### Learning loop

1. **Diagnostic** -- adaptive placement test assigns initial skill levels.
2. **Practice** -- `startLearningSession({ skillId, sessionType: 'practice', questionCount: 10 })` creates a `PracticeSession`. Student answers questions in `PracticeSession.jsx`.
3. **Result** -- `PracticeResult.jsx` shows session summary with per-question review cards.
4. **Mastery** -- `masteryEngine.js` computes exponential moving average per (student, skill). Mastery at score >= 80 with >= 5 attempts.

### Key components

| Component | Path | Purpose |
|---|---|---|
| `MathPathHome` | `pages/student/mathpath/MathPathHome.jsx` | Student landing, recommended next skill, practice launcher |
| `PracticeSession` | `pages/student/mathpath/PracticeSession.jsx` | Question rendering, answer submission, working canvas |
| `PracticeResult` | `pages/student/mathpath/PracticeResult.jsx` | Session summary with review cards |
| `SkillGraph` | `pages/student/SkillGraph.jsx` | Visual skill map with mastery status |
| `DiagnosticQuestionScreen` | `pages/student/mathpath/diagnostic/` | Diagnostic placement flow |

---

## 6. Mistake-to-Mastery

### Status progression

```
new -> acknowledged -> corrected -> understood -> mastered
```

### Transition evidence

| Transition | Evidence required |
|---|---|
| new -> acknowledged | Student opens the mistake detail (`reviewed = true`) |
| acknowledged -> corrected | Reflection (>= 8 chars) + correction attempt matching `correctAnswer` |
| corrected -> understood | Understanding answer (>= 8 chars), must already be corrected |
| understood -> mastered | Mastery evidence (type: `successful_correction`, `guided_question`, `independent_question`, or `recheck`) |

### API

- `PATCH /api/mistakes/:id/learning` -- body: `{ action, reflection, correctionAttempt, understandingAnswer, masteryEvidence }`
- Enforcement logic: `services/mathpath/mistakeCorrectionFlow.js` -> `applyMistakeLearningAction()`

### Seeded data

- Mistakes with `seeded: true` are filtered from student-facing views.
- Seeded data exists for QA/demo purposes.

---

## 7. Times Tables Fluency

- **Feature flag**: `VITE_ENABLE_FLUENCY_PILOT` (frontend), disabled by default.
- **Entry point**: `FluencyHome` at `/student/mathpath/fluency`, linked from MathPathHome.
- **Engine**: Client-side weighted question generation with fact-strength tracking.
- **Persistence**: `localStorage` for session state; `FluencyRecord` model for server-synced results.
- **Routes**: `/student/mathpath/fluency` (home), `/student/mathpath/fluency/skills` (skill breakdown).

---

## 8. Worksheet Generator

- **Two flows**: Rule-based generation (select topic, generate PDF) and AI photo analysis (upload paper, extract mistakes).
- **Provider abstraction**: Uses Anthropic (Claude) and OpenAI interchangeably via a provider layer.
- **Feature flag**: `VITE_ENABLE_WORKSHEETS` (frontend, on by default), `FEAT_WORKSHEETS` (backend, on by default).
- **Misconception logging**: Per-student misconception records generated from AI photo analysis feed back into the learning profile.

---

## 9. Student Profile

- **Inline name editing**: Student can edit display name from their profile.
- **Achievement badges**: Child-friendly badge display; badges awarded for milestones (mastery counts, streaks, diagnostic completion).
- **Learning timeline**: Chronological view of practice sessions, diagnostic results, and mistake reviews.
- **Visual modes**: UI adapts based on student level -- lower primary (P1-P3), upper primary (P4-P6), secondary. Resolved by `resolveStudentVisualMode()`.

---

## 10. Parent / Tutor / Teacher Dashboards

### Parent

- **Model**: `StudentGuardian` links parent user to student.
- **Views**: `StudentCare` panel shows child's mastery summary, recent mistakes, practice history.
- **Mistake cards**: `MistakeCard` component shows learning status badge per mistake.
- **Routes**: `/parent/children/:studentId/*`

### Tutor

- **Model**: `TutorStudentLink` connects tutor to student within a workspace.
- **Views**: `TutorStudentProfile` shows per-student mastery and mistake overview.
- **Workspace-scoped**: Tutor API calls require `X-Workspace-Id`; backend verifies tutor membership.
- **Routes**: `/tutor/*`

### Teacher

- **Models**: `Class`, `ClassStudent` link teacher to students.
- **Views**: Class-level analytics, per-student drill-down, assignment management.
- **Routes**: `/teacher/classes/:id/*`

---

## 11. Design System

### Brand palette

| Token | Value | Usage |
|---|---|---|
| `--teal-500` (primary) | `#0F4C5C` | Primary brand, headers, CTAs |
| `--teal-400` | `#3FBAC8` | Lighter teal for accents |
| `--ivory-bg` | warm ivory | Page backgrounds |
| `--gold-*` | gold tones | Achievement badges, highlights, "needs attention" states |

### Implementation

- **Tailwind CSS** + CSS custom properties defined in `frontend/src/index.css`.
- **CSS variables** for theme colours, mastery level colours (`--mastery-1` through `--mastery-5`).
- **Visual modes**: Lower primary uses larger fonts and more playful styling; upper primary is standard; secondary is more mature. Controlled by `studentVisualMode.js`.
- **Badge component**: `Badge` with tones: `success`, `gold`, `navy`, `neutral`.

---

## 12. Testing

### Setup

- **Runner**: Vitest with jsdom environment for frontend tests.
- **Test location**: Co-located with source files (e.g., `PracticeSession.jsx` + `PracticeSession.telemetry.test.jsx`).
- **Commands**: `npm run test` (backend), `cd frontend && npm run test` (frontend, alias for `vitest run`).

### Key conventions

- Mock API calls with `vi.mock()` and `vi.fn()`.
- Use `vi.stubEnv()` for feature flag testing.
- Diagram rendering tests use shared SVG renderer fixtures.

### Known issues

- `DiagnosticQuestionScreen` tests have intermittent failures (timing-sensitive rendering).

---

## 13. Safety-Critical Areas

### Access control

- **`resolveStudent()`** (`utils/studentContext.js`): Every route that reads or writes student data must call this. It checks: self-ownership, guardian link, tutor link, workspace membership, partner access. Throws `{ status: 403 }` on failure.
- **`X-Workspace-Id` header**: All workspace-scoped operations require this header. Backend `middleware/workspace.js` extracts and validates. Missing header defaults to `'qa-workspace'` in dev.
- **`RoleGuard` + `FeatureGuard`**: Frontend route guards prevent rendering unauthorized pages.

### Feature flag enforcement

- Backend: `featureGate()` middleware blocks API calls when a flag is off. Also supports version gating (`minVersion`).
- Frontend: `FeatureGuard` component renders nothing (or a "coming soon" state) when the flag is off.
- Risk: Some nav tabs (e.g., LifeLab in `ClassNav`, `ChildNav`) are hardcoded without flag checks. Audit nav components when adding new modules.

---

## 14. Sprint Queue

### Pilot readiness focus

- Diagnostic accuracy validation across all 142 question-backed skills
- Mistake-to-Mastery flow end-to-end QA (all 5 status transitions)
- Working-on-paper evidence capture reliability
- Parent dashboard completeness (mastery summary, mistake cards, timeline)
- Seeded data cleanup for pilot workspaces
- Feature flag audit: ensure disabled modules are fully hidden (nav tabs, routes, API)

### Near-term backlog

- Fluency pilot rollout (behind `FLUENCY_PILOT` flag)
- Worksheet generator AI photo flow stabilisation
- Tutor workspace onboarding flow
- Teacher class management improvements
- LifeLab content authoring (blocked on content volume)
