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
`npm run seed:science` imports the MOE-aligned legacy bank at `data/p6Science.json` into the
shared core: Subject(Science) · **44 Topics** spanning **Primary 3–6** (3 P3 / 7 P4 / 14 P5 /
20 P6) · 44 Skills (one per topic) · **~2,600 questions** (all open-ended, with `keyPoints`
derived from the legacy `keywords` field driving partial-credit marking via
`utils/answerCheck.js → checkKeyPoints()`). Idempotent on `source: 'legacy-bank'`; the seed also
removes the earlier 5-topic placeholder set (Cycles / Systems / Energy / Interactions / Diversity)
so the module surface shows only the real curriculum.

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

## Topic-level sessions
The session start (`POST /api/practice/sessions`) accepts `topicId` and resolves it to all skills
under the topic. With the legacy-bank import there's one Skill per Topic (so a topic session
draws from that skill's ~60-question pool) — but `utils/worksheetGen.js → selectSimilarQuestions`
also round-robins across skill buckets, so any multi-skill caller (rule-based worksheet generator
on weak-skills / recent-mistakes modes) still gets balanced selection instead of one bucket
dominating.

## Adult-role surfaces (shipped)
- **Parent** — `pages/parent/ChildScience.jsx` (mastery + by-topic + recent mistakes), plus a Science
  block on the parent home per-subject breakdown. Parent `AssignPractice` and `WorksheetSetup` both
  expose Science.
- **Tutor / Teacher** — `components/StudentSciencePanel.jsx` on `TutorStudentProfile.jsx` and
  `TeacherStudentDetail.jsx`. Class-level Science aggregate on `pages/teacher/ClassOverview.jsx`
  (backend: `GET /api/teacher/classes/:id` returns a `science` block). `ClassMasteryMap.jsx` has a
  Math/Science toggle (backend: `GET /api/teacher/classes/:id/mastery?subject=…`); same-name
  Science topics across levels are disambiguated with a `· P5` style suffix from `topic.moeLevel`.
- **Assign Science practice** — Parent `AssignPractice`, Tutor `AssignHomework`, and Teacher
  `AssignPractice` all accept `module: 'Science Adaptive Revision'` + `subject: 'Science'`;
  `/api/skills?subject=science` is reshaped via `frontend/src/utils/scienceCatalog.js` into the
  same `{ topicId, name, skills }` form math uses (with the MOE level suffixed onto each topic
  name so duplicates across P3–P6 stay distinguishable).

## Content layers (notes / lessons / diagrams)
The new `/student/science` module surfaces three content layers extracted from the legacy
standalone Science Lab and exposed via `routes/science.js`:
- **Topic mind-maps** (`data/scienceNotes.json`, 20 unique topic names) → rendered by
  `ScienceTopicNotes.jsx` as a nested tree parsed from the Mermaid `graph LR` source.
- **Structured lessons** (`data/scienceLessons.json`, 1 curated lesson for Human Impact and
  Environment) → page-by-page reader in `ScienceTopicLesson.jsx`. Topics without a curated lesson
  fall back to an auto-built lesson assembled from their questions.
- **Inline SVG diagrams** (`data/scienceDiagrams.json`, 76 SVGs) joined per question via
  `data/scienceQuestionDiagrams.json` (94 question→diagram mappings).

`scripts/extractScienceContent.mjs` re-extracts all four JSONs from the legacy HTML.
`scripts/scienceCoverageReport.mjs` writes `docs/dev/science-content-coverage.md` — the
**per-topic authoring backlog** sorted worst-covered first.

## Personal study notes
`POST/GET /api/science/student-notes` + `models/StudentNote.js` — sticky notes keyed by concept
heading (legacy convention), embedded in each lesson page via `NoteWidget.jsx`. Listing page at
`/student/science/notes`.

## Mistake-to-Mastery (Mastery Worksheet) for Science
The rule-based worksheet generator (`utils/worksheetGen.js`, `routes/worksheetsGen.js`) is now
subject-aware:
- `resolveSkills` accepts `subject` and filters `Mistake` by `module: 'Science Adaptive Revision'`
  on `recent_mistakes`, and `MasteryRecord` by `subject: 'Science'` on `weak_skills`. Math callers
  on the default subject stay unchanged.
- The Worksheet doc persists `subject`; when assigned, the Assignment carries it too.
- `routes/practice.js` recognises a `Mastery Worksheet` assignment whose linked Worksheet has
  `subject='Science'` and sets `sessionFeature='Science Adaptive Revision'` so the
  `sessionModule` regex buckets attempts under Science.
- Parent `WorksheetSetup` has a Math/Science toggle above the mode selector; the catalog reloads
  on subject switch and the selected skill resets to avoid cross-subject leakage.

## What remains incomplete
- No AI marking for Science open-ended answers (still keyword-based — see "Science answer checking
  rules (MVP)" above).
- No Science-specific photo worksheet generator (the AI photo flow at `routes/worksheets.js` is
  still hard-wired to Math).
- Tutor/Teacher worksheet visibility on per-student pages — parents see + assign worksheets, but
  tutors and teachers can't yet see what's been generated for a student.
- Lesson coverage is thin: only **1 of 44** topic+level pairs has a structured lesson, and only
  **94 of 2,600** questions carry an inline diagram (see the coverage report). One topic (P6
  Reproductive System) has no mind map either.

## Commands
```bash
npm run seed:foundation             # if not already seeded
npm run seed:science                # Science subject/topics/skills/questions
node scripts/extractScienceContent.mjs       # re-extract notes/lessons/diagrams from legacy HTML
node scripts/scienceCoverageReport.mjs       # regenerate the authoring-backlog report
npm run dev                         # backend
npm --prefix frontend run dev
cd frontend && npx vite build       # build check (passes)
```

## Next recommended build step
The "must-fix" wiring items from earlier passes have all landed (per-student panels, class
overview, class mastery map, assign flows for all three adult roles, Mistake-to-Mastery for
Science). Highest-impact remaining work, in rough priority order:
1. **Tutor + Teacher worksheet visibility** — tutors and teachers can assign worksheets but
   can't yet see what's been generated for a student. Drop a Worksheet list onto
   `TutorStudentProfile.jsx` and `TeacherStudentDetail.jsx`.
2. **Authoring backlog** — see `docs/dev/science-content-coverage.md`. Top priorities:
   - A mind map for **P6 Reproductive System** (the only topic+level pair with no curated
     content at all today). Add it to `data/scienceNotes.json` (keyed by topic name; one map
     covers all levels of the same topic).
   - A second structured lesson — Adaptations for Survival or Forces and Motion are the highest-
     volume P6 topics that would benefit. Add to `data/scienceLessons.json`.
   - Raise diagram coverage on Adaptations for Survival, Diversity and Classification, Heat,
     Light, Matter — all have <5% of questions illustrated today.
3. **AI marking for Science open-ended answers** — replace the keyword-match `checkKeyPoints`
   path with an LLM-judged version (Haiku → Sonnet escalation, same pattern as the photo
   worksheet flow) so partial-credit feedback is more reliable.
