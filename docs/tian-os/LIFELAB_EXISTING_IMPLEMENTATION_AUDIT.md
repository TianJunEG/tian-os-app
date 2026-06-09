# LifeLab Existing Implementation Audit

Audit date: 2026-06-10

---

## 1. Current State

LifeLab is an applied-learning module behind feature flags, **disabled by default** on both frontend and backend. It is not part of the MathPath pilot scope.

- **Frontend flag**: `VITE_ENABLE_LIFELAB` (default: off). Route guard: `<FeatureGuard feature="lifelab">`.
- **Backend flag**: `FEAT_LIFELAB === '1'` (default: off). Also version-gated to `v0.6` (current version is `v0.1`).

---

## 2. Components Found

### Backend (functional, DB-backed)

- `models/LifeLabActivity.js` -- activity schema (library + workspace-scoped)
- `models/LifeLabSubmission.js` -- student submission schema (not_started, submitted, reviewed)
- `routes/lifelab.js` -- Express router with CRUD for activities, assignments, submissions, feedback
- `data/lifelabSampleActivities.js` -- 4 sample activities (2 Math, 2 Science)

### Frontend pages (functional, call real API)

- `pages/student/StudentLifeLab.jsx` -- student assigned activities view
- `pages/parent/ChildLifeLab.jsx` -- parent read-only view of child's activities
- `pages/teacher/LifeLab.jsx` -- teacher per-class assignment and review
- `pages/teacher/LifeLabHome.jsx` -- teacher landing with class picker

### Frontend components (prototype, NOT wired to real API)

- `components/LifeLab/LifeLabLayout.jsx` -- standalone screen router with 8 sub-screens
- `components/LifeLab/screens/` -- LibraryScreen, DetailScreen, AssignScreen, SubmissionScreen, ReviewScreen, ClassOverviewScreen, ParentViewScreen, TutorViewScreen
- These prototype screens call endpoints that **do not exist** on the server (`/api/lifelab/templates`, etc.)

### Routes in App.jsx

- `/lifelab` -> LifeLabLayout (prototype), guarded by `lifelab` flag
- `/student/lifelab` -> StudentLifeLab, guarded by `lifelab` flag
- `/parent/children/:studentId/lifelab` -> ChildLifeLab, guarded by `parent` flag
- `/teacher/classes/:id/lifelab` -> TeacherLifeLab, guarded by `teacher` flag
- `/teacher/lifelab` -> TeacherLifeLabHome, guarded by `teacher` flag

---

## 3. Student-Facing Content

- Only 4 seeded library activities exist. No student-facing interactive content or activities beyond form submission.
- No media upload pipeline (evidence URL is a plain string field).
- E21CC competency tracking is self-contained; not connected to the MathPath learning profile.

---

## 4. Known Issue: Nav Tab Exposure

`ClassNav.jsx` and `ChildNav.jsx` hardcode a "LifeLab" tab visible to all teachers and parents regardless of the `lifelab` feature flag. Since teacher/parent flags are on by default, clicking the tab loads the page but API calls return 404 (backend gate is off). This results in an empty or errored state during the MathPath pilot.

**Recommendation**: Wrap LifeLab nav tabs in a `FEATURE_FLAGS.lifelab` check or remove until LifeLab is enabled.

---

## 5. Recommendation

Keep LifeLab behind its feature flag until:

1. **Content volume** reaches 20-30 activities (currently 4).
2. **Prototype cleanup**: Reconcile or remove the `LifeLabLayout` prototype screens that call non-existent endpoints.
3. **Design system integration**: Ensure LifeLab pages use the shared design tokens and visual mode system.
4. **Student profile integration**: Connect E21CC competency growth to the unified learning profile.
5. **Nav tab fix**: Gate the LifeLab tabs in `ClassNav` and `ChildNav` behind the feature flag.

---

## 6. Dependencies for Launch

| Dependency | Status |
|---|---|
| Design system (teal palette, visual modes) | Available but not integrated |
| Student profile (badges, timeline) | Available but not connected |
| Auth + workspace scoping | Integrated |
| `resolveStudent()` access control | Integrated |
| Media upload pipeline | Not implemented |
| Notification system | Not implemented |
