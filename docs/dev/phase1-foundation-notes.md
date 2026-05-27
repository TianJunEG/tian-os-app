# Dev notes — Phase 1: Tian OS foundation

Source of truth: `docs/tian-os-master-product-spec.md` + `docs/tian-os-implementation-plan.md`.
Scope built: **Phase 1 only** (auth/roles/workspaces, student profile, topic/skill
map, unified shell + student dashboard shell). MathPath, Parent, Tutor, Teacher
dashboards are **later phases and were not built** — their routes render
placeholders so navigation is whole.

## What was implemented

**Backend (Express + Mongoose, additive — no existing collections changed):**
- `User` extended with `roles[]` (multi-role) + `defaultWorkspace`. Legacy
  single `role` kept for back-compat.
- New models: `Workspace`, `WorkspaceMember`, `Student`, `StudentGuardian`,
  `Subject`, `Topic`, `Skill`, `MasteryRecord`, `PracticeSession`,
  `PracticeAttempt`, `Mistake`, `Assignment`.
- `middleware/workspace.js` → `requireWorkspace`: enforces the privacy boundary
  (reads `X-Workspace-Id`, checks active membership, attaches `req.workspaceId`).
- `routes/context.js` → `GET /api/context` (available roles + workspaces),
  `POST /api/context/switch` (validates membership). Registered at `/api/context`.

**Frontend (React + Vite + Tailwind):**
- Design tokens in `index.css` (`:root` vars mirroring the design bundle) + Inter
  & JetBrains Mono. `tailwind.config.js` extended (ink/ivory/bone/hairline/
  mastery/success/error, `font-ui`, `font-mono`, `shadow-resting/active`).
- `context/WorkspaceContext.jsx` — role/workspace state, persisted active
  workspace, `switchWorkspace` / `switchRole`, graceful fallback if `/api/context`
  is unavailable. Active workspace sent as `X-Workspace-Id` via the axios
  interceptor (`services/api.js`).
- `components/ui/index.jsx` — `Card`, `Button`, `Badge`/`StatusBadge`,
  `ProgressBar`, `StatTile`, `PageHeader`, `EmptyState`, `Spinner`, `ModuleCard`.
- `components/shell/AppShell.jsx` — sidebar (desktop) + topbar + floating bottom
  nav (mobile) + `WorkspaceSwitcher` + `RoleSwitcher`, driven by `config/nav.js`.
- `config/modules.js` (module catalog) + `config/nav.js` (role-based nav).
- `pages/student/StudentDashboard.jsx` — **live** dashboard shell (Today's
  Learning, progress preview, assignments empty state, module grid).
- `pages/Placeholder.jsx` + shell routes wired in `App.jsx` for student feature
  pages and parent/tutor/teacher dashboards.

## What is mocked / placeholder
- Student dashboard numbers (mastered / to-review / weekly %) are zeros — real
  values arrive with the mastery engine in Phase 2.
- All non-student dashboards and all student feature screens (MathPath, fluency,
  worksheets, science, lifelab, assignments, progress) are `Placeholder` pages.
- `Question` model not created yet (Phase 2). `MasteryRecord`/`PracticeSession`/
  `PracticeAttempt`/`Mistake`/`Assignment` schemas exist but have no write logic
  yet.

## Seed data (`npm run seed:foundation`)
5 users (password `Passw0rd!`): `demo.student / demo.parent / demo.tutor /
demo.teacher / demo.dual @tianos.test`. The dual user is **teacher + tutor** with
two separate workspaces. Workspaces: parent (family), tutor, school, plus the
dual user's school + tutor. One `Student` in the parent workspace with guardian
link. Math subject + 5 topics + ~17 skills (Whole Numbers, Fractions, Decimals,
Area & Perimeter, Word Problems).

## Role / workspace privacy rules
- **Role → features** (nav set), **workspace → visible data**.
- Every workspace-scoped request must carry `X-Workspace-Id`; `requireWorkspace`
  denies non-members (403) and missing workspace (400). School and private-tutor
  data therefore never mix unless an explicit link is added later.
- Frontend persists the active workspace and resets role/nav on switch.

## Commands
```bash
# backend (needs MongoDB at MONGODB_URI, default mongodb://localhost:27017/tutor-match)
npm install
npm run seed:foundation        # seed the multi-role/workspace demo
npm run dev                     # start API on :5001

# frontend
cd frontend && npm install && npm run dev   # Vite dev server

# tests
npx vitest run middleware/workspace.test.js   # workspace privacy boundary (3 tests)
```
No DB migrations (Mongoose is schemaless on the wire).

## Known limitations
- No `Question` bank / practice flow yet (Phase 2).
- Shell mounts at new routes (`/student`, `/parent`, …) **alongside** the legacy
  `/dashboard` etc. Migrating old pages into the shell is deliberate future work.
- `WorkspaceContext` switch is client-trusted for nav; data access is enforced
  server-side by `requireWorkspace` (the security boundary).

## Next recommended build step
**Phase 2 — MathPath MVP.** Use the ready-to-paste prompt in
`docs/tian-os-implementation-plan.md §7`: add the `Question` model + math seed
(≥30 questions, stacked fractions), practice session/attempt/mastery/mistake
logic, answer-checking helpers (fraction/decimal equivalence), and the five
MathPath screens — replacing the student `Placeholder`s and lighting up the
dashboard numbers.
