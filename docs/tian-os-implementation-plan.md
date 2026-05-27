# Tian OS — Implementation Plan / Roadmap

> Derived from `docs/tian-os-master-product-spec.md` (source of truth).
> A practical roadmap for Claude Code: folder structure, models, routes/pages,
> shared components, phased build order, the first 10 tasks, and ready-to-paste
> prompts for the next phases. **Do not build everything at once.**

Stack (confirmed by inspection): **Express + Mongoose (MongoDB)** backend (ESM),
**JWT** auth, **React + Vite + Tailwind** frontend. No SQL migrations — Mongoose
schemas + seed scripts.

---

## 1. Project folder structure (target)

```
/                         # Express backend (existing)
  models/                 # Mongoose models  ← add core models here
  routes/                 # Express routes   ← add context.js, mathpath.js …
  middleware/             # auth, workspace scoping
  scripts/                # seed scripts     ← seedFoundation.js, seedMath.js
  docs/
    tian-os-master-product-spec.md
    tian-os-implementation-plan.md
    dev/                  # per-phase developer notes
  TUTOR_MVP_SPEC.md  TEACHER_MVP_SPEC.md
  frontend/src/
    context/              # AuthContext, WorkspaceContext
    components/
      ui/                 # Card, Badge, ProgressBar, EmptyState, ModuleCard …
      shell/              # AppShell, Sidebar, BottomNav, TopBar, switchers
    config/               # modules.js (module catalog), brand.js
    pages/
      student/  parent/  tutor/  teacher/
```

## 2. Backend model list (create in this order)

Phase 1: `User` (extend with `roles[]`), `UserRole`, `Workspace`,
`WorkspaceMember`, `Student`, `StudentGuardian`, `Subject`, `Topic`, `Skill`,
plus stubs `Assignment`, `PracticeSession`, `PracticeAttempt`, `MasteryRecord`,
`Mistake`.
Phase 2 fills out: `Question`, and the practice/mastery/mistake collections.
Later: `Class`, `ClassStudent`, `TutorProfile`(exists), `TeacherProfile`,
`Recommendation`, `Worksheet`(exists), `LifeLabActivity`, `LifeLabSubmission`,
`InterventionRecord`, `Report`.

## 3. Frontend route / page list

| Path | Page | Phase |
| --- | --- | --- |
| `/student` | Student dashboard shell | 1 |
| `/student/mathpath` | MathPath home | 2 |
| `/student/mathpath/topics/:topicId` | Topic detail | 2 |
| `/student/mathpath/practice/:sessionId` | Practice session | 2 |
| `/student/mathpath/results/:sessionId` | Practice result | 2 |
| `/student/mathpath/mistakes` | Mistake review | 2 |
| `/student/assignments` · `/student/assignments/:id` | Student assignments | 3 |
| `/parent` | Parent dashboard | 3 |
| `/parent/children/:studentId/{progress,weak-topics,actions,assign-practice,mistakes,assignments}` | Parent child screens | 3 |
| `/tutor` | Tutor dashboard | 4 |
| `/teacher` | Teacher dashboard | 5 |
| `/progress` | Progress / skill graph | 2–3 |

Phase 1 ships **placeholder** pages for parent/tutor/teacher/assignments/
progress/mathpath so navigation is whole; later phases fill them in.

## 4. Shared component list (Phase 1)

