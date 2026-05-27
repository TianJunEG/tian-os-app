# Dev notes — Phase 2: MathPath MVP

Source of truth: `docs/tian-os-master-product-spec.md` + Phase 1
(`docs/dev/phase1-foundation-notes.md`). Scope: a working MathPath loop — open →
recommended skill → practice (one question at a time) → feedback → attempts
logged → mastery updated → mistakes saved → dashboard reflects progress.

## What was implemented

**Backend (Express + Mongoose):**
- `models/Question.js` — shared question bank (subject/topic/skill/MOE/difficulty,
  `type: mcq | short_answer`, stem, choices, answer, workedSolution,
  misconceptionTag). Word problems are `short_answer` with a wordy stem.
- `routes/practice.js` — `POST /api/practice/sessions` (start, selects questions,
  returns items **without answers**), `POST /sessions/:id/attempts` (grades
  server-side, logs `PracticeAttempt`, updates mastery, saves a `Mistake` if
  wrong), `POST /sessions/:id/complete` (summary; completes a linked assignment),
  `GET /sessions/:id` (results).
- `routes/mastery.js` — `GET /api/mastery` (records + weak skills + recommended +
  mistake count) and **`GET /api/mastery/map`** (Math topic→skill map merged with
  the student's mastery, incl. not-started skills) for the home/topic screens.
- `routes/mistakes.js` — `GET /api/mistakes` (recent, grouped by skill),
  `GET /:id`, `POST /:id/review`.
- `utils/answerCheck.js` `isCorrect(given, expected)` — equivalent fractions
  (1/2 == 2/4 == 3/6), decimals, whole numbers, exact text/MCQ.
- `utils/masteryEngine.js` `recordAttempt()` / `weakSkills()` — the **one** place
  mastery is written.
- `utils/studentContext.js` `resolveStudent(req, id?)` — resolves the acting
  student + scopes by the student record's workspace (students aren't workspace
  members; adults must be guardian/member). Upholds the privacy boundary.
- Seeds: `scripts/seedQuestions.js` (≈15 questions/skill via
  `utils/questionTemplates.js`) and `scripts/seedFluency.js`. `npm run
  seed:mathpath` = foundation + questions + fluency.

> The backend above was authored alongside this work. My Phase-2 contribution
> added `GET /api/mastery/map` and the entire **frontend**.

**Frontend (React, inside the unified AppShell):**
- `services/api.js` → `mathpathAPI` (mastery, map, startSession, attempt,
  complete, getSession, mistakes, reviewMistake).
- `components/ui/Fraction.jsx` — `Fraction` (stacked) + `MathText` (renders bare
  `a/b` tokens in a stem as vertical fractions, per the math display rule).
- Screens under `pages/student/mathpath/`: `MathPathHome` (recommended next +
  standing + weak-topic alert + topic map), `TopicDetail`, `PracticeSession`
  (one question at a time, check → feedback → next, progress bar), `PracticeResult`
  (score, skills, mistakes, recommended next), `MistakeReview` (Mistake-to-Mastery
  + "practise similar").
- `StudentDashboard` now reads real mastery (recommended skill, mastered / to-
  review counts, weak-topic alert). `config/modules.js`: MathPath +
  Mistake-to-Mastery are `live`. Routes wired in `App.jsx`.

## How mastery is calculated (`masteryEngine.js`)
Per (student, skill) `MasteryRecord`, score 0–100 via EMA: `next = prev*(1-α) +
(correct?100:0)*α`, α = 0.5 for the first <3 attempts then 0.3. Status:
`not_started` (0 attempts) · `<50 needs_review` · `mastered` when `score ≥ 80`
**and** `attempts ≥ 5` · otherwise `learning`. Reaching `mastered` resolves the
student's open mistakes on that skill. (Verified in `utils/mathpath.test.js`.)

## How answer checking works (`answerCheck.js`)
Server-side only (the client never receives the answer until after Check).
Equivalent fractions match via gcd-normalisation; decimals/whole numbers via
numeric compare (`1e-9` tol); everything else by case-insensitive exact/MCQ.

## What is mocked / simplified
- Practice **items are passed via React Router navigation state** when a session
  starts. A hard refresh on the practice page loses them and redirects to the
  MathPath home (no "resume session" endpoint yet).
- Questions have no dedicated `hint` field, so the practice screen shows no hint
  button (it renders only if hint data exists). Worked solutions show after Check.
- Mistake `mistakeType` is recorded as `unknown` (no auto-classification yet).
- Recommendation is rule-based (lowest-scoring weak skill, else first record).

## Commands
```bash
npm install
npm run seed:mathpath          # foundation + question bank + fluency
npm run dev                    # API :5001
cd frontend && npm install && npm run dev
npx vitest run utils/mathpath.test.js middleware/workspace.test.js   # 10 tests
```

## Test steps (manual)
1. Seed, log in as `demo.student@tianos.test` (`Passw0rd!`).
2. Dashboard `/student` → "Open MathPath".
3. MathPath home shows recommended skill + topic map → "Start recommended practice".
4. Answer correctly → green feedback; answer wrong → shows correct answer + worked solution.
5. Finish → results page (score, skills, mistakes, recommended next).
6. Re-open MathPath → mastery counts/recommendation have moved; dashboard reflects it.
7. "Review mistakes" → Mistake-to-Mastery list → "Practise similar questions".

## Known limitations
- No session resume (see navigation-state note). No timed fluency UI yet (data
  model supports `mode: 'fluency'`). MathPath scoped to the logged-in student;
  adult preview via `?studentId=` is supported by the API but not surfaced.

## Next recommended build step
**Phase 3 — Assignments + Parent Dashboard MVP** (Math only): finalise assignment
creation (parent → student), the student assignment flow (launch MathPath from an
assignment; completion updates status + score), parent child screens reading the
same mastery/mistake data, and rule-based parent recommendations. Write
`docs/dev/parent-assignments-mvp-notes.md`.
