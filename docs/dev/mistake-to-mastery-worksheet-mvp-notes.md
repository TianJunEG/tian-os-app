# Mistake-to-Mastery + Worksheet Generator + Fluency — MVP Dev Notes

Implementation notes for the Phase-2→4 vertical built on the Tian OS foundation. Covers the **shared
learning core** (question bank, practice, mastery, mistakes, assignments) and the three surfaces that
ride on it: **Mistake-to-Mastery** and **Fluency** (MathPath features) and the **Parent Worksheet
Generator**. Plan of record: [`mistake-to-mastery-worksheet-plan.md`](./mistake-to-mastery-worksheet-plan.md).
Feature-specific notes: [`mathpath-fluency-feature-notes.md`](./mathpath-fluency-feature-notes.md),
[`mathpath-mistake-to-mastery-notes.md`](./mathpath-mistake-to-mastery-notes.md).

## What was implemented

**Shared backend (one core — no per-feature data system):**
- `models/Question.js` — the shared question bank (subject/topic/skill refs, difficulty, type
  `mcq|short_answer`, stem, choices, answer, workedSolution, misconceptionTag).
- Extended `models/Mistake.js` — review status: `status (open|reviewed|resolved)`, `reviewedAt`,
  `reviewedByUserId`, `reviewSource (student|parent|tutor|teacher)`, `misconceptionTag`, and a
  question snapshot (`questionStem`, `workedSolution`).
- Extended `models/Worksheet.js` — structured generation fields (`workspaceId`, `generatedByUserId/Role`,
  `sourceMode`, `skillIds`, `topicIds`, `difficulty`, `questionCount`, `includesSolutions`,
  `includesMistakeReview`, `generatedContent` JSON, `assignedStatus`, `linkedAssignmentId`). Legacy
  photo flow untouched.
- `models/PracticeSession.js` — added `feature` (e.g. `'Fluency Practice'`, `'Mistake-to-Mastery'`).
- `utils/masteryEngine.js` — the **only** writer of `MasteryRecord` (EMA score, status derivation;
  resolves mistakes when a skill is mastered). `utils/answerCheck.js` — shared checker (whole/decimal/
  equivalent-fraction). `utils/worksheetGen.js` — similar-question selection + 3-mode assembly.
  `utils/questionTemplates.js` — rule-based Math question generation. `utils/studentContext.js` —
  resolves the acting Student (student-by-login or adult-by-guardianship/membership).
- Routes: `routes/practice.js` (start/attempt/complete/get), `routes/mistakes.js` (list/get/review),
  `routes/mastery.js` (`/` + `/map`), `routes/assignments.js`, `routes/skills.js` (+`group=fluency`),
  `routes/worksheetsGen.js` (`/worksheets/gen/*`, mounted before legacy `/worksheets`).
- Seeds: `scripts/seedQuestions.js` (Math bank) + `scripts/seedFluency.js` (Number Fluency topic).

**Frontend (reuses the existing `components/ui` + `mathpathAPI` — no parallel design system):**
- Fluency: `pages/student/mathpath/fluency/FluencyHome.jsx`, `FluencySkills.jsx`.
- Mistake-to-Mastery: `pages/student/mathpath/MistakesHome.jsx`, `MistakeDetail.jsx` (+ existing
  `MistakeReview.jsx` now at `/mistakes/review`).
- Parent worksheets: `pages/parent/{WorksheetHome,WorksheetSetup,WorksheetPreview}.jsx`.
- Fluency & M2M practice/results **reuse the shared** `PracticeSession`/`PracticeResult` screens
  (the practice flow lives in one place).
- API: `skillsAPI`, `worksheetGenAPI` added; practice/mistakes/mastery use the existing `mathpathAPI`.
- Routes wired in `App.jsx` under the unified shell; `config/modules.js` marks Fluency + Mistakes `live`.

## What is mocked / simplified
- **Question generation is rule-based** (templates per skill keyword + numeric fallback), not authored
  or AI. ~15 Qs/skill.
- **Mistake type** defaults to `unknown` on capture (no AI diagnosis); it can be set on review.
- **PDF export is a placeholder** — "Print / Export" uses the browser print dialog (no PDF lib is
  installed anywhere; confirmed). Worksheets store **structured content**, never PDF-only.
- **Similar-question selection** is rule-based (same skill, near difficulty, deprioritise recently seen,
  dedupe) — no semantic AI similarity.
- Practice items passed via router state, so a hard refresh on a practice URL returns to the feature home.

## Worksheet generation modes (`utils/worksheetGen.js`)
- `recent_mistakes` — skills behind recent unresolved mistakes, weighted by frequency; optional review section.
- `weak_skills` — lowest-mastery skills (`needs_review|learning|not_started`).
- `selected_topic` — parent-chosen skill(s)/topic.

## Mastery update logic (`utils/masteryEngine.recordAttempt`)
EMA score (α 0.5 early, 0.3 later); status: `not_started → learning → mastered` (≥80 & ≥5 attempts) or
`needs_review` (<50). On mastery, related mistakes flip to `resolved` (resolution is **mastery-derived**,
not "did a worksheet").

## Mistake review logic
Wrong attempts in any practice session write a `Mistake` (skill, snapshot, misconceptionTag). Review feed
groups by skill; "Mark reviewed" sets `reviewSource`+`reviewedAt`. Practising a skill to mastery resolves it.

## Assignment integration
`POST /worksheets/gen/:id/assign` creates an `Assignment` (`module: 'Mastery Worksheet'`) and links it.
Practice sessions launched from an assignment set it `in_progress` then `completed` with a score on finish.

## Known limitations
- Math only (English = Spelling later; Science later) — by scope.
- No fluency-specific timer pressure/scoring beyond per-question time capture.
- Worksheet "answering" for students is via the assignment → practice flow; the printable sheet is for offline use.
- Two pre-existing foundation bugs were fixed to unblock seeding (see commands).

## Commands
```bash
# Seed the foundation + question bank + fluency content (idempotent):
npm run seed:mathpath          # = seed:foundation && seed:questions && seed:fluency
# or individually: npm run seed:foundation / seed:questions / seed:fluency

# Run backend + frontend:
npm run dev                    # backend (nodemon) on :5001
npm --prefix frontend run dev  # Vite frontend

# Build check:
cd frontend && npx vite build

# Backend engine sanity (no framework): see scripts/* ; API smoke via curl/login.
```
> Fixed while wiring: `User` email regex rejected `.test` TLDs, and the legacy `role` enum lacked
> `teacher` — both blocked **all** foundation seeding (DB was empty).

## Next recommended build step
Wire the **Parent dashboard → Worksheet Generator** entry point and a Student-dashboard
"mistakes to review" count card, then add **digital answering of an assigned worksheet** (run the
worksheet's `generatedContent.questions` through the shared `PracticeSession` so completion updates
mastery), and seed an **authored** question set to replace the rule-based generator for the first
1–2 topics.
