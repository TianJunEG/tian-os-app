# K2 Numeracy — Scope & Implementation Plan

Status: **Proposal / scoping** (no code yet). Authored 2026-06-21.

Goal: give Kindergarten (K2, and optionally K1/N2) learners a real, age-appropriate
numeracy track instead of being routed into Primary-1 Operations (`OP001` is
"addition within 20" — a P1 skill, too hard and mis-scoped for K2).

Grounded in the Singapore MOE **Nurturing Early Learners (NEL) 2022** framework,
*Educators' Guide for Numeracy*.

---

## 1. The core pedagogical decision (read first)

NEL numeracy is **play-based and observation-assessed**, not test-driven. The
guide is explicit (Ch.1, Ch.5): *"A child who appears to be engaging successfully
in numeracy activities may not necessarily understand the underlying concept"* —
and assessment is via teacher observation/documentation, **not** quizzes.

Our MathPath model (adaptive diagnostic → mastery % → fluency drills → retention)
is a Primary-school, assessment-driven model. Dropping a K2 child into that model
would **over-formalise early learning** and misrepresent NEL.

**Recommendation:** build a K2 track as a gentle, no-stakes **"Explore & Practise"**
experience:
- No high-stakes adaptive diagnostic. Optionally a short, encouraging "warm-up"
  that only ever places *forward* (never labels a 5-year-old "developing").
- Mastery surfaces to parents as **readiness signals** ("counts to 10 reliably",
  "recognises shapes"), not grades or percentages.
- **No fluency/speed drills, no retention scheduling** for K2 (NEL has no timed
  fluency goal at this stage).
- Every prompt is **visual + audio-first** (TTS is already wired for lower
  primary), heavy on tap/drag manipulatives, minimal text, no typing.

This decision shapes everything below — confirm it before Phase 1.

---

## 2. Curriculum scope (from NEL 2022 Numeracy Learning Goals)

LG1 (*enjoy/use numeracy*) is a disposition — embodied in tone/UX, not a skill row.
LG2–LG4 give the concrete skills. Proposed K2 skill set (~22 skills), grouped by strand:

### Strand A — Counting & Number Sense (NEL LG3)
| # | Skill | NEL KSD |
|---|-------|---------|
| A1 | Rote count to 10, then to 20 | 3.1 |
| A2 | Count objects 1-to-1 (one-to-one correspondence) | 3.2, 3.2.1 |
| A3 | Cardinality — last number = how many | 3.2.3 |
| A4 | Count from any start / order irrelevance | 3.2.2, 3.2.4 |
| A5 | Conservation of quantity to 10 (rearranged = same) | 3.3 |
| A6 | Recognise numerals 0–10 (and match numeral↔quantity) | 3.4, 3.5 |
| A7 | Compare two sets: same / more than / fewer than (to 10) | 3.7 |
| A8 | Number bonds — parts that make a whole to 10 (5 = 2+3) | 3.8 |
| A9 | (bridge) Add by "putting together" within 10 | precursor to OP |
| A10 | (bridge) Subtract by "taking away" within 10 | precursor to OP |

> A9/A10 are the genuine K2 add/subtract-**within-10** skills the app is missing
> (Operations only starts at within-20). They bridge cleanly into `OP001`.

### Strand B — Relationships & Patterns (NEL LG2)
| # | Skill | NEL KSD |
|---|-------|---------|
| B1 | Match/sort by one attribute (colour, shape, size) | 2.1 |
| B2 | Compare & order by size / length / height | 2.1, 2.2 |
| B3 | Order events / sequence (first→last, times of day) | 2.2 |
| B4 | Recognise & extend a repeating pattern (ABAB) | 2.3 |
| B5 | Complete / create a pattern (ABCABC) | 2.3, 2.4 |

### Strand C — Basic Shapes & Spatial (NEL LG4)
| # | Skill | NEL KSD |
|---|-------|---------|
| C1 | Recognise & name circle, square, rectangle, triangle | 4.1 |
| C2 | Shape attributes (triangle = 3 sides; square = 4 equal) | 4.2 |
| C3 | Recognise shapes in different sizes/orientations | 4.1 |
| C4 | Compose figures from basic shapes | 4.3 |
| C5 | Position / direction / distance (top/bottom, left/right, near/far) | 4.4 |

### Strand D — Informal Measurement (NEL LG2, comparison only)
| # | Skill | NEL KSD |
|---|-------|---------|
| D1 | Compare length/height (longer/shorter, taller/shorter) | 2.1 |
| D2 | Compare size/quantity-ish (bigger/smaller, heavier/lighter) | 2.1 |

**Overlap with existing domains:** none of these exist today. `number_sense`
starts at *Counting to 20 (P1)*; `operations` at *within 20 (P1)*; `geometry`
is P3+. So this is genuinely net-new content, not a re-label.

---

## 3. Proposed architecture

**One new domain: `early_numeracy`** (display "Numeracy", K2/K1). Rationale: the
app is domain-centric (each domain = graph + generator + services + route +
registry + 2 resolvers + dashboard card). Bundling all four strands into one K2
domain is far less wiring than 4 mini-domains, and matches the child-facing idea
of a single gentle "Numbers & Shapes" track.

- Skill-id namespace: **`EN001…`** (Early Numeracy), slug prefix **`en.`**
  (e.g. `en.count.to10`) so `domainIdFromSlug` tags mastery records correctly.
- Strands map to the skill graph's `strand` field (Counting / Patterns / Shapes /
  Measurement) so the skill map groups them.

