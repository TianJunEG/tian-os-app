# Build Prompt — Lower-Primary Student Dashboard (match mockup)

## Context
We have a student dashboard at `frontend/src/pages/student/StudentDashboard.jsx`. It renders three
age-band variants resolved by `frontend/src/design-os/studentVisualMode.js`:
`lower_primary` (P1–P3), `upper_primary` (P4–P6), `secondary`.

The **upper-primary** variant is already polished and matches its design. Use it as the reference
implementation for component structure, data wiring, and Tailwind conventions — do NOT change it.

The **lower-primary** variant currently reuses older shared components (`CompactStatCard`,
`RecommendedNextSection`) and does NOT match the lower-primary mockup. Your task is to bring it
up to the mockup, mirroring the quality of the upper-primary branch.

## Goal
Build a dedicated lower-primary dashboard layout that matches the mockup (playful, big, encouraging,
P1–P3 reading level). Render it as its own branch in `StudentDashboard.jsx`, the same way
`isUpperPrimaryDashboard` is handled — i.e. add an `if (isLowerPrimary(visual.mode)) { return (...) }`
block with dedicated lower-primary components, instead of falling through to the shared layout.

## What the lower-primary mockup requires (gaps vs. current code)

1. **Header** — "Hi, {firstName}! 👋" then a large title **"Today's Plan"** (underlined accent),
   a friendly star mascot with a "Let's go! 💪" speech bubble, and a "You've got this!" sticky-note
   accent on the right. Keep a Profile button. (Currently the header just says "Today".)

2. **Today's Mission card** — keep "Recognise Fractions 🎯" style: mission badge, time (e.g. 8 MIN),
   one-line reason ("This will clear the stuck point in Recognise Fractions."), Current skill / Why this /
   Time mini-grid, and a big "🚀 Start Practice" CTA. Reuse the data wiring from the existing
   `TodaysMissionCard` (currentSkill, nextAction, hasPlacement, assessmentReady). A calculator + pie-chart
   illustration on the left is desirable.

3. **Four stat cards** (currently only three). Big, colorful, each with an illustrated icon, a label,
   a big value, and an encouraging subtitle:
   - **Skills Mastered** — `{mastered}/{total}` — "Amazing progress!" (trophy, green)
   - **Current Streak** — `{streak} day(s)` — "Keep it up! You're on fire! 🔥" (flame, orange)
   - **Learning XP** — `{xp}` — "Keep learning to earn more!" (gem, blue)
   - **Brain Power** — `Level {n}` with an XP progress bar e.g. `120/200 XP` — (brain, pink)
   Add the 4th "Brain Power / Level" card. Derive level + level-progress from XP (define a small helper,
   e.g. level = floor(xp/200)+1 style; confirm the intended formula with the team if one exists).

4. **Recommended Next** — section titled "Recommended Next" with subtitle
   "Choose one focused action. You do not need to do everything today." Show **four** cards WITH body text
   (currently 3, no descriptions): Continue Learning, Review Mistakes, Fluency Challenge, Mastery Check.
   Mirror the card set and gating logic in `UpperPrimaryRecommendedNext` (respect `FEATURE_FLAGS.fluency`,
   `FEATURE_FLAGS.assessments`, and `getFractionAssessmentBlueprintReadiness`), but style them large and
   playful with mascot-style icons for the lower-primary look.

5. **Encouragement footer banner** — "Small steps every day lead to big progress." / "You've got this! 💪"
   with a sun + hills illustration. (The upper-primary `EncouragementBanner` exists; either restyle it
   for lower-primary or create a lower-primary variant — do not regress the upper-primary one.)

## Constraints
- Reuse existing data: `vm.currentSkill`, `vm.nextAction`, `vm.hasPlacement`, `safeMasteredCount`,
  `totalSkills`, `displayProgress`, `currentStreak`/`displayStreak`, `learningXp`/`displayXp`,
  `assessmentGate.ready`, `learningTimeline`. Do NOT invent new API calls; pull from the same payload
  the upper-primary branch already uses.
- Styling: Tailwind only, consistent with `VISUAL_MODE_STYLES.lower_primary` tokens in
  `studentVisualMode.js` (sky/violet/pink gradients, rounded, `shadow-resting`). Extend those style
  tokens if needed rather than hardcoding.
- Keep `lucide-react` icons (Trophy, Flame, Gem, Brain, BookOpen, Search, Timer, Award, ArrowRight, etc.).
- Reading level for P1–P3: short, warm, encouraging copy. No dense metric language.
- Do not touch the upper-primary or secondary branches except to share/refactor common helpers cleanly.
- Add/extend tests in `frontend/src/pages/student/StudentDashboard.test.jsx` to cover the lower-primary
  branch (renders "Today's Plan", 4 stat cards incl. Brain Power, 4 Recommended Next cards, banner).

## Acceptance
- A P1–P3 student (or `studentVisualMode: 'lower_primary'`) sees a dashboard matching the mockup:
  mascot header "Today's Plan", mission card, 4 colorful stat cards incl. Brain Power, 4 Recommended
  Next cards with descriptions, encouragement banner.
- Upper-primary and secondary dashboards are visually unchanged.
- `npm --prefix frontend test` passes.

## Files
- Edit: `frontend/src/pages/student/StudentDashboard.jsx`
- Likely edit: `frontend/src/design-os/studentVisualMode.js` (style tokens / labels)
- Edit: `frontend/src/pages/student/StudentDashboard.test.jsx`
