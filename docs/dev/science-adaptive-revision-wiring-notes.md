# Science Adaptive Revision — Wiring Notes

> Science Adaptive Revision is a **secondary Tian OS module** (`module = 'Science Adaptive
> Revision'`, `subject = Science`). It plugs into the **shared core** (Subject/Topic/Skill/Question +
> practice_sessions / practice_attempts / mastery_records / mistakes) — it is **not** a separate
> learning system, and it is **not** mixed into MathPath. MathPath remains the core MVP engine.

## What Science code existed before
- **Legacy/static only**: `routes/science.js` (a static topic/question quiz served from in-memory
  data), `frontend/src/pages/SciencePracticePage.jsx` (old standalone quiz at `/science`), and
  `frontend/public/science/index.html` (a static "Science Lab"). None of these used the shared
  mastery/mistake core. The unified `/student/science` was a Placeholder.
- These legacy pieces are left untouched (the marketing `/science` route still works); the new
  module lives under `/student/science/*` and uses the shared core.

## What was wired (reuse)
- **Practice / attempts / mastery / mistakes**: reuses `POST /api/practice/sessions` (+`/attempts`,
  `/complete`, `GET /:id`) with `feature: 'Science Adaptive Revision'`. The session is created with
  top-level `module: 'Science Adaptive Revision'` (derived from the feature) so its mistakes and
  mastery are tagged Science and stay isolated from MathPath.
- **Skill catalog**: `GET /api/skills?subject=science` (the route was generalised from math-only to a
  `subject` param) returns Science skills merged with the student's mastery status.
- **Shared screens**: Science practice and results **reuse** `PracticeSession` / `PracticeResult`.
  Those were parametrised (`resultsBase` / `homeBase` via nav state; results CTAs route by
  `session.module`) so a Science session returns to `/student/science`.

## What is newly created
- **Backend**: `scripts/seedScience.js` (Subject science + 5 topics + 15 skills + 30 questions).
  Extended `models/Question.js` (`open_ended` type + `modelAnswer`, `keyPoints`, `explanation`,
  `commonMistakes`). Extended `utils/answerCheck.js` with `checkKeyPoints()`. Extended the practice
  attempt route to mark open-ended answers and return model answer + missing key points.
- **Frontend**: `pages/student/science/{ScienceHome, ScienceTopics, ScienceMistakes}.jsx`; routes in
  `App.jsx`; `config/modules.js` `science` → `status: 'live'`. Open-ended answering added to the
  shared `PracticeSession` (textarea + partial-credit feedback + model answer).

## How Science uses shared Tian OS data
| Concern | Shared resource | Science specifics |
| --- | --- | --- |
| Curriculum | `Subject` / `Topic` / `Skill` | `subject.key = 'science'`; 5 topics, 15 skills |
| Questions | `Question` | adds `open_ended` + `modelAnswer`/`keyPoints` |
| Sessions | `PracticeSession` | `module: 'Science Adaptive Revision'` |
| Attempts | `PracticeAttempt` | same |
| Mastery | `MasteryRecord` | `subject: 'Science'`, keyed by Science `skillId` |
| Mistakes | `Mistake` | `module: 'Science Adaptive Revision'` (isolated from MathPath) |

## Science routes added
- `GET /api/skills?subject=science` (generalised) · practice endpoints reused as-is.
- Frontend: `/student/science`, `/student/science/topics`, `/student/science/mistakes`,
  `/student/science/practice/:sessionId`, `/student/science/results/:sessionId`.

## Science seed data added
`npm run seed:science` → Subject(Science) · topics **Cycles, Systems, Energy, Interactions,
Diversity** · 15 skills · 30 questions (MCQ + short + open-ended with key points/model answers).

## Science answer checking rules (MVP)
- **MCQ**: exact option match. **Short answer**: normalised text / numeric (shared `isCorrect`).
- **Open-ended**: keyword/key-point matching (`checkKeyPoints`). A key point may list synonyms with
  `|`. **Correct** when all key points present; **partial** when some present; otherwise incorrect.
  The model answer + missing key points are shown after submission. Partial/incorrect saves a mistake;
  only fully-correct counts toward mastery. No AI marking.

## Assignment integration status
- The shared assignment → session launch already works: an assignment with
  `module: 'Science Adaptive Revision'` launches a session via the existing student flow. Parent/
  tutor/teacher **creation** of Science assignments is not specially built yet (the generic
  `POST /api/assignments` accepts the module), so it's effectively a placeholder until those UIs add a
  Science option.

## Parent/Tutor/Teacher visibility
- Not built in this pass (per guardrails). Science mastery/mistakes are queryable via the shared
  endpoints (`?subject=science` / `?module=Science Adaptive Revision`) when those dashboards add a
  Science filter. No Science dashboards were added; MathPath dashboards are unaffected.

## What remains incomplete
- Parent/Tutor/Teacher Science views & Science assignment creation UI.
- Richer sessions (currently per-skill; a topic-level mix would need the session start to pull across
  a topic's skills). Authored question depth (2/skill).
- No AI marking, no Science worksheet generator, no diagrams (by guardrail).

## Commands
```bash
npm run seed:foundation     # if not already seeded
npm run seed:science        # Science subject/topics/skills/questions
npm run dev                 # backend
npm --prefix frontend run dev
cd frontend && npx vite build   # build check (passes)
```

## Next recommended build step
Make Science sessions **topic-level** (pull questions across a topic's skills for variety), add a
Science option to the existing Parent "Assign practice" flow (`module: 'Science Adaptive Revision'`),
and surface a read-only Science mastery row on the Parent dashboard using
`GET /api/skills?subject=science&studentId=…`.