### Files/systems to touch (follows the established per-domain pattern)
| Area | File(s) | New/Edit |
|------|---------|----------|
| Skill graph | `shared/mathpath/earlyNumeracy/EarlyNumeracySkillGraph.js` | new (~22 skills) |
| Question gen + families | `shared/mathpath/earlyNumeracy/EarlyNumeracyQuestionGenerator.js` (+ families) | new (**bulk of effort**) |
| Learning-path model | `shared/mathpath/earlyNumeracy/EarlyNumeracyLearningPathModel.js` | new |
| Practice service | `services/mathpath/earlyNumeracyPracticeService.js` | new |
| Route | `routes/mathpathEarlyNumeracy.js` + mount in `server.js` | new |
| Domain registry | `services/domains/domainRegistry.js` | edit (+1 entry) |
| Slug→domain | `utils/skillSlugDomain.js` (`en` → `early_numeracy`) | edit |
| Backend resolver | `services/mathpath/domainSkillGraphServer.js` | edit (+1 entry) |
| Frontend resolver | `frontend/src/mathpath/dashboard/domainSkillGraphResolver.js` | edit (+1 entry) |
| Practice config | `frontend/.../domainPractice/core.js` (`DOMAIN_PRACTICE_CONFIG`) | edit |
| Learning-path page | thin wrapper over `DomainLearningPathPage` | new |
| API methods | `frontend/src/services/api.js` | edit |
| Dashboard cards | `StudentDashboardLowerPrimary.jsx` `DOMAIN_LIST` + `MathPathDomainGrid` `MATHPATH_DOMAINS` | edit |
| K2 routing | extend `isOperationsSpineLevel`/check-in route so K2 → `early_numeracy`, not `operations` | edit |
| (Skip for K2) | fluency service, retention service, adaptive diagnostic | n/a |

---

## 4. Reusable vs new building blocks

**Reuse (already built):**
- Lower-primary MCQ UI (2-col, text-3xl, tap-to-answer, auto-submit) — fits almost
  every K2 question (tap the answer).
- TTS auto-read on question change + tap-to-hear (`toSpeakable`, `speak`).
- 🍎 `ManipulativeDotArray` (counting, add/sub within 10 → A2/A3/A9/A10).
- `ManipulativeMoneyDiagram` pattern (tappable token rows) as a template.
- SVG shape renderers in `svgRenderers.js` (circle/square/rect/triangle → C1–C4).

**New visual components needed:**
- **Compare-sets** panel (two rows side-by-side → A7, "which has more?").
- **Pattern strip** with a missing slot to tap-fill (B4/B5).
- **Sort/match** buckets (B1) — tap an item into the right group.
- **Seriation** row — order 3–4 objects by size/length/height (B2, D1/D2).
- **Shape tap-select** + attribute callouts (C1/C2/C3).
- **Compose-figure** (drag basic shapes onto an outline → C4) — most complex; could
  be MCQ ("which shapes make this boat?") in v1 to avoid drag.
- **Spatial** scene with position/direction prompts (C5).

Most are tap/MCQ, not free-text — low build risk, high reuse of the LP UI.

---

## 5. Phased plan & rough effort

| Phase | Deliverable | Size |
|-------|-------------|------|
| **0. Decisions** | Confirm §1 stance + the open questions in §6 with an ECE lead | S |
| **1. Domain skeleton** | Skill graph + all wiring (registry, slug, both resolvers, route, practice config, dashboard card, K2 routing). End state: empty-but-navigable `early_numeracy` track. | M |
| **2. Question content** | Generators + families for all ~22 skills (the bulk). Sequence by strand: Counting → Patterns → Shapes → Measurement. | L |
| **3. Manipulatives** | The 7 new visual components in §4 (compose-figure as MCQ in v1). | M |
| **4. Gentle mode** | No-stakes "Explore & Practise" flow; parent-facing readiness signals (not %); suppress fluency/retention/diagnostic for K2. | M |
| **5. Validation & QA** | ECE-specialist content review; audio for every prompt; tap-target/accessibility pass; sample with real K2 users. | S (ongoing) |

Phase 2 dominates. Phases 1, 3, 4 are each comparable to a typical domain add
(we've done 15). Recommend shipping **Strand A (Counting & Number) first** as a
vertical slice end-to-end, then B/C/D.

---

## 6. Open decisions (need product + ECE input)

1. **Pedagogy stance** (§1): confirm gentle no-stakes "Explore" vs full diagnostic/mastery. *(Recommend: gentle.)*
2. **Breadth for v1**: all 4 strands, or ship Counting & Number first? *(Recommend: A first.)*
3. **One domain vs several**: `early_numeracy` bundle vs separate number/patterns/shapes. *(Recommend: one bundle.)*
4. **Levels**: K2 only, or K1/N2 too (NEL spans ages 4–6)?
5. **Mastery semantics for parents**: readiness signals vs %/badges. *(Recommend: readiness signals + encouragement.)*
6. **Curriculum authority**: who is the ECE specialist signing off alignment + question quality?
7. **Naming/ids**: domain id `early_numeracy`, slug prefix `en.`, skill ids `EN0xx` — OK?
8. **Bridge to P1**: do A9/A10 (within-10 +/−) feed `OP001` as prerequisites, so the K2→P1 transition is continuous?

---

## 7. Sources
- [NEL Framework 2022 (MOE)](https://www.moe.gov.sg/api/media/4f8c9642-8428-43c2-aa61-a01512aa98af/Nurturing-Early-Learners-NEL-framework-2022.pdf)
- [NEL 2022 Educators' Guide for Numeracy (MOE/ECDA)](https://isomer-user-content.by.gov.sg/57/c079b912-2898-42e2-b32d-ff3ab7cfbec4/Nurturing%20Early%20Learners%202022%20Educators%20Guide%20Numeracy_new.pdf) — Learning Goals 1–4, KSDs cited above.
- [MOE Preschool curriculum overview](https://www.moe.gov.sg/preschool/curriculum)
