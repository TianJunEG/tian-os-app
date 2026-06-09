# Tian OS Task Queue — Lower-Primary (P1–P3) Build

This queue reflects the workstream currently active in the repo: the lower-primary
MathPath build (P1 dashboard + P1 content modules). The Fractions pilot list is kept
below as a separate, deferred section so it isn't lost.

> NOTE: another session may be editing these files concurrently. Before changing a file,
> re-check `git status` / pull the latest, and prefer `confirm/complete` over rewrites.

## How to run
- Continuous: `./run-claude-continuous.sh`  (auto-resumes after each stop / quota reset)
- One pass:   `claude -p "Work through TASKS.md until everything is checked and tests pass"`

## Rules for Claude
- Do tasks in order unless a dependency forces otherwise.
- After each task, run its "Verify" command(s) before checking it off.
- Re-read the current file before editing; if another change landed, reconcile, don't clobber.
- If blocked, add a `> BLOCKED: <reason>` note under the item and move on.
- Never delete tasks — only check them off.

---

## A. Lower-Primary Student Dashboard
Source: `LOWER_PRIMARY_DASHBOARD_BUILD_PROMPT.md`. Mirror the polished upper-primary branch;
do NOT change upper-primary or secondary branches except to share helpers cleanly.

- [ ] Add a dedicated `if (isLowerPrimary(visual.mode)) { return (...) }` branch in
      `frontend/src/pages/student/StudentDashboard.jsx`, instead of falling through to shared layout.
- [ ] Header: "Hi, {firstName}! 👋" + large "Today's Plan" (underlined accent), star mascot with
      "Let's go! 💪" bubble, "You've got this!" sticky-note accent, keep Profile button.
- [ ] Today's Mission card reusing `TodaysMissionCard` data wiring (currentSkill, nextAction,
      hasPlacement, assessmentReady): mission badge, time, one-line reason, mini-grid, big
      "🚀 Start Practice" CTA.
- [ ] Four stat cards (add the 4th): Skills Mastered (trophy/green), Current Streak (flame/orange),
      Learning XP (gem/blue), and new Brain Power = Level {n} with XP progress bar (brain/pink).
      Derive level + progress from XP via a small helper; confirm the intended formula with the team.
- [ ] Recommended Next: title + subtitle, FOUR cards with body text (Continue Learning, Review
      Mistakes, Fluency Challenge, Mastery Check), mirroring `UpperPrimaryRecommendedNext` gating
      (`FEATURE_FLAGS.fluency`, `FEATURE_FLAGS.assessments`, `getFractionAssessmentBlueprintReadiness`),
      styled large/playful.
- [ ] Encouragement footer banner (restyle/variant, do not regress upper-primary `EncouragementBanner`).
- [ ] Use only existing payload data (no new API calls); extend `VISUAL_MODE_STYLES.lower_primary`
      tokens in `frontend/src/design-os/studentVisualMode.js` rather than hardcoding.
- [ ] Extend `frontend/src/pages/student/StudentDashboard.test.jsx` to cover the lower-primary branch
      (renders "Today's Plan", 4 stat cards incl. Brain Power, 4 Recommended Next cards, banner).
      Verify: `npm --prefix frontend test -- StudentDashboard` and `npm --prefix frontend run build`;
      confirm upper-primary & secondary dashboards are visually unchanged.

## B. P1 Content Modules — domain completeness
Each P1 domain needs: SkillGraph, QuestionFamilies, QuestionGenerator, MisconceptionMap, and a
generator test. Money, Measurement, Geometry, EqualGroups, and Data already have generator + test.

- [ ] Numbers: add/confirm `p1NumbersQuestionGenerator.js` + `p1NumbersQuestionGenerator.test.js`
      (families and graph exist via `p1NumbersQuestionFamilies.js` / `p1SkillGraph.js`).
      Verify: `npm --prefix frontend test -- p1NumbersQuestionGenerator`.
- [ ] AddSub: generator + test now exist — CONFIRM they pass and cover the families/misconceptions.
      Verify: `npm --prefix frontend test -- p1AddSubQuestionGenerator`.
- [ ] Confirm every domain generator validates answers, emits diagrams via `p1DiagramHelpers.js`,
      and references its `*MisconceptionMap` for distractors. Domains: Numbers, AddSub, Money,
      Measurement, Geometry, EqualGroups, Data.
      Verify: `npm --prefix frontend test -- frontend/src/mathpath/primary`.
- [ ] Confirm `p1SkillGraph.js` and `p1AddSubSkillGraph.js` wire all domain skills with no orphan
      nodes and consistent skill ids used by the generators.
      Verify: `npm --prefix frontend test -- p1SkillGraph` (add a graph-integrity test if missing).

## C. P1 verification gate
- [ ] Full P1 check: `npm --prefix frontend test -- frontend/src/mathpath/primary`
      and `npm --prefix frontend test -- StudentDashboard`, then `npm --prefix frontend run build`.
      All green, no console errors in the lower-primary dashboard.

---

# DEFERRED — Fractions Pilot (F001–F026)
Kept for later; not part of the active lower-primary workstream. See `docs/mathpath/PILOT_FIX_PLAN.md`,
`PILOT_READINESS.md`, `DIAGNOSTIC_AUDIT.md`, `ANSWER_WORKING_UX_AUDIT.md`. Do not start these until
the lower-primary build above is complete or the team re-prioritises.

- [ ] (deferred) Remove any `demo-student` fallbacks from student flows.
- [ ] (deferred) Diagnostic completes reliably end-to-end (honor completion contract + min question count).
- [ ] (deferred) Practice attempts persist to mastery/mistakes/telemetry for local + API sessions.
- [ ] (deferred) Working-evidence decision enforced without blocking valid mental work.
- [ ] (deferred) Mistakes created and reviewable after wrong answers.
- [ ] (deferred) Progress/dashboard reflect real backend state, not stale local state.
- [ ] (deferred) Gate broken/unstable routes; remove developer-facing copy.
- [ ] (deferred) Working-evidence UI consolidation (`WorkingEvidencePanel`, `WorkingSummary`, E2E).
- [ ] (deferred) Full pilot preflight gate per `PILOT_READINESS.md`.
