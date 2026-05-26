# MVP_TEST_CHECKLIST.md — MathPath MVP

Test coverage for the MathPath adaptive-mastery vertical slice (`mathpath-mvp/`).
Run the app first: `cd mathpath-mvp && npm run dev` → open the printed URL (e.g. `:3100`).

> Runs with no config (in-memory store, templated remediation). Set `MONGODB_URI` to persist
> state and `ANTHROPIC_API_KEY` to use live AI remediation messages.

---

## 1. Functional tests

| # | Test | Steps | Expected |
| --- | --- | --- | --- |
| 1 | **Dashboard loads** | Open `/`, enter a name, continue | Tian OS dashboard renders: greeting, "Today's plan" hero, KPI row, MathPath module card |
| 2 | **MathPath module opens** | Tap the MathPath card | Module screen: overall mastery Ring, confidence chip, recommended-skill card, skill graph grouped into *Multiplication & Division* and *Fractions* |
| 3 | **Recommendation appears** | Observe the "Recommended for now" card | Shows a skill, a mode tag (Start / Keep going / Fluency / Remediation / Reinforce), and a reason sentence |
| 4 | **Timed practice works** | Tap "Start practice" | Practice screen: top bar with live `mm:ss` timer, progress thread, streak row, a question, and an input (keypad **or** choice buttons) |
| 5 | **Answers checked correctly** | Answer a numeric item right, then one wrong | Correct → green check + advance; wrong → red X, shows the correct answer, then remediation |
| 6 | **Speed is tracked** | Answer a few quickly, then slowly | Correct answers show a per-item time + fast/steady tag; summary shows typical time |
| 7 | **Accuracy is tracked** | Complete a session | Summary shows first-try accuracy %; module/dashboard mastery reflects it |
| 8 | **Mistakes trigger remediation** | Answer a question wrong | Remediation screen: named misconception, warm message, worked example, "Now you try" sibling |
| 9 | **KaTeX fractions render** | Reach any fraction skill | Fractions are **stacked** (numerator over bar over denominator) — never `1/2` slash text — in prompts, choices, worked examples, remediation |
| 10 | **Mastery updates after a session** | Finish a session | Summary Ring + mastery bar update; status is one of developing/practising/fluent/mastered |
| 11 | **Next recommendation appears** | On the summary screen | "Recommended next" / "Up next" card; button says *Practise again* (same skill) or *Start <next skill>* (advanced) |
| 12 | **Mobile layout works** | View at ~390 px (or device) | Single-column phone surface, large tap targets, no horizontal scroll, sticky-feeling keypad |

### Adaptive-rule spot checks (recommendation v2)

| Scenario | Drive it by… | Expected mode |
| --- | --- | --- |
| Accuracy < 70% | Answering most wrong | `remediate` |
| Accuracy 70–89% | Mixed answers | `independent` (more practice) |
| Accuracy ≥ 90% but slow | All correct, slowly | `fluency` (drills) |
| Accuracy ≥ 90% and fast | All correct, quickly | `advance` (next skill unlocks) |
| Repeated same mistake | Same wrong pattern ×2+ | `misconception` (prerequisite reinforcement) |
| Prerequisite not mastered | Jump ahead | reroutes to the prerequisite |

### API smoke (optional, via curl)

```
GET  /api/recommendation?studentId=test     → { recommendation, chain, domains, last_session }
POST /api/session/start  { studentId }       → { session_id, skill, items[] }
POST /api/attempt        { skill_id, params, given } → { remediation }
POST /api/session/complete { studentId, session_id, skill_id, items } → { mastery_update, analytics, next_recommendation }
```

---

## 2. Manual QA — UX checklist

**Cognitive load & flow**
- [ ] Each screen has **one** obvious primary action.
- [ ] The next step is always clear (no dead ends).
- [ ] Nothing competes with the question during practice (no clutter).

**Touch & spacing**
- [ ] Keypad / choice targets are ≥ 44 px and comfortably spaced.
- [ ] Buttons don't sit under the thumb's accidental zone.
- [ ] Tapping a choice gives immediate, calm feedback.

**Feedback & motion**
- [ ] Correct/incorrect feedback is calm (no harsh flashes or shakes).
- [ ] Transitions between questions/screens are smooth.
- [ ] Mastery changes feel rewarding but understated (Ring/bar animate gently).
- [ ] `prefers-reduced-motion` is respected (animations minimise).

**Math rendering**
- [ ] All fractions are vertically stacked and crisp on mobile.
- [ ] Math scales with surrounding text; no overflow or clipping.

**Premium consistency**
- [ ] Navy + gold palette, Fraunces headings / Inter body throughout.
- [ ] Cards, radii, shadows match across dashboard, module, practice.
- [ ] Copy is warm, concise, and consistent (e.g. "Practise", mastery vocabulary).

**Loading**
- [ ] Initial load and session start feel quick; loading states are unobtrusive.

---

## 3. Out of scope (should NOT appear)

- [ ] No heuristics, Olympiad, or IQ math.
- [ ] No science / spelling / reading content.
- [ ] No tutor marketplace, bookings, or payments.
- [ ] No school / class / admin dashboards.
- [ ] No advanced fraction word problems.
