# MathPath — Fluency Feature Notes

> Fluency is a **feature inside MathPath** (`module = MathPath`, `feature = 'Fluency Practice'`), not a
> separate app. It reuses the shared practice/mastery/mistake core. Shared-core detail:
> [`mistake-to-mastery-worksheet-mvp-notes.md`](./mistake-to-mastery-worksheet-mvp-notes.md).

## Implemented
- **Pages** (reuse `components/ui` + `mathpathAPI`):
  - `/student/mathpath/fluency` → `FluencyHome.jsx` — recommended fluency skill, weak fluency skills,
    quick-practice CTA, view-all link, outstanding-mistake count.
  - `/student/mathpath/fluency/skills` → `FluencySkills.jsx` — skill cards with status
    (needs practice / learning / fluent).
  - Practice + results **reuse** the shared `/student/mathpath/practice/:sessionId` and
    `/results/:sessionId` screens (one question at a time, timer via time capture, instant feedback).
  - `/student/fluency` redirects to `/student/mathpath/fluency`.
- **Sessions:** `mathpathAPI.startSession({ feature: 'Fluency Practice', mode: 'fluency', skillId,
  questionCount: 8 })`. Attempts log to `practice_attempts`, update `mastery_records`, and save a
  `mistake` on wrong answers — same pipeline as core MathPath.
- **Skill catalog:** `GET /api/skills?group=fluency` returns the 5 fluency skills merged with the
  student's mastery status.
- **Seed content:** `scripts/seedFluency.js` → "Number Fluency" topic with 5 skills (Times tables,
  Mental addition and subtraction, Equivalent fractions, Decimal place value, Percentage basics) and
  ~60 questions. Fractions render **vertically** via the existing `MathText`/`Fraction` component.

## Mocked / simplified
- Rule-based question generation; no adaptive algorithm, no game mode, leaderboards, or rewards.
- "Timer" is elapsed-time capture per question, not a countdown/pressure mode.

## Assignment integration
An assignment with `module: 'MathPath'` (feature Fluency) can be launched into a session; the shared
practice-complete flow marks the assignment complete. (Worksheet/assignment plumbing lives in the core.)

## Commands / test
`npm run seed:fluency` then log in as `demo.student@tianos.test` (`Passw0rd!`) → MathPath → Fluency →
Start quick practice. Verify accuracy/time on the results screen and mastery movement on return.

## Next step
Add a countdown "sprint" mode option and surface a fluency recommendation chip on the MathPath home /
student dashboard.
