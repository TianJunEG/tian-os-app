# MATHPATH_ROADMAP.md

The direction for **MathPath** — the adaptive math mastery + fluency module of Tian OS. This is
the source of truth for what MathPath is, what it is *not*, and what comes next.

> MathPath focuses **only** on: speed, accuracy, fluency, adaptive mastery, remediation, and
> progression. Nothing else belongs in the MathPath MVP.

---

## 1. Current completed state

The MVP (`mathpath-mvp/`, Next.js) implements one adaptive mastery loop end to end:

**Dashboard → recommended skill → timed/independent practice → mistake → AI remediation
(worked example + guided "now you try") → mastery update → next recommendation.**

Done:

- **Skill graph engine** (`src/lib/graph.js`) — 6 skills across 2 domains, with
  `prerequisites`, `extends_to`, `mastery_type`, `fluency_type`, `expected_time_seconds`,
  `mastery_threshold`, and a worked `example`.
  - *Multiplication & Division:* multiplication fluency → division fluency
  - *Fractions:* fraction meaning → equivalent fractions → comparing fractions → adding fractions
- **Question generation** (`src/lib/questions.js`) — procedural items per skill (numeric +
  multiple-choice), with LaTeX prompts/choices, visual fraction bars, worked-solution steps,
  guided siblings, and per-skill misconception **diagnosis**.
- **Recommendation engine v2** (`src/lib/recommend.js`) — accuracy/speed/misconception rules →
  next skill, reason, mode, confidence status, remediation suggestions, fluency drills.
- **Mastery tracking** (`src/lib/mastery.js`) — accuracy, response speed (median first-try),
  retries, current/best streak, fluency status, mastery status, misconception tallies; stored
  per skill (Mongo, with an in-memory fallback for demos).
- **KaTeX rendering** (`src/components/Math.jsx`, `FractionBar.jsx`) — stacked fractions
  (never slash notation) across practice questions, answer choices, worked examples, and
  remediation; responsive and mobile-readable.
- **Design** — light premium Tian OS system (navy + gold, Fraunces / Inter / JetBrains Mono),
  mobile-first, calm, low cognitive load.

---

## 2. Product boundaries

**In scope (and only this):**

| Pillar | Meaning |
| --- | --- |
| Speed | Per-skill `expected_time_seconds`; first-try response time tracked. |
| Accuracy | First-try, un-hinted correctness; the primary mastery gate. |
| Fluency | Fast **and** accurate recall/procedure; a distinct status from mastery. |
| Adaptive mastery | Skills unlock only when prerequisites are mastered. |
| Remediation | A wrong answer is diagnosed to a named misconception → reteach + re-attempt. |
| Progression | The recommendation engine always surfaces the next best step. |

**Explicitly out of scope — do NOT build into MathPath:**

- ❌ Heuristics / model-method problem-solving (separate "MathThink" product)
- ❌ Olympiad / competition / IQ math
- ❌ Science, Spelling, Reading (separate Tian OS modules)
- ❌ Tutor marketplace, bookings, payments
- ❌ School / class / admin dashboards
- ❌ Advanced fraction **word problems** (not yet)

---

## 3. Tech stack

- **Frontend / app:** Next.js (App Router), React, light Tian OS design system (mostly
  token-driven inline styles + Tailwind base).
- **Math rendering:** KaTeX (stacked fractions, algebra-ready, responsive).
- **Engines:** plain JS modules — `graph` (skills/edges), `questions` (generation + diagnosis),
  `mastery`, `recommend`, `remediation`.
- **AI remediation:** Anthropic (Haiku, prompt-cached) for the reteach message, with a
  deterministic templated fallback so the loop runs without a key.
- **Persistence:** MongoDB (collections: `students`, `mastery_profiles`, `practice_sessions`,
  `fluency_metrics`, `recommendations`, `misconceptions`); in-memory fallback when no
  `MONGODB_URI`.
- **Specs:** [`SKILL.md`](./SKILL.md), [`QUESTION_TAGGING.md`](./QUESTION_TAGGING.md),
  [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md), [`MVP_BUILD_PLAN.md`](./MVP_BUILD_PLAN.md).

---

## 4. Next implementation phases

**Phase 1 — Deepen the fraction slice (current focus)**
- Add *simplifying fractions* and *fractions on a number line* (still single-answer, KaTeX).
- Richer fraction visuals (circle/area models alongside the bar).
- Persist remediation outcomes into the mastery signal (retries already tracked).

**Phase 2 — Adaptivity & memory**
- Spaced review: resurface mastered skills before they decay.
- Session shaping by mode (shorter fluency drills vs. longer concept blocks).
- Confidence trend over time (sparkline on the dashboard).

**Phase 3 — Coverage within the same two domains**
- Multi-digit multiplication/division fluency; unlike-denominator fraction addition.
- Decimals ↔ fractions conversion (the next domain edge), still fluency/mastery framed.

**Phase 4 — Real accounts & profile**
- Replace the demo name-login with real auth; post results to the unified Tian OS learning
  profile (currently stubbed).
- Parent-visible mastery snapshot (read-only) — *not* a school admin dashboard.

**Phase 5 — Hardening**
- Seed the static graph/questions into Mongo (currently code-defined).
- Item-quality validation at seed time (tag/level/type consistency, per `QUESTION_TAGGING.md`).
- Accessibility + reduced-motion audit on the practice flow.

---

## 5. What NOT to build yet

- No new **domains** beyond Multiplication/Division and Fractions until the fraction slice is
  mastered end to end.
- No **word problems**, heuristics, or multi-step reasoning items.
- No **gamification** beyond the calm streak/mastery feedback already present (no badges,
  coins, avatars, leaderboards).
- No **analytics dashboards**, cohort reporting, or teacher tooling.
- No **cross-module** wiring (science/spelling/reading) inside MathPath screens.
- No **AI free-chat** tutor — remediation stays scoped to the diagnosed misconception.

Keep MathPath narrow: a calm, premium, adaptive **math mastery + fluency** engine.