- **ui/**: `Card`, `Badge` / `StatusBadge`, `ProgressBar`, `Ring`, `EmptyState`,
  `Spinner`, `PageHeader`, `ModuleCard`, `StatTile`.
- **shell/**: `AppShell` (sidebar+topbar desktop, bottom nav mobile), `Sidebar`,
  `BottomNav`, `TopBar`, `RoleSwitcher`, `WorkspaceSwitcher`.
- **context/**: `WorkspaceContext` (current role, current workspace, available
  lists, switch fns, persisted; enforces workspace data scope).
- **config/**: `modules.js` — the single module catalog (name, purpose, icon,
  path, status: live | coming-soon) so the dashboard stays modular.

## 5. MVP build phases

1. **Foundation** — auth/roles/workspaces, student profile, topic/skill map,
   student dashboard shell + shared shell/components. *(this build)*
2. **MathPath core** — MathPath home/topic/practice/result/mistakes, practice
   sessions, mastery records, mistake history, answer checking, math seed.
3. **Assign & Parent** — assignment model, parent dashboard + child screens,
   student assignment flow, rule-based recommendations, worksheet (digital).
4. **Tutor** — tutor dashboard, lesson notes, homework, parent updates.
5. **Teacher** — classes, class mastery, grouping, intervention tracking.
6. **Near-term modules** — Science Adaptive Revision, Spelling Practice, LifeLab.

## 6. First 10 implementation tasks (Phase 1)

1. Extend `User` with `roles[]` (additive; keep legacy `role`).
2. Create core Mongoose models (Workspace, WorkspaceMember, Student,
   StudentGuardian, Subject, Topic, Skill + practice/mastery/mistake stubs).
3. Add `routes/context.js`: `GET /api/context`, `POST /api/context/switch`
   (validates workspace membership; never leaks cross-workspace data). Register
   in `server.js`.
4. Add `scripts/seedFoundation.js` + `seed:foundation` npm script: 5 users
   (student, parent, tutor, teacher, teacher+tutor), 3 workspaces, memberships,
   Math subject + topics + skills.
5. Add design tokens to `frontend/src/index.css` (design-system `:root` vars,
   Inter + JetBrains Mono) and extend `tailwind.config.js` (ink/ivory/bone/
   hairline/mastery + fonts).
6. Build `ui/` primitives (Card, Badge/StatusBadge, ProgressBar, EmptyState,
   Spinner, ModuleCard, PageHeader, StatTile).
7. Build `WorkspaceContext` (fetches `/api/context`, graceful fallback, persists
   active role/workspace).
8. Build `shell/` (AppShell + Sidebar + BottomNav + TopBar + RoleSwitcher +
   WorkspaceSwitcher), role-aware nav from one config.
9. Build `config/modules.js` + the **Student dashboard shell** (Today's Learning,
   module cards, progress preview) at `/student`.
10. Add placeholder pages + wire all Phase-1 routes in `App.jsx` under `AppShell`
    (alongside existing routes; do not break them).

---

## 7. Ready-to-paste prompts for the next phases

These pre-scope Phases 2 and 3 so they can run as their own focused turns.

### Next prompt — Phase 2: MathPath MVP
> Using `docs/tian-os-master-product-spec.md` and the Phase 1 foundation,
> implement the **MathPath MVP** only. Build: `/student/mathpath` (home),
> `topics/:topicId`, `practice/:sessionId` (one question at a time, hint, check,
> next, progress), `results/:sessionId`, `mathpath/mistakes`. Reuse the existing
> AppShell/cards/badges/progress — do not duplicate layout. Seed Primary 4/5 Math
> (≥5 topics, ≥15 skills, ≥30 questions: short answer / MCQ / word problem; each
> with answer, worked solution, hint, difficulty, topic/skill ids, mistake tags;
> render fractions stacked, not slash). Implement practice-session logic
> (create session → serve questions → record attempts/time/hints → end), answer
> checking (numeric/fraction/decimal equivalence helpers; 1/2 == 2/4), a simple
> explainable mastery update (0–39 needs_review, 40–69 learning, 70–100 mastered,
> recency-weighted), and mistake tracking (type: concept_gap | calculation_error
> | careless | method_error | unknown). Update the Student dashboard MathPath card
> (recommended next skill, mastery, weak-topic alert, continue) + progress
> preview. Write `docs/dev/mathpath-mvp-notes.md`. Do not build worksheet PDF,
> Science, Spelling, LifeLab, payments, or other dashboards.

### Then — Phase 3: Assignments + Parent Dashboard MVP
> Using the master spec + `docs/dev/mathpath-mvp-notes.md`, implement
> **Assignments + Parent Dashboard MVP** (Math only). Finalise the `Assignment`
> model (workspace/student/assignedBy/role, module, subject, topic, skillIds,
> questionCount, difficulty, dueDate, status not_started|in_progress|completed|
> overdue, completionDate, linked sessionId, score, feedback). Build `/parent`
> + child screens (progress, weak-topics, actions, assign-practice, mistakes,
> assignments) reading the **same** mastery/mistake/session data. Build the
> student assignment flow (`/student/assignments`, launch MathPath from an
> assignment, completion updates status+score, reflected on parent dashboard).
> Add rule-based recommendations (mastery<40 → assign; 3+ recent mistakes →
> review; no practice 7d → restart; overdue → follow up; improved → continue).
> Enforce workspace/guardian privacy (parent sees only linked children; no
> teacher/tutor workspace bleed). Write `docs/dev/parent-assignments-mvp-notes.md`.
> Do not build full tutor/teacher dashboards, PDF, payments, marketplace, or
> Science/Spelling/LifeLab.

---

## 8. Guardrails (apply to every phase)

- English = **Spelling Practice only**; never surface Reading/Comprehension/
  Writing/Cloze.
- **Math is the MVP core**; other modules wait their phase.
- **One shared data core** — all surfaces read the same students, mastery,
  mistakes, skill map. No per-app silos, no parallel mastery engine.
- **Workspace isolation** — teacher vs tutor data never mix without a consented
  link; every query scoped by `workspaceId`.
- One primary CTA per screen; calm voice; mobile-first; don't break existing
  routes/auth.
