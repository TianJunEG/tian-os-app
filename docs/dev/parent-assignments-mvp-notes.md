# Dev notes — Phase 3: Assignments + Parent Dashboard MVP

Source of truth: `docs/tian-os-master-product-spec.md`, `docs/dev/phase1-foundation-notes.md`,
`docs/dev/mathpath-mvp-notes.md`. Scope: let a parent view a child's progress,
weak topics, and mistakes; assign targeted **Math** practice; track completion;
and get rule-based recommendations. The student completes assigned work through
the existing MathPath flow. **No full parent platform** (no messaging, payments,
tutor marketplace, PDF, Science/Spelling/LifeLab).

## What was implemented

**Backend (reuses the shared mastery/mistake/assignment data — no new silo):**
- `routes/family.js` (mounted `/api/family`):
  - `GET /children` — students the caller is a guardian of (parent-workspace
    scope), each with a light mastery summary (overall %, mastered count, weakest
    skill/topic).
  - `GET /children/:studentId/recommendations` — rule-based parent actions.
- `utils/parentRecommendations.js` — pure `buildRecommendations()`; deterministic
  rules (see below). Unit-tested.
- Reused as-is: `POST /api/assignments` (create), `GET /api/assignments?studentId=`
  (list), `GET /api/mastery?studentId=`, `GET /api/mastery/map?studentId=`,
  `GET /api/mistakes?studentId=`. All gate access through
  `resolveStudent(req, id)` (guardian/workspace check).
- Assignment **completion** is already wired in `routes/practice.js`: starting a
  session with `assignmentId` sets the assignment `in_progress` + links the
  session; `complete` sets `completed` + `score`.

**Frontend (inside the unified shell):**
- API: `familyAPI` (children, recommendations). `assignmentsAPI` / `skillsAPI` /
  `worksheetGenAPI` already existed in the learning-core block of `services/api.js`.
- Parent screens (`pages/parent/`): `ParentHome` (child selector, overall status,
  top recommended action, weak-topic + assignment summaries), `ParentChildren`
  (list), and per-child `ChildProgress`, `WeakTopics`, `RecommendedActions`,
  `AssignPractice`, `MistakeHistory`, `ChildAssignments` — sharing a `ChildNav`
  tab header and a `useChild` hook.
- Student: `StudentAssignments` (`/student/assignments`) — pending work with
  **Start** (launches a MathPath session bound to the assignment); the dashboard
  "Assigned to you" block now lists real pending assignments.
- Routes wired in `App.jsx`; parent nav simplified (Home · Children · More).

## How parent recommendations work (`utils/parentRecommendations.js`)
Deterministic, priority-sorted (high → low):
- **Overdue assignment** → "Follow up on overdue assignment" (high).
- **3+ recent unresolved mistakes in a skill** → "Review recent mistakes" (high).
- **Attempted skill with mastery < 40** → "Assign practice for this weak skill"
  (high; top 2).
- **No practice in 7+ days** (or none yet) → "Restart a 10-minute MathPath
  practice" (medium).
- **Mastered skills exist** → "Continue to the next skill" (low).
Each carries `{ actionType, priority, reason, action, relatedSkillId? }`; the UI
routes each `actionType` to the right screen.

## How assignment creation works
Parent → `AssignPractice` → `POST /api/assignments` with `{ studentId, module:
'MathPath', subject: 'Math', assignedByRole: 'parent', topicId, skillIds:[skill],
difficulty, questionCount, dueDate }`. `workspaceId` + access are derived
server-side from the child record (guardian check). Math only; Mastery Worksheet
/ Spelling shown disabled ("soon").

## How student completion flows back
`StudentAssignments` → Start → `POST /api/practice/sessions { assignmentId }`
(server pulls the assignment's skills) → student answers → `complete` marks the
assignment `completed` + stores `score`. The parent's `ChildAssignments` and
`ParentHome` summary then reflect it; mastery/mistakes update via the shared
engine, so weak topics and recommendations recompute automatically.

## Workspace & privacy guardrails
- Parents see **only** children they are a `StudentGuardian` of, scoped to the
  parent workspace. `resolveStudent` denies any other student (403).
- No teacher/tutor workspace data is reachable from parent screens; the parent
  endpoints never join class or lesson records.

## What is mocked / simplified
- "Recent improvement" / "practice consistency" on Child Progress are represented
  by current mastery + per-topic bars (no historical time series yet).
- Recommendations are computed on read (no persisted `Recommendation` collection
  yet). Mastery Worksheet assignment is disabled in the parent UI (Phase 4).
- Parent cannot yet drill into a single assignment's per-question detail (list +
  status + score only).

## Commands
```bash
npm install
npm run seed:mathpath          # foundation + question bank + fluency
npm run dev                    # API :5001
cd frontend && npm install && npm run dev
npx vitest run middleware/workspace.test.js utils/mathpath.test.js utils/parentRecommendations.test.js   # 15 tests
```

## Test steps (manual)
1. Log in as `demo.parent@tianos.test` (`Passw0rd!`) → `/parent`.
2. View child progress (`Children` → a child → Progress).
3. View weak topics; open Recommended actions.
4. Assign practice (pick topic/skill/difficulty/count/due) → success.
5. Log in as `demo.student@tianos.test` → dashboard shows the assignment → Start.
6. Complete the MathPath session.
7. Back as parent → child Assignments shows it **completed** with a score; mastery
   + recommendations have updated.

## Known limitations
Same student-resolution model as Phase 2 (the demo student + parent share the
seeded child via `StudentGuardian`). Recommendation engine is rule-based by
design. Worksheet generator UI is Phase 4.

## Next recommended build step
**Phase 4 — Tutor Dashboard MVP** (per `TUTOR_MVP_SPEC.md`): tutor's assigned
students, lesson prep from mastery/mistakes, lesson notes, homework assignment
(reuse `POST /api/assignments` with `assignedByRole: 'tutor'`), availability,
certification — all scoped to the **tutor workspace**, isolated from teacher data.
Write `docs/dev/tutor-dashboard-mvp-notes.md`.
