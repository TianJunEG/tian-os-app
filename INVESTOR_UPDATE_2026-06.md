# Tian OS — Investor Progress Update

**Date:** 10 June 2026

## TL;DR

We've moved from a generic tutor-marketplace concept to a focused, defensible
product: **Tian OS, a "learning operating system"** built around a single shared
mastery profile. Our flagship module, **MathPath** (adaptive math mastery +
fluency for Singapore primary math), is now in **pilot-hardening mode** ahead of a
supervised **5-student Fractions pilot**. Development velocity is high (74 commits
in the last 30 days) and we are deliberately holding scope to get real students
through the full learning loop.

---

## What we're building (and why it's defensible)

The core insight is architectural, not cosmetic: **everything is keyed to one
Singapore-aligned curriculum skill map.** A diagnostic, a practice attempt, a
worksheet result, and a handwriting-evidence submission all resolve to the same
`skill_id` and write into **one Mastery Engine** — the single source of truth on
what each student knows.

- **Apps are thin; the kernel is the moat.** MathPath, the fluency engine, the
  worksheet generator, and future modules (Spelling, Science) all *produce
  practice and report outcomes against shared skills*. They don't own the learner.
- **Dashboards are projections, not separate products.** Student, parent, tutor,
  and teacher views are permission-gated queries over the same core — so a parent
  dashboard can truthfully say "fractions are weak" because multiple apps wrote
  evidence to the same node.
- **One person, many roles.** The identity model supports a user holding teacher +
  tutor roles simultaneously, with workspaces controlling which students/records
  are visible.

This is the difference between "one profile" as marketing vs. as real
infrastructure — and it's what lets us add modules without rebuilding the learner
each time.

---

## Where we are: Pilot-hardening

We're preparing a **supervised 5-student MathPath Fractions pilot (skills
F001–F026)**. The full learning loop is built end-to-end:

> Diagnostic → recommended weak skill → adaptive practice → mistake → AI-diagnosed
> misconception → reteach + guided retry → mastery update → next best step.

**Shipped and in the product today:**

- Adaptive **diagnostic → recommendation** engine and per-skill mastery tracking
  (accuracy, speed, fluency, streaks, misconception tallies)
- **Mistake-to-mastery remediation** with AI reteach (Anthropic, prompt-cached)
  and a deterministic fallback so it runs without a key
- **Working-evidence capture** — handwriting canvas + photo upload + OCR
  paper-analysis pipeline, plus a "no working needed" declaration, all as telemetry
- **Confidence capture** ("I know this / not sure / need help") — surfacing
  *overconfident wrong answers* to adults
- **Worksheet generator** driven by weak skills, mistakes, confidence, retention,
  and fluency signals (answer keys + PDF)
- **Times-tables fluency engine**, KaTeX stacked-fraction rendering, calm premium
  design system
- **Tutor explanation recorder** with timestamped stroke replay; **parent
  notifications**, weekly email digest, and premium WhatsApp push
- **Internal pilot analytics** (`/admin/pilot-analytics`) — DAU, completions,
  working-submission rate, most-missed skills, telemetry coverage

**Scale of the build:** ~446 frontend source files, 69 backend routes, 60+ data
models, 18 service domains, and **168 test files** backing a documented
pilot-readiness gate (test + build + question-quality audit + Playwright
preflight).

---

## Discipline: what we're deliberately NOT doing

The strongest signal this quarter is **scope control.** We explicitly paused
several built-but-non-essential capabilities — agency seat-licensing with Stripe
Connect billing, school/class claim codes, P1 number content — behind feature
flags, to force focus on getting **5 real students through the loop first.** Our
internal `NEXT.md` is blunt about it: "Stop expanding scope."

---

## Candid open blockers before pilot (tracked, not hidden)

1. **Quarantine 14 incorrect fraction→skill mappings** — top blocker, because they
   can generate live questions/evidence shown to parents.
2. **Remove demo/fake-state fallbacks** from live student paths so real accounts
   behave correctly end-to-end.
3. **Evidence integrity** — "mastered" must require a passing recheck/retention,
   never be inferred from attempt count.

Security hardening landed on 10 June (JWT rotation, password reset, route
feature-gating, evidence-integrity service).

---

## What we need / next 30 days

- Clear the three pilot blockers above and run the readiness gate green
- Execute the **5-student supervised Fractions pilot** and capture real engagement
  + learning-signal data (today's analytics baseline is seeded, not real usage)
- Use pilot evidence to validate the mastery loop before re-opening monetization
  (agency licensing) and additional modules
