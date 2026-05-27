# Dev notes — Spelling Practice wiring (Phase 6)

Source of truth: `docs/tian-os-master-product-spec.md` + Phase 1–5 dev notes.
(The referenced `docs/dev/tian-os-implementation-audit.md` did not exist; the
codebase was used as truth.) Goal: wire **Spelling Practice** into the shared
Tian OS core as a **secondary** module — `module = Spelling Practice`,
`subject = English`, `feature = Spelling`. English = Spelling only (no reading,
comprehension, writing, grammar, cloze).

## What existed before
A full **legacy** spelling app: `models/SpellingList.js` (+ embedded words) &
`SpellingAttempt.js`, `routes/spelling.js`, `spellingAPI` in `services/api.js`,
and many pages under `frontend/src/pages/spelling/` mounted at `/spelling/*`.
That app has its **own** data system (SpellingAttempt) and is left intact.

## What was newly created (the shared-core wiring)
Rather than duplicate or rebuild, a thin Spelling experience now plugs into the
shared core and **reuses `SpellingList` as the word bank**:

- **Backend** `routes/spellingPractice.js` (`/api/spelling-practice`):
  `GET /home`, `GET /lists`, `GET /lists/:id`, `POST /sessions`,
  `POST /sessions/:id/attempts`, `POST /sessions/:id/complete`,
  `GET /sessions/:id`, `GET /mistakes`. Library lists = `SpellingList` with
  `isShared: true` (reused existing flag — no model change).
- **Shared core reused:** `PracticeSession` (module `Spelling Practice`, feature
  `Spelling`, `skillIds:[listId]`), `PracticeAttempt` (questionId = word `_id`,
  skillId = list `_id`), `Mistake` (module `Spelling Practice`), `MasteryRecord`
  via `recordAttempt(... module:'Spelling Practice', subject:'English')` keyed by
  **list id** (one mastery record per student × list).
- **`MasteryRecord` made module-aware** (additive): new `module` (default
  `MathPath`) + `subject` (default `Math`). `masteryEngine.recordAttempt` accepts
  them; `weakSkills` now filters `module: 'MathPath'`; `GET /api/mastery` and the
  MathPath mistake count filter to MathPath; `GET /api/mistakes` defaults to
  `module: 'MathPath'` (other modules pass `?module=`). **Net effect:** spelling
  mastery/mistakes never appear on MathPath screens, and MathPath stays unchanged
  (defaults preserve old behaviour; 22/22 tests still pass).
- **Seed** `scripts/seedSpelling.js` (`npm run seed:spelling`): 5 shared lists,
  50 words — P3 / P4 / P5-misspelled / Science vocab / Math vocab.
- **Frontend** `spellingPracticeAPI` + pages under `pages/student/spelling/`:
  `SpellingHome`, `WordLists`, `LearnMode`, `SelfTest`, `SpellingResults`,
  `SpellingMistakes`. Dashboard module card now points to `/student/spelling`
  and is `live` (kept visually secondary to MathPath). Routes wired in `App.jsx`.

## How Spelling uses shared Tian OS data
users / roles / workspaces / students → unchanged (student resolved via
`resolveStudent`). Sessions, attempts, mistakes, and mastery all live in the same
collections as MathPath, tagged by module. Spelling mastery thresholds inherit
the shared engine (EMA; ≥80 & ≥5 attempts → mastered, <50 → needs_review, else
learning).

## Routes added
`/api/spelling-practice/*` (backend); `/student/spelling`,
`/student/spelling/lists`, `/student/spelling/lists/:listId/learn`,
`/student/spelling/practice/:sessionId`, `/student/spelling/results/:sessionId`,
`/student/spelling/mistakes` (frontend).

## Answer checking
Exact match after trim, lowercase, and stripping edge punctuation
(`spellingCorrect` in the route). No fuzzy matching. Incorrect → a `Mistake`
(module `Spelling Practice`).

## Assignment integration
The shared `Assignment` model already supports `module: 'Spelling Practice'` /
`subject: 'English'`. Student-side launching of a spelling assignment is **not
yet wired** (assignments currently launch MathPath sessions); parent/tutor/teacher
spelling-assignment creation is deferred. Spelling self-test (list-driven) works
end to end now.

## What remains incomplete
- Audio / dictation (placeholder "Listen" button; the self-test uses a brief
  word reveal instead).
- Spelling assignment launch + parent/tutor/teacher spelling assignment creation.
- Per-word mastery (currently per-list) and a spelling-specific recommender.
- Deeper unification of the **legacy** `/spelling` app onto the shared core.

## Server fix included
`teacherRoutes` and `lifelabRoutes` were imported but **not mounted** (Phase 5
bug) — both are now mounted (`/api/teacher`, `/api/lifelab`) alongside
`/api/spelling-practice`.

## Commands
```bash
npm install
npm run seed:mathpath && npm run seed:spelling     # core math, then spelling library
npm run dev
cd frontend && npm install && npm run dev
npx vitest run   # 22 tests (math/grouping/recs/lessonprep/workspace)
```

## Test steps (manual)
1. Open Student Dashboard (`demo.student@tianos.test` / `Passw0rd!`) → Spelling
   Practice appears under "Your modules" (secondary, not louder than MathPath).
2. Open Spelling Practice (`/student/spelling`) → recommended list + accuracy.
3. Word lists → open a list → Learn mode.
4. Start self-test → a word shows briefly → "Hide & spell it".
5. Answer correctly → green; answer wrong → shows correct spelling.
6. Finish → results (score, missed words). Attempts logged (`PracticeAttempt`),
   mistakes saved (`Mistake` module Spelling), mastery updated (`MasteryRecord`
   module Spelling).
7. Misspelled words page lists the wrong ones.
8. Confirm MathPath + Science still work and show **no** spelling rows (module
   filters).

## Next recommended build step
Wire **spelling assignments** (student launch + parent/tutor/teacher creation
with `module: 'Spelling Practice'`), then revisit **LifeLab** student submit +
teacher assign/review screens (backend already built in `routes/lifelab.js`).
