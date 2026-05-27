# LifeLab — Wiring Notes (Secondary module finish)

> LifeLab is a **secondary** Tian OS module: real-life **Math & Science** applied
> activities (`subject` = Math | Science only). A teacher assigns a library activity
> to a class; students complete it with a data + reflection response; the teacher
> reviews and gives feedback. It reuses the shared `LifeLabActivity` /
> `LifeLabSubmission` collections — it does not touch MathPath.

## What already existed
- **Backend** (`routes/lifelab.js`, mounted at `/api/lifelab`): `GET /activities`
  (library), `POST /assign` (teacher), `GET /submissions?classId=` (teacher),
  `POST /submissions/:id/feedback` (teacher), `GET /me` (student),
  `POST /submissions/:id/submit` (student). Models `LifeLabActivity` /
  `LifeLabSubmission`.
- **Frontend** that was already built but **not fully reachable**:
  - `pages/student/StudentLifeLab.jsx` — assigned activities + submit form, wired
    at `/student/lifelab` (working).
  - `pages/teacher/LifeLab.jsx` — a **class-scoped** assign + review screen
    (`useParams id`, `ClassNav`), and `ClassNav` already listed a **LifeLab tab**
    at `/teacher/classes/:id/lifelab` — but **no route existed for it**, so the tab
    404'd.
  - `lifelabAPI` was already complete in `services/api.js`.

## What this change adds (the finish)
- **Route `/teacher/classes/:id/lifelab` → `TeacherLifeLab`** — fixes the broken
  ClassNav tab so the per-class assign/review screen actually opens.
- **`pages/teacher/LifeLabHome.jsx`** — a class picker for the top-level
  `/teacher/lifelab` nav entry (was a `Placeholder`); each class links to its
  per-class LifeLab tab.
- **`scripts/seedLifeLab.js` + `npm run seed:lifelab`** — 6 library activities
  (3 Math, 3 Science) so the assign dropdown and student flow have real content.
  Idempotent (matched by title). **Run this** so teachers have activities to assign.
- **Dashboard tile** `lifelab` flipped `soon → live` in `config/modules.js` (the
  student page works); it appears under "Your modules".

## Data flow
users / roles / workspaces / students unchanged. `LifeLabSubmission` is
workspace-scoped and carries `assignedByUserId` + `classId`; teacher endpoints
require a **teacher** workspace and verify class ownership. Student submit re-checks
access via `resolveStudent`. No mastery/mistake records are written (LifeLab is
reflective, not auto-marked).

## What remains incomplete / TODO
- **Run the seed** (`npm run seed:lifelab`) in each environment — the library is
  empty until then.
- Evidence upload is a placeholder URL only (no media pipeline).
- Teacher creation of **workspace-scoped** activities (only the seeded library is
  assignable today).
- Assign to a **group** or **single student** is supported by the API
  (`target.type` = group | student) but the teacher UI only offers "assign to class".
- Parent visibility of a child's LifeLab activities is not built.

## Commands
```bash
npm run seed:foundation && npm run seed:teacher   # users, workspace, a class + roster
npm run seed:lifelab                              # the activity library
npm run dev                                        # backend
npm --prefix frontend run dev                      # then /teacher/lifelab and /student/lifelab
```

## Manual test steps
1. Teacher: sidebar **LifeLab** → pick a class → assign an activity to the class.
2. Student (in that class): Dashboard → **LifeLab** (now live) → Start activity →
   record data + reflection → Submit.
3. Teacher: class **LifeLab** tab → the submission appears → Give feedback →
   status becomes "reviewed".
4. Student: feedback shows on the activity card.
