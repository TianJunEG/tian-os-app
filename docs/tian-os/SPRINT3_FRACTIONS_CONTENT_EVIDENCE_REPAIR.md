# Sprint 3 — Fractions Content & Evidence Repair

**Scope:** Tian OS MathPath — Fractions Intervention Pilot
**Date:** 2026-06-10
**Status:** Code changes complete and verified offline. Two follow-up steps require the live DB (run by the founder).
**Goal:** Remove incorrect fraction question→skill mappings from active use, prove the active content is clean, and make the runtime evidence chain (recheck refs, legacy mistakes, worksheet audit record) repairable and mastery-safe.

---

## Executive Summary

The static fraction content has been made claim-safe for the pilot: the question families that tested the wrong skill or out-of-scope content are now **quarantined** — withheld from every selection path (practice, diagnostic, assessment, worksheet, recovery, fluency) — while remaining visible to admin/audit. An authoritative re-run of the integrity detector against the **current** source confirms the active (student-facing) family set now has **zero incorrect mappings**.

A key correction surfaced during this work: **the 2026-06-07 audit document was stale.** Its family indices no longer matched the source (the file grew from 110 to 123 families and was partially repaired since), so quarantining by the audit's IDs would have hit the wrong families. Everything below was done by matching the audit's *findings* to current content and re-running the detector, not by trusting the stale IDs.

On the runtime side, the evidence-repair logic already existed and is sound — including a hard guarantee that mistake-level correction is **never** inflated into skill mastery. This sprint added the missing runnable entry point for the recheck/worksheet repairs and surfaced quarantine status in the admin report. Actually persisting those repairs to the database is a one-command follow-up the founder runs.

---

## 1. Quarantine — incorrect families removed from active use

Twelve families are now quarantined. They were identified by **content** against the current source and independently confirmed by re-running the integrity detector (see §2), which flagged exactly these twelve as `Incorrect Mapping` and nothing else.

**Out-of-scope for the F001–F026 pilot (9):**

| Family | Skill | Why |
| --- | --- | --- |
| QF_F013_005 | F013 | Signed/negative fraction comparison |
| QF_F014_005 | F014 | Fraction/decimal ordering |
| QF_F017_004 | F017 | Signed fraction addition |
| QF_F018_005 | F018 | Signed fraction subtraction |
| QF_F021_005 | F021 | Fraction-decimal mixed multiplication |
| QF_F022_005 | F022 | Signed fraction division |
| QF_F023_005 | F023 | Ratio with fractions and decimals |
| QF_F025_005 | F025 | Percentage/fraction/decimal conversion |
| QF_F026_005 | F026 | Algebraic fraction notation |

**Cross-skill — filed under the wrong F-code (3), remap target recorded:**

| Family | Filed under | Belongs to (canonicalSkillId) |
| --- | --- | --- |
| QF_F011_005 | F011 (equivalent-fraction generation) | F007 (same-denominator comparison) |
| QF_F012_004 | F012 (simplification) | F008 (same-numerator comparison) |
| QF_F018_006 | F018 (unlike-fraction addition) | F019 (unlike-fraction subtraction) |

The original audit listed 14; the two it called "QF_F015_004/005 like-denominator addition" no longer exist (F015 is now entirely mixed/improper conversion), so 12 remain live.

**How it works.** A central `QUARANTINED_FAMILIES` map in `fractionQuestionFamilies.js` marks these. `getQuestionFamiliesBySkill()` — the single selector every fraction engine uses — now withholds them, so they can never be served or skew diagnostic routing. The flag also propagates onto any generated question, so the runtime evidence audit flags strays. The full set stays available via `getAllQuestionFamiliesBySkill()` / `getQuarantinedFamilies()` for admin. Every skill keeps ≥1 active family; the cross-skill items keep `canonicalSkillId` for a later remap once content is re-validated.

---

## 2. Authoritative integrity re-run (supersedes the stale audit)

Ran `questionSkillIntegrityService.buildFractionsSkillIntegrityReport` against the current families.

**Full set (123 families):** 82 Correct, 29 Questionable, **12 Incorrect** — the 12 Incorrect are **exactly** the quarantined families above.

**Active set (111 families, quarantined removed):** 82 Correct, 29 Questionable, **0 Incorrect.**

That 0 is the pilot-relevant result: no student-facing fraction family is mapped to the wrong skill. The admin report (`GET /api/admin/fractions-skill-integrity`) now also marks each row with `quarantined` and its remap `canonicalSkillId`, so an admin sees "12 incorrect — all already withheld."

---

## 3. Questionable mappings — review (29)

These test the right skill but with weaker signal (soft issues: `weak_target_signal`, `misconception_alignment_weak`, `contradicts_canonical_scope`, `strong_cross_skill_signal`). They are **not** quarantined — doing so would gut legitimate pilot content. They are listed for content review and should be prioritised before being used as high-stakes diagnostic anchors.

