# LifeLab Existing Implementation Audit

Audit date: 2026-06-09
Scope: All LifeLab code across frontend, backend, models, data, and scripts.

---

## 1. File Inventory

### 1.1 Backend

| File | Purpose | Status |
|---|---|---|
| `models/LifeLabActivity.js` | Activity schema (library + workspace-scoped) | Implemented |
| `models/LifeLabSubmission.js` | Student submission schema (assigned, submitted, reviewed) | Implemented |
| `routes/lifelab.js` | Express router: activity library, assign, submit, feedback, student/parent views | Implemented |
| `scripts/seedLifeLab.js` | Idempotent seeder for library activities | Implemented |
| `data/lifelabSampleActivities.js` | 4 sample activities (2 Math, 2 Science) | Implemented |
| `middleware/featureGate.js` | Server-side feature gate (blocks LifeLab when flag is off) | Implemented |
| `config/featureFlags.js` | Backend flag: `lifelab: process.env.FEAT_LIFELAB === '1'` | Implemented, **disabled by default** |

### 1.2 Frontend Pages (Functional, DB-Backed)

| File | Purpose | Status |
|---|---|---|
| `frontend/src/pages/student/StudentLifeLab.jsx` | Student view: assigned activities, submit data + reflection | Implemented |
| `frontend/src/pages/parent/ChildLifeLab.jsx` | Parent read-only view: child's activities + competency growth | Implemented |
| `frontend/src/pages/teacher/LifeLabHome.jsx` | Teacher landing: class picker for LifeLab | Implemented |
| `frontend/src/pages/teacher/LifeLab.jsx` | Teacher per-class: assign activities, review submissions, give feedback | Implemented |

### 1.3 Frontend Components (LifeLabLayout -- Prototype/Standalone)

| File | Purpose | Status |
|---|---|---|
| `frontend/src/components/LifeLab/LifeLabLayout.jsx` | Screen router for standalone LifeLab SPA (library, detail, assign, submit, review, class, parent, tutor) | Prototype -- NOT wired to DB-backed routes |
| `frontend/src/components/LifeLab/screens/LibraryScreen.jsx` | Activity library browser; fetches `/api/lifelab/templates` (endpoint does not exist) | Stub/prototype |
| `frontend/src/components/LifeLab/screens/DetailScreen.jsx` | Activity detail view with tabs (About, Steps, Materials) | Prototype UI only |
| `frontend/src/components/LifeLab/screens/AssignScreen.jsx` | Assignment form; POSTs to `/api/lifelab/assign/:templateId` (endpoint does not exist) | Stub/prototype |
| `frontend/src/components/LifeLab/screens/SubmissionScreen.jsx` | Student submission form; fetches `/api/lifelab/templates/:id`, POSTs to `/api/lifelab/submission/:id` (endpoints do not exist) | Stub/prototype |
| `frontend/src/components/LifeLab/screens/ReviewScreen.jsx` | Teacher review form with hardcoded AI insights placeholder | Stub/prototype |
| `frontend/src/components/LifeLab/screens/ClassOverviewScreen.jsx` | Class overview; fetches `/api/lifelab/class/class_id/overview` (endpoint does not exist, hardcoded class_id) | Stub/prototype |
| `frontend/src/components/LifeLab/screens/ParentViewScreen.jsx` | Parent assignment list; fetches `/api/lifelab/assignments?role=parent` (endpoint does not exist) | Stub/prototype |
| `frontend/src/components/LifeLab/screens/TutorViewScreen.jsx` | Tutor dashboard; fetches `/api/lifelab/assignments?role=tutor` (endpoint does not exist) | Stub/prototype |
| `frontend/src/components/LifeLab/E21ccTags.jsx` | E21CC competency badge component (primary gold, secondary outline) | Implemented |
| `frontend/src/components/LifeLab/CompetencyGrowth.jsx` | Competency progress bars from completed activities | Implemented |
| `frontend/src/components/LifeLab/Icon.jsx` | Icon component for LifeLab screens | Implemented |
| `frontend/src/components/LifeLab/LifeLab.css` | Styling for LifeLab prototype screens | Implemented |

### 1.4 Frontend Services

| File | Lines | Purpose |
|---|---|---|
| `frontend/src/services/api.js` | 187-195 | `lifelabAPI` object: `activities()`, `assign()`, `submissions()`, `feedback()`, `competencies()`, `me()`, `child()`, `submit()` | Implemented, calls real `/api/lifelab/*` endpoints |

---

## 2. Implementation Status

### 2.1 What Works (DB-Backed Flow)

The following end-to-end flow is fully implemented with real data persistence:

