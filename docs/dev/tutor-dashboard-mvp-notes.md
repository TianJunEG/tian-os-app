# Dev notes — Phase 4: Tutor Dashboard MVP

Source of truth: `docs/tian-os-master-product-spec.md`, `TUTOR_MVP_SPEC.md`, and
the Phase 1–3 dev notes. Scope: let a tutor see assigned students, understand a
student from shared mastery/mistake data, prepare a lesson (rule-based), record
lesson notes, assign homework, manage availability, and view certification — all
**scoped to the tutor workspace** and isolated from teacher/parent data. **Not
built:** marketplace, public profile, ratings, payments, parent messaging, online
classroom, AI material generator, scheduling/calendar, during-lesson timer.

## What was implemented

**Backend (new, tutor-workspace scoped):**
- Models: `TutorStudentLink` (assignment of a student to a tutor in a workspace),
  `LessonNote`, `TutorAvailability`, `TutorCertification`.
- `routes/tutor.js` (mounted `/api/tutor`, distinct from the legacy marketplace
  `/api/tutors`). **Every route uses `protect` + `requireWorkspace`** and asserts
  `req.workspaceRole === 'tutor'`. Endpoints: `GET /home`, `GET /students`,
  `GET /students/:id`, `GET /students/:id/lesson-prep`,
  `GET|POST /students/:id/lesson-notes`, `GET /homework`,
  `GET|PUT /availability`, `GET /certification`. Student access is double-checked
  via `TutorStudentLink` (`requireLinkedStudent`).
- `utils/tutorLessonPrep.js` — pure `buildLessonPrep()` (focus skill + reason +
  weak topics + teaching sequence + suggested homework). Unit-tested.
- Homework reuses `POST /api/assignments` with `assignedByRole: 'tutor'`; the
  assignment's `workspaceId` is derived from the (tutor-workspace) student.
- `scripts/seedTutor.js` (`npm run seed:tutor`): 2 assigned students (Aaron, Bea)
  with mastery + mistakes, availability, certification (in_training + modules),
  and a lesson note.

**Frontend (in the unified shell, tutor role):**
- `tutorAPI` client. Pages under `pages/tutor/`: `TutorHome`, `AssignedStudents`,
  `TutorStudentProfile`, `LessonPrep`, `LessonNotes`, `AssignHomework`,
  `TutorHomework`, `Availability`, `Training` — sharing `TutorStudentNav` +
  `useTutorStudent`. Routes wired in `App.jsx`; tutor nav updated (Home ·
  Students · Homework · Availability · Training).

## Lesson-prep logic (`utils/tutorLessonPrep.js`)
Deterministic: focus = lowest-scoring attempted skill < 70; else the skill with
the most recent mistakes; else the first record. Returns reason, top-3 weak
topics, a fixed Worked → Guided → Independent → Fluency sequence, suggested
homework on the focus skill, and an overdue note. (Tested.)

## Role / workspace privacy (the important part)
- `requireWorkspace` rejects any request whose `X-Workspace-Id` the tutor is not
  an active member of → **teacher/school workspace data is unreachable** from the
  tutor surface (verified at the middleware level in `middleware/workspace.test.js`).
- Routes additionally require the active workspace to be a **tutor** workspace and
  the student to be **linked to this tutor** (`TutorStudentLink`), so one tutor
  can't see another tutor's students.
- The dual-role (teacher+tutor) user switches workspace in the topbar; switching
  swaps `X-Workspace-Id`, so the same login sees entirely separate data sets.

## Homework integration
Tutor → `AssignHomework` → `POST /api/assignments` (role `tutor`). The assignment
appears in the tutor's student profile + `/tutor/homework`. Completion uses the
same MathPath flow as Phase 3 (start session with `assignmentId` → complete →
status/score). Note: seeded tutor students are login-less child records, so
"student logs in and completes" is exercised via the Phase-3 parent/student demo;
the tutor-assigned assignment is visible + trackable in the tutor UI immediately.

## What is mocked / simplified
- No scheduling entity, so there is no Today's Lessons / during-lesson timer /
  lesson-plan builder this phase (lesson prep + notes cover the core loop).
- Parent update = `parentSummary` saved on the lesson note with
  `parentUpdateStatus: 'draft'`; not sent (no messaging yet).
- Certification is read-only demo data ("Continue training" is not wired to an
  LMS). Availability is a simple weekly slot list (no booking).

## Commands
```bash
npm install
npm run seed:mathpath && npm run seed:tutor      # foundation+questions+fluency, then tutor data
npm run dev                                       # API :5001
cd frontend && npm install && npm run dev
npx vitest run middleware/workspace.test.js utils/mathpath.test.js utils/parentRecommendations.test.js utils/tutorLessonPrep.test.js   # 19 tests
```

## Test steps (manual)
1. Log in as `demo.tutor@tianos.test` (`Passw0rd!`) → `/tutor`: students count,
   attention list, certification banner, "Prepare next lesson".
2. Students → open Aaron Lim.
3. Lesson prep → suggested focus + weak topics + sequence; "Assign" suggested HW.
4. Lesson notes → fill + Save; it appears under Past notes + on the profile.
5. Assign homework → pick skill → Assign; see it in `/tutor/homework` + profile.
6. Availability → add/edit slots → Update.
7. Training → certification status + modules.
8. **Isolation:** log in as `demo.dual@tianos.test` (teacher+tutor) → switch
   workspace in the topbar; the tutor workspace shows its own (empty/seedable)
   students, never the school workspace's data.

## Next recommended build step
**Phase 5 — Teacher Dashboard MVP** (per `TEACHER_MVP_SPEC.md`): classes, class
mastery map, student list/detail, rule-based grouping, assign practice
(class/group/student), intervention tracker, LifeLab (light), simple reports —
**teacher-workspace scoped**, reusing the shared mastery engine. Write
`docs/dev/teacher-dashboard-mvp-notes.md`.
