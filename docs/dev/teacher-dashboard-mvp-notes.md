# Dev notes — Phase 5: Teacher Dashboard MVP

Source of truth: `docs/tian-os-master-product-spec.md`, `TEACHER_MVP_SPEC.md`, and
the Phase 1–4 dev notes. Goal: a teacher views classes, scans class mastery,
inspects students, groups students for remediation, assigns practice
(class/group/student), tracks interventions, and generates a simple report —
**teacher-workspace scoped**, reusing the shared mastery engine. Built as a
"smart teaching assistant", not a school admin system.

## What was implemented

**Backend (new, teacher-workspace scoped):**
- Models: `Class`, `ClassStudent`, `StudentGroup`, `InterventionRecord`.
- `routes/teacher.js` (`/api/teacher`, `protect` + `requireWorkspace` + asserts
  `workspaceRole === 'teacher'`): `GET /home`, `GET /classes`,
  `GET /classes/:id` (overview), `GET /classes/:id/mastery` (topic × status grid
  + affected students), `GET /classes/:id/students`, `GET /students/:id`
  (enrolment-checked), `GET|POST /classes/:id/groups`, `POST /classes/:id/assign`
  (class/group/student → one `Assignment` per student, `assignedByRole: teacher`),
  `GET|POST /classes/:id/interventions`, `PUT /interventions/:iid`,
  `GET /classes/:id/reports`.
- `utils/teacherGrouping.js` — pure `buildSuggestedGroups()` (buckets students by
  shared weakest skill < 40). Unit-tested.
- `scripts/seedTeacher.js` (`npm run seed:teacher`): a P5 Foundation Math class,
  8 students with a mastery spread (3 weak on the first skill), mistakes, and one
  intervention.

**Frontend (teacher role in the unified shell):**
- `teacherAPI` client. Pages under `pages/teacher/`: `TeacherHome`, `Classes`,
  `ClassOverview`, `ClassMasteryMap` (stacked status bar per topic, tap to reveal
  affected students), `ClassStudents`, `TeacherStudentDetail`, `Grouping`
  (suggested + saved + assign), `AssignPractice` (class/group target),
  `Intervention` (inline status update), `Reports` (on-screen preview). Shared
  `ClassNav` tab header + `useClass` hook. LifeLab is a light placeholder
  (secondary per spec). Routes wired in `App.jsx`; teacher nav simplified
  (Home · Classes · LifeLab).

## Class mastery logic (in `routes/teacher.js`)
Reuses `MasteryRecord` (the shared engine — no parallel calculation). Class
overall = mean of student×skill scores. Per topic, each student is rolled up to a
topic status: any `needs_review` skill → **Needs support**; all `mastered` →
**Mastered**; some practice → **Learning**; no records → **Not started**. The
mastery map returns per-topic counts + the list of needs-support students.

## Grouping logic (`utils/teacherGrouping.js`)
Deterministic: each student's weakest skill below 40 buckets them into a
"<skill> Support Group" (max 8), largest groups first. Teacher saves a suggested
group (→ `StudentGroup`), then assigns practice to it. (Tested.)

## Assignment integration
`POST /api/teacher/classes/:id/assign` resolves the target (whole class roster /
saved group / individual) and creates one `Assignment` per student with
`assignedByRole: 'teacher'` in the teacher workspace. These show on the student's
assignments + the teacher's student detail, and complete via the same MathPath
flow as Phases 3–4.

## Role / workspace privacy
- All teacher routes require an active **teacher** workspace the user owns/belongs
  to; `requireWorkspace` blocks other workspaces (verified in
  `middleware/workspace.test.js`). Class queries are filtered by
  `teacherUserId + workspaceId`; student detail requires class enrolment in the
  workspace. **Private-tutor data is never reachable here**, and the dual-role
  user switches workspace to move between the two isolated data sets.

## What is mocked / simplified
- **LifeLab** (assign + submissions) is deferred to a later pass — it is secondary
  per the master spec; a light placeholder page is in place.
- Reports render on-screen only (export/share is a disabled placeholder).
- Intervention status is teacher-set (not auto-derived from mastery yet).
- Assign picker reads the topic/skill catalog via the first class student's map.

## Commands
```bash
npm install
npm run seed:mathpath && npm run seed:teacher    # core math data, then the class
npm run dev
cd frontend && npm install && npm run dev
npx vitest run utils/teacherGrouping.test.js utils/tutorLessonPrep.test.js utils/parentRecommendations.test.js utils/mathpath.test.js middleware/workspace.test.js   # 22 tests
```

## Test steps (manual)
1. Log in `demo.teacher@tianos.test` (`Passw0rd!`) → `/teacher`: class count +
   classes needing attention → "Review class needs".
2. Classes → open **P5 Foundation Math** → overview (weak topics, students
   needing support).
3. Mastery map → tap the weak topic → see affected students → "Create groups".
4. Groups → save a suggested support group → "Assign group practice".
5. Assign → pick skill → Assign (creates assignments per group student).
6. Intervention → update a student's status.
7. Reports → switch type → on-screen preview.
8. **Isolation:** `demo.dual@tianos.test` → switch to the tutor workspace; the
   teacher's classes/students are not present there.

## Next recommended build step
**Phase 6 — near-term modules:** Science Adaptive Revision, Spelling Practice
(English = Spelling only), and LifeLab (assign + submissions, incl. the teacher
LifeLab screens deferred here), reusing the shared session/mastery core. Write
`docs/dev/modules-phase6-notes.md`.