1. **Seed library**: `node scripts/seedLifeLab.js` populates 4 sample activities (`isLibrary: true`).
2. **Browse activities**: `GET /api/lifelab/activities` returns library activities, filterable by subject and competency.
3. **List competencies**: `GET /api/lifelab/competencies` returns distinct E21CC competencies across all activities.
4. **Assign to class**: `POST /api/lifelab/assign` -- teacher assigns an activity to a class/group/student; creates `LifeLabSubmission` records with `status: 'not_started'`.
5. **Student view**: `GET /api/lifelab/me` -- returns student's assigned activities with competency stats.
6. **Student submit**: `POST /api/lifelab/submissions/:id/submit` -- student submits `dataRecorded`, `reflectionResponse`, `evidenceUrl`; status becomes `submitted`.
7. **Teacher review submissions**: `GET /api/lifelab/submissions?classId=X` -- returns all submissions for a class.
8. **Teacher feedback**: `POST /api/lifelab/submissions/:id/feedback` -- teacher provides feedback; status becomes `reviewed`.
9. **Parent view**: `GET /api/lifelab/student/:studentId` -- returns child's submissions + competency growth.
10. **Competency tracking**: `buildCompetencyStats()` in `routes/lifelab.js` aggregates E21CC competencies from completed activities.

### 2.2 What is Stub/Prototype (LifeLabLayout Screens)

The `LifeLabLayout` component and its `screens/` directory represent an earlier or parallel prototype that is NOT wired to the functional backend. These screens:

- Fetch from endpoints that **do not exist** on the server:
  - `GET /api/lifelab/templates` (LibraryScreen)
  - `GET /api/lifelab/templates/:id` (SubmissionScreen)
  - `POST /api/lifelab/assign/:templateId` (AssignScreen)
  - `POST /api/lifelab/submission/:id` (SubmissionScreen)
  - `POST /api/lifelab/submission/:id/review` (ReviewScreen)
  - `GET /api/lifelab/assignments?role=parent` (ParentViewScreen)
  - `GET /api/lifelab/assignments?role=tutor` (TutorViewScreen)
  - `GET /api/lifelab/class/class_id/overview` (ClassOverviewScreen, hardcoded class_id)
- Use a different data shape (`template` with `tone`, `level_tags`, `use_case_tags`, `learn_goals`, `what_to_do`, `what_to_submit`, `common_mistake`, `tip`, `data_fields`, `reflection_questions`) vs the actual `LifeLabActivity` model.
- Include hardcoded UI elements (e.g., "AI Generated Insights" in ReviewScreen with static text).
- The `LifeLabLayout` is rendered at the route `/lifelab` behind `FeatureGuard feature="lifelab"`.

---

## 3. Feature Flag Status

### 3.1 Backend

File: `config/featureFlags.js:16`

```js
lifelab: process.env.FEAT_LIFELAB === '1',
```

**Disabled by default.** Must set `FEAT_LIFELAB=1` in environment to enable.

The server mounts LifeLab routes behind `featureGate({ feature: 'lifelab', minVersion: 'v0.6' })` (`server.js:164`). Since `TIANOS_VERSION` defaults to `v0.1`, neither the flag nor the version gate passes -- LifeLab API endpoints return 404 in production.

### 3.2 Frontend

File: `frontend/src/config/featureFlags.js:33`

```js
lifelab: flagEnabled('LIFELAB'),
```

**Disabled by default.** Must set `VITE_ENABLE_LIFELAB=true` or `ENABLE_LIFELAB=true` to enable.

### 3.3 Route Guarding

File: `frontend/src/App.jsx`

| Route | Guard |
|---|---|
| `/lifelab` | `FeatureGuard feature="lifelab"` -> LifeLabLayout (prototype) |
| `/student/lifelab` | `FeatureGuard feature="lifelab"` -> StudentLifeLab (functional) |
| `/parent/children/:studentId/lifelab` | `FeatureGuard feature="parent"` -> ChildLifeLab (functional) |
| `/teacher/classes/:id/lifelab` | `RoleGuard role="teacher"` + `FeatureGuard feature="teacher"` -> TeacherLifeLab (functional) |
| `/teacher/lifelab` | `RoleGuard role="teacher"` + `FeatureGuard feature="teacher"` -> TeacherLifeLabHome (functional) |

Note: The student/teacher/parent LifeLab pages are behind the `lifelab`, `parent`, or `teacher` feature flags respectively. Parent and teacher flags are enabled by default; the `lifelab` flag (for the prototype SPA) is not.

---

## 4. API Endpoints

