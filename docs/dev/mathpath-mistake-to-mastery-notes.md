# MathPath — Mistake-to-Mastery Feature Notes

> Mistake-to-Mastery is a **feature inside MathPath** (`module = MathPath`, `feature =
> 'Mistake-to-Mastery'`), not a separate app. It uses the existing mistake history, mastery records,
> practice sessions/attempts, questions, topics and skills. Shared-core detail:
> [`mistake-to-mastery-worksheet-mvp-notes.md`](./mistake-to-mastery-worksheet-mvp-notes.md).

## Implemented
- **Pages** (reuse `components/ui` + `mathpathAPI`):
  - `/student/mathpath/mistakes` → `MistakesHome.jsx` — recent mistakes, weak skills from mistakes,
    recommended mastery practice, CTAs *Review mistakes* + *Practise similar*.
  - `/student/mathpath/mistakes/review` → `MistakeReview.jsx` (existing) — mistake cards.
  - `/student/mathpath/mistakes/:mistakeId` → `MistakeDetail.jsx` — original question, student vs
    correct answer, worked solution, linked skill/topic, mistake type, reviewed status, *Mark as
    reviewed* + *Practise similar*.
  - Similar practice + results **reuse** the shared `/student/mathpath/practice/:sessionId` and
    `/results/:sessionId` screens.
- **Similar practice:** `mathpathAPI.startSession({ feature: 'Mistake-to-Mastery', skillId,
  questionCount: 5 })` — same skill, near difficulty, avoids recently-seen items. Attempts log through
  `practice_attempts`; wrong answers save new `mistakes`; mastery updates on completion.
- **Review fields** (on `models/Mistake.js`): `status (open|reviewed|resolved)`, `reviewedAt`,
  `reviewedByUserId`, `reviewSource (student|parent|tutor|teacher)`, `misconceptionTag`. Mistake types:
  `concept_gap | calculation_error | careless | method_error | unknown`.
- **Resolution is mastery-derived:** when a skill reaches mastery, its open/reviewed mistakes flip to
  `resolved` (doing a worksheet alone does not resolve them).
- **Endpoints:** `GET /api/mistakes` (grouped by skill, `status=all` for detail), `POST
  /api/mistakes/:id/review`.
- Student dashboard: Mistake-to-Mastery is a `live` module card (`config/modules.js`).

## Mocked / simplified
- No full AI diagnosis — `mistakeType` defaults to `unknown` and can be set on review.
- No tutor/teacher mistake workflows yet; parent mistake history exists separately (`pages/parent`).

## Parent dashboard
The parent app (`pages/parent/MistakeHistory.jsx`) surfaces a child's mistakes and links to assign
practice / generate a worksheet; the worksheet generator can build a set from `recent_mistakes`.

## Commands / test
`npm run seed:mathpath`, log in as `demo.student@tianos.test` (`Passw0rd!`) → make mistakes via MathPath/
Fluency → open Mistake-to-Mastery → review a mistake → practise similar → confirm mastery update.

## Next step
Capture a real `mistakeType`/`misconceptionTag` at attempt time (lightweight diagnosis), and add a
parent "Review child's mistakes → assign similar practice" one-tap loop.
