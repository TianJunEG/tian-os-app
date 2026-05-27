# MVP_BUILD_PLAN.md — MathPath Vertical Slice

The goal of this MVP is **one working loop, end to end**, integrated into Tian OS. Nothing
more. It proves the skill graph ([`SKILL.md`](./SKILL.md)), the question contract
([`QUESTION_TAGGING.md`](./QUESTION_TAGGING.md)), and the data model
([`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)) actually compose into a learner experience.

## The one loop

```
Student logs in
  → sees Tian OS dashboard
    → enters MathPath
      → gets a recommended skill
        → does timed fluency practice
          → makes a mistake
            → receives AI remediation
              → mastery profile updates
                → next recommendation appears
```

Every arrow above must work for a single student on a single device. If any arrow is faked or
stubbed, the slice is not done.

---

## Scope

### In scope (the slice)

- Auth + dashboard: reuse the **existing** Tian OS login and dashboard; add **one** MathPath tile/route.
- A **single fluency domain**: the multiplication chain
  `mul-tables-2510 → mul-tables-346 → mul-tables-6789 → div-within-tables` (all `mastery_type: fluency`).
- Recommendation over that chain (start / continue / remediate).
- **Timed** fluency practice (`mode: timed_fluency`), 10 items, first-try + time captured.
- Misconception diagnosis on a wrong answer (tag match) → **one** AI remediation turn.
- Mastery profile + fluency metrics update against the `SKILL.md §1` rule.
- Re-recommendation reflecting the update (continue, advance, or route back).

### Explicitly out of scope (do NOT build yet)

- ❌ Heuristic / model-method problem solving (belongs to MathThink, `SKILL.md` scope note).
- ❌ Olympiad / competition / non-routine problems.
- ❌ Science, spelling, reading, or any other Tian OS subject.
- ❌ Domains beyond multiplication (no fractions/decimals/percentage/algebra/geometry UI yet —
  they exist in the graph but are not surfaced).
- ❌ Concept-heavy skills, worked-example remediation flows, photo/worksheet ingestion.
- ❌ Parent/tutor dashboards, reporting, the unified-profile reconciliation
  (`/api/learning/result` posting can be a no-op stub for the slice).
- ❌ Question authoring tools — seed a small generated bank for the four skills only.

---

## Architecture (reuse first)

| Layer | Approach |
| --- | --- |
| **Frontend** | Add a `/mathpath` route to the existing React app; one dashboard tile to enter it. Reuse the standalone `mathpath/` engine UI where possible rather than rebuilding. |
| **Backend** | Add MathPath endpoints under the existing Express server. Mongo collections per `DATABASE_SCHEMA.md`. |
| **AI remediation** | Anthropic, Haiku first (escalate to Sonnet only on low-confidence), prompt-cached system prompt. One reteach turn + one re-attempt. |
| **Graph data** | Seed `skills` + `skill_edges` from `SKILL.md` (multiplication subset only for the slice; full seed can come later). |

### Minimal endpoints

```
POST /api/mathpath/session/start      → { recommendation, session_id, items[] }
POST /api/mathpath/attempt            → { correct, misconception_tag?, remediation? }
POST /api/mathpath/session/complete   → { mastery_update, next_recommendation }
GET  /api/mathpath/recommendation     → active recommendation for the student
```

---

## Milestones

Each milestone is independently demoable; ship them in order.

1. **Seed the graph (slice).** Load the four multiplication `skills` + their `skill_edges` and a
   small `questions` bank (≥ 20 items/skill, tagged per `QUESTION_TAGGING.md`).
   *Done when:* the graph can be queried for prerequisites and unlocked skills.

2. **Recommendation engine (read-only).** Given a student's `mastery_profiles`, return the
   next-best unlocked skill (`kind: start_new | continue | remediate`).
   *Done when:* `GET /recommendation` returns the correct skill for a hand-seeded profile.

3. **Timed practice + capture.** Render a 10-item timed session; record first-try, time, and
   hint usage into `practice_sessions`.
   *Done when:* completing a session writes a correct `practice_sessions` document.

4. **Mastery + fluency update.** Recompute `mastery_profiles` and `fluency_metrics` from
   sessions using the `SKILL.md §1` rule (accuracy **and** speed).
   *Done when:* a strong session flips a skill to `mastered`; a weak one keeps it `in_progress`.

5. **Misconception diagnosis + AI remediation.** Map a wrong answer to a `misconception_tag`,
   log an `observation`, and serve one AI reteach + re-attempt.
   *Done when:* a deliberate `7×8 → 49` triggers the `mult/adjacent-fact-slip` reteach.

6. **Close the loop (UI).** Wire the dashboard tile → recommendation → practice → remediation →
   updated mastery → refreshed recommendation, all in the React app.
   *Done when:* the full loop above runs for one student without manual DB edits.

---

## Acceptance criteria (the slice is "done")

- A student logs into Tian OS, opens MathPath from the dashboard, and is recommended a skill.
- They complete a **timed** 10-item session; their first-try times are recorded.
- A wrong answer produces a **named** misconception and a **single AI remediation** turn with a
  re-attempt.
- Their `mastery_profiles` and `fluency_metrics` update per the `SKILL.md §1` mastery rule.
- The next recommendation reflects the update: **advance** when mastered, **continue** when
  below the bar, or **remediate** to a prerequisite when the failure traces to one
  (`SKILL.md §4.1 / §8`).
- No heuristics, Olympiad, science, spelling, or reading appear anywhere in the slice.

---

## Risks & guardrails

- **Scope creep into concepts.** Keep to fluency skills; concept remediation (worked examples)
  is a later phase. The graph already supports it — don't surface it.
- **Graph ↔ question drift.** A question's `domain`/`level_tag`/`fluency_type` must match its
  skill node; add a seed-time validation check (`QUESTION_TAGGING.md §1` consistency rules).
- **AI latency/cost in the loop.** Remediation is one cached Haiku call; escalate to Sonnet only
  on low confidence. Never block the practice timer on the model.
- **Profile reconciliation deferred.** The unified-profile post is a stub for the slice; record
  enough (`tianos_user_id`) now so it can be wired up without a migration later.