All mounted at `/api/lifelab` behind the feature gate.

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/activities` | `protect` | Any | List library activities; optional `?subject=X&competency=Y` |
| GET | `/competencies` | `protect` | Any | List all distinct E21CC competencies |
| GET | `/student/:studentId` | `protect` | Any (access checked via `resolveStudent`) | Student's submissions + competency stats |
| POST | `/assign` | `protect` + `requireWorkspace` | Teacher only | Assign activity to class/group/student |
| GET | `/submissions` | `protect` + `requireWorkspace` | Teacher only | List submissions for a class (`?classId=X`) |
| POST | `/submissions/:id/feedback` | `protect` + `requireWorkspace` | Teacher only | Give feedback on a submission |
| GET | `/me` | `protect` | Any (student self) | Current student's assigned activities |
| POST | `/submissions/:id/submit` | `protect` | Student (access checked) | Submit data + reflection response |

---

## 5. Data Models

### 5.1 LifeLabActivity

Key fields: `libraryKey`, `title`, `subject` (Math|Science), `level`, `activityType` (home|group|holiday|math_journal|parent_home), `topic`, `realLifeContext`, `learningObjectives[]`, `instructions`, `steps[]`, `materials[]`, `dataRecording`, `reflectionQuestions[]`, `evidencePrompt`, `primaryE21cc[]`, `secondaryE21cc[]`, `teacherNotes`, `isLibrary`, `workspaceId`, `createdByUserId`.

### 5.2 LifeLabSubmission

Key fields: `workspaceId`, `activityId` (ref LifeLabActivity), `studentId`, `classId`, `assignedByUserId`, `assignedByRole`, `targetType` (class|group|student), `dataRecorded`, `reflectionResponse`, `evidenceUrl`, `teacherFeedback`, `status` (not_started|submitted|reviewed).

Indexes: `(classId, activityId)`, `(studentId, status)`.

### 5.3 Seed Data

`data/lifelabSampleActivities.js` contains 4 activities:
1. **Supermarket Best Buy** (Math, Primary, parent_home) -- unit price comparison
2. **Shadow Clock** (Science, Primary, home) -- shadow tracking
3. **Commute Data Investigator** (Math, Lower Secondary, math_journal) -- travel time data handling
4. **Home Energy Audit** (Science, Lower Secondary, holiday) -- energy transfer

---

## 6. Integration Points with Tian OS

| Integration | Status |
|---|---|
| **Auth** (`protect` middleware) | Integrated -- all endpoints require authentication |
| **Workspace** (`requireWorkspace`) | Integrated -- teacher endpoints are workspace-scoped |
| **Student resolution** (`resolveStudent`) | Integrated -- parent/student access control |
| **Class model** | Integrated -- assignments link to Class, ClassStudent, StudentGroup |
| **E21CC competencies** | Implemented but standalone -- not linked to MathPath skills or the unified learning profile |
| **MathPath / Mistakes** | No integration -- LifeLab does not read from or write to mistake/mastery records |
| **Worksheet generator** | No integration |
| **Learning profile** | No integration -- LifeLab competency growth is self-contained |
| **Notifications** | Not implemented |
| **Media upload** | Not implemented -- `evidenceUrl` is a placeholder string field |

---

## 7. Gap Analysis for LifeLab Launch

### 7.1 What Exists and Works

- Backend CRUD for activities, assignments, submissions, and feedback
- Teacher can browse library, assign to class, and review student work
- Student can see assigned activities, submit data + reflection
- Parent can view child's activity status and competency growth
- E21CC competency aggregation from completed work
- Seed script for initial content
- Feature flags on both frontend and backend (clean on/off)

### 7.2 What is Missing

| Gap | Severity | Notes |
|---|---|---|
| **Content volume** | High | Only 4 seed activities; LibraryScreen hardcodes "Search 124 LifeLab activities" |
| **Media upload pipeline** | High | `evidenceUrl` is a plain string; no file upload, image storage, or preview |
| **Template/prototype API mismatch** | Medium | LifeLabLayout prototype screens expect `GET /api/lifelab/templates` and a different data shape; either the prototype must be updated to use the real API or removed |
| **Teacher activity creation** | Medium | Model supports `isLibrary: false` + `workspaceId` but no frontend UI or API endpoint for teacher-created activities |
| **Group/student targeting UI** | Medium | Backend supports `target.type: 'group'|'student'` but the teacher UI (`LifeLab.jsx`) only assigns to entire class |
| **Due dates** | Low | Not in the model or DB-backed flow; only in the prototype AssignScreen |
| **Difficulty levels** | Low | Not in the model; only in the prototype AssignScreen |
| **Notifications** | Medium | No push/email when activity is assigned or feedback is given |
| **AI review insights** | Low | ReviewScreen has hardcoded "AI Generated Insights" placeholder; no actual AI pipeline |
| **Analytics dashboard** | Medium | No teacher/admin analytics for activity completion rates, competency coverage, or submission quality |
| **Learning profile integration** | Medium | E21CC competency growth is isolated; does not feed the unified student learning profile |
| **Tutor view** | Low | TutorViewScreen is prototype-only; no DB-backed tutor route exists |
| **Rubric/scoring** | Medium | No scoring model; teacher feedback is freetext only |
| **Version gate** | Info | Backend requires `v0.6` to pass version gate; current version is `v0.1`. Must either bump version or set `FEAT_LIFELAB=1` |

### 7.3 Recommendation

The DB-backed flow (student pages, teacher pages, parent page, `routes/lifelab.js`) is functional and could ship behind a feature flag for early testing with:
1. More seed content (target: 20-30 activities across Math + Science levels).
2. Enabling `FEAT_LIFELAB=1` for pilot workspaces.
3. Either removing or reconciling the prototype `LifeLabLayout` screens.

The prototype `LifeLabLayout` and its `screens/` should be treated as a design reference, not production code. It calls non-existent endpoints and uses a different data shape than the real models.
