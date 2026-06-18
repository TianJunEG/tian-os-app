# Tian OS MathPath Bible

**Status:** Working documentation  
**Last updated:** June 2026
**Current scope:** MathPath — 18 domains, Fractions pilot live, multi-domain engines built

---

## 1. Purpose of This Document

This document explains MathPath as the core learning engine inside Tian OS.

It is intended for:

- founders
- AI-native developers
- curriculum designers
- tutors
- student care operators
- product managers
- future technical leads

The goal is to make clear:

- what MathPath is
- what it currently does
- what it does not yet do
- how Fractions intervention works
- what evidence is required before making learning claims

---

## 2. Current MathPath Scope

MathPath covers **18 Singapore Primary Mathematics domains**. The full catalog and per-domain capability status are in `shared/mathpath/domainCatalog.js` — that file is the authoritative source; this section is a summary.

### What is live

- **Fractions** — F001–F026, fully built: diagnostic, practice, fluency, retention, story mode (F025–F026), mistake-to-mastery, worksheets, assignments, parent/tutor/teacher dashboards. This is the anchor domain for the active pilot.
- **All 18 domains** — skill graphs, question generators, practice engines, and misconception maps exist for every domain.
- **Percentage and Ratio** — fluency + retention engines live (added June 2026).
- **P1–P6 grade-level engines** — 272 files in `frontend/src/mathpath/primary/` covering grade-scoped skill graphs and question generators for each year level.
- **Diagnostic engine** — adaptive, domain-agnostic; 17 domain adapters registered. Fractions is `available`; most other domains are `engine_ready` (logic built, DB session or UI pending).

### What is not yet live

- Full multi-domain pilot beyond Fractions — diagnostic sessions, assignments, and worksheets for non-Fractions domains are `planned` or `engine_ready` but not in active pilot use.
- Complete Singapore Math school readiness — school pilot requires broader domain coverage and validated question quality across all domains.
- PSLE-readiness positioning — requires Ratio, Percentage, Geometry, Speed, Data fully live with assessed content.

### Safe claims as of June 2026

- Fractions intervention (P2–P6, F001–F026): ✓
- Adaptive diagnostic for Fractions: ✓
- Fluency + retention for Fractions, Percentage, Ratio: ✓
- Multi-domain practice (student-facing): ✓ for most domains
- Complete P1–P6 product with full school claims: not yet

---

## 3. MathPath Philosophy

MathPath is built around one core idea:

> A wrong answer is not the end of learning. It is the start of diagnosis.

MathPath should not simply give more questions.

It should answer:

1. What skill is weak?
2. What misconception may be present?
3. What evidence supports this?
4. What teaching step is needed?
5. Did the student improve after intervention?
6. What should the student or adult do next?

---

## 4. Evidence-First Learning Loop

The core MathPath loop is:

```text
Diagnostic
→ Mistake Evidence
→ Recovery Pack
→ Teaching Flow
→ Recheck
→ Growth Report