Highest priority (cross-skill resemblance — review wording first): QF_F011_003, QF_F012_003, QF_F017_003, QF_F020_005, QF_F020_006.

High risk (weak target signal — tighten prompt/misconception tags): QF_F007_003, QF_F008_002, QF_F008_003, QF_F009_004, QF_F011_004, QF_F011_006, QF_F012_005, QF_F015_005, QF_F016_005, QF_F019_005, QF_F020_007, QF_F022_003, QF_F023_006, QF_F023_007.

Medium risk (misconception alignment / scope wording): QF_F003_003, QF_F004_002, QF_F005_003, QF_F005_005, QF_F009_001, QF_F020_003, QF_F023_001, QF_F023_002, QF_F024_002, QF_F025_002.

Recommendation: these are copy/tagging refinements, not removals. Re-run the integrity report after each batch of edits; the goal is to move them from Questionable to Correct without shrinking the active pool.

---

## 4. Runtime evidence repair — status and runbook

The repair logic already existed in `fractionsRuntimeEvidenceIntegrityService.js` and is well-designed. This sprint verified it end-to-end on synthetic data and closed the one execution gap.

**Verified guarantees (run offline against the real service functions):**

- Recheck snapshots are repaired: missing target skills normalised to canonical F-codes, legacy misconception tags (e.g. `M001`, `frac/add-denominators`) mapped to current ones, assignment links restored where the reference exists.
- Legacy mistakes are normalised **without inflating mastery** — a mistake marked `mastered`/`resolved` with no actual mastery evidence is downgraded (`resolved: false`, status reduced). This directly upholds the core rule that reviewed/corrected ≠ skill mastery.
- A worksheet audit record is seeded from a recovery-pack assignment when none exists, so the worksheet audit path is no longer empty.
- The pilot claim gate moves from "blocked" toward "clean" as repairs apply.

**What this sprint added:**

- `scripts/runFractionsRuntimeEvidenceRepair.js` — loads runtime evidence from the DB, runs the full repair audit, prints before/after issue counts + the pilot-claim gate + planned patches. Dry-run by default; `--apply` persists recheck patches and the seeded worksheet. (Legacy-mistake writes are intentionally left to the existing `backfillLegacyMistakeEvidence.js` to avoid overlap.)
- Quarantine status surfaced in the admin integrity report rows.

**Runbook (founder runs against the live DB):**

1. `node scripts/runFractionsRuntimeEvidenceRepair.js` — review the dry-run report and the pilot-claim gate.
2. `node scripts/backfillLegacyMistakeEvidence.js --apply` — normalise legacy mistake evidence (existing script).
3. `node scripts/runFractionsRuntimeEvidenceRepair.js --apply` — persist recheck evidence-ref repairs and seed the worksheet audit record.
4. Re-run step 1 (dry-run) to confirm the gate now reads "clean" or only expected "partial".

These steps need a database; they cannot run in the build sandbox.

---

## 5. Tests & verification

- `fractionQuestionFamilies.quarantine.test.js` (new) — the 12 quarantined IDs, withholding from active selection, remap targets, every-skill-keeps-a-family, and flag propagation onto generated questions.
- Existing generator/practice-flow tests still pass; the explicit `QF_F011_005` generation case is unaffected (generation still works for explicit calls; only selection is filtered).
- Integrity detector re-run confirms active set has 0 incorrect mappings.
- Runtime repair chain verified on synthetic data (refs repaired, legacy normalised, worksheet seeded, mastery not inflated, gate improved).

Note: the full vitest/jsdom suite cannot run in the build sandbox (the bundler's native binaries are platform-mismatched and the registry is blocked); all checks above were run directly against the real modules under Node, and the new vitest files run in CI.

---

## 6. Files changed

- `frontend/src/mathpath/fractions/fractionQuestionFamilies.js` — quarantine set, helpers, filtered selector.
- `frontend/src/mathpath/fractions/fractionQuestionGenerator.js` — propagate quarantine flag onto generated questions.
- `frontend/src/mathpath/fractions/fractionQuestionFamilies.quarantine.test.js` — new tests.
- `services/mathpath/questionSkillIntegrityService.js` — surface `quarantined` / `canonicalSkillId` in report rows.
- `scripts/runFractionsRuntimeEvidenceRepair.js` — new DB repair runner (dry-run default).

---

## 7. What remains

- Run the §4 runbook against the live DB and confirm the pilot claim gate.
- Content review of the 29 questionable families (copy/tagging), re-running the integrity report after each batch.
- Later: actually remap the 3 cross-skill families to their `canonicalSkillId` homes (F007/F008/F019) after re-validating their content, then un-quarantine.
- Keep parent/student-facing copy fraction-only and claim-safe; never expose raw F-codes or misconception IDs in student/parent UI.
