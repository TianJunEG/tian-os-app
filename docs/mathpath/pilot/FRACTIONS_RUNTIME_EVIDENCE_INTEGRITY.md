# Fractions Runtime Evidence Integrity

Audit date: 2026-06-07

Scope: runtime/live-like Fractions evidence linked to canonical `F001-F026` curriculum map.

Audit type: read-only runtime integrity audit plus deterministic unit fixtures for missing local DB object types. No production code paths were changed and no DB repair/apply mode was run.

## Executive Summary

Static curriculum mapping is clean, but runtime evidence is not yet fully pilot-strong.

The local DB sample shows:

- Canonical skill map: available for all 26 Fractions skills.
- Recovery Packs: 1 audited, 1 Ready.
- Rechecks: 2 audited, 2 Not Ready.
- Worksheets: 0 local DB records found for `domain = fractions`.
- Paper Analysis: 1 audited, 1 Ready.
- Diagnostics: 17 audited.
- Mistakes: 7 shared MathPath mistake records audited.
- MathPath mistake records: 47 audited.
- Generated questions: 1,250 active Fractions records sampled.
- Curated Recovery Pack references: 4 audited.
- Misconception density: 1 skill Ready, 25 skills Partial, 0 Not Ready.

Verdict: Partial.

The runtime layer proves that canonical skills can be resolved and one Recovery Pack path is healthy, but recheck/question linkage and misconception tagging are still too thin for stronger parent/tutor claims beyond a controlled Fractions intervention pilot.

## Records Audited

Read-only local DB audit command:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/tutor-match \
MONGODB_URI_LOCAL=mongodb://127.0.0.1:27017/tutor-match \
node --input-type=module
```

Summary:

| Runtime area | Count |
|---|---:|
| MathPath assignments | 1 |
| Recovery Packs | 1 |
| Recheck diagnostics | 2 |
| Worksheets | 0 |
| PaperAnalysis records | 1 |
| Report payloads | 1 |
| Diagnostics | 17 |
| Shared Mistakes | 7 |
| MathPathMistakeRecord | 47 |
| GeneratedQuestion | 1,250 |
| Curated references | 4 |

No persistent seed records were created. Worksheet and report-claim edge cases were validated through focused unit fixtures because the local DB sample had no Fractions worksheet records.

## Readiness Counts

| Area | Ready | Partial | Not Ready |
|---|---:|---:|---:|
| Recovery Packs | 1 | 0 | 0 |
| Rechecks | 0 | 0 | 2 |
| Worksheets | 0 | 0 | 0 |
| PaperAnalysis | 1 | 0 | 0 |
| Misconception density | 1 | 25 | 0 |

Issue counts from local DB audit:

| Severity | Count |
|---|---:|
| Critical | 6 |
| High | 2 |
| Medium | 76 |
| Low | 0 |

## Recovery Pack Integrity

Local DB result: Ready.

Observed:

- Target skill IDs resolve to canonical Fractions skills.
- Recovery Pack source evidence exists.
- Guided/independent/mastery references were present.
- Curated references resolved in the sampled Recovery Pack path.
- The audited Recovery Pack did not require fallback rendering for normal pilot flow.

Remaining risk:

- Only one Recovery Pack existed in the local DB sample.
- This is not enough to certify all `F001-F026` Recovery Pack runtime paths.

## Recheck Integrity

Local DB result: Not Ready for both audited rechecks.

Issues found:

| Issue | Count | Impact |
|---|---:|---|
| Missing question reference | 2 | Recheck references could not be resolved to `GeneratedQuestion` / `Question` records. |
| Missing misconception specificity | 2 | Rechecks are skill-linked but do not preserve targeted misconception evidence. |

Examples:

- Recheck `6a252d54b8e4797f49953c1c` references missing question `6a24320c2392a65bf1a78729`.
- Recheck `6a252a0ad805803044dc51b5` references missing question `6a24320c2392a65bf1a7872f`.

Pilot impact:

- These rechecks can still function as broad skill reassessments if the diagnostic engine supplies questions at runtime.
- They are not yet strong enough for claims like "this misconception was fixed" because the runtime record does not preserve misconception-specific target evidence.

## Worksheet Integrity

Local DB result: no Fractions worksheet records found.

Unit-fixture validation confirms the audit service detects:

- wrong canonical skill references
- worksheet question/target skill mismatches
- raw `F###` labels in worksheet user-facing copy
- missing source links

Pilot impact:

- Worksheet runtime integrity is not certified from local DB evidence.
- The next QA pass needs at least one real Recovery Pack / PaperAnalysis / Recheck worksheet record.

## Paper Analysis Integrity

Local DB result: Ready for the single sampled record.

Observed:

- PaperAnalysis skill references resolved.
- Report payload did not trigger broad-scope claim violations in the sampled record.
- Status was compatible with adult-review-first workflow.

Remaining risk:

- Only one PaperAnalysis record was present in the sample.
- Paper-analysis misconception density is still thin unless detected questions carry canonical misconception tags consistently.

## Report Claim Integrity

The runtime service checks parent/tutor/student-care/teacher report-like payloads for:

- raw `F###` labels
- "mastered Fractions"
- "all weak areas"
- "complete Singapore Math"
- "full P1-P6"
- "school-ready"
- invalid confidence labels
- mistake-level mastery being treated as skill-level mastery

Local DB report sample did not trigger broad-claim issues.

Unit fixtures confirm broad `P1-P6/full MathPath` claims are blocked as critical audit issues.

## Misconception Link Density

Runtime density result:

- Ready: 1 skill
- Partial: 25 skills
- Not Ready: 0 skills

The strong skill in the local sample was `F018`, because generated questions and the available Recovery Pack carried relevant misconception evidence.

Most other skills are Partial because generated question metadata exists, but runtime intervention/recheck records do not yet show enough misconception-linked evidence.

Common sparse-link patterns:

- `MathPathMistakeRecord.mistakeCode` uses generic/legacy codes such as `M001`, `M002`, `M003`, `M004`, `M006`, or `practice_error`.
- Some shared `Mistake` records use ObjectId-like skill references instead of canonical `F###` skill codes.
- Some diagnostic per-skill snapshots attach `common_denominator_missing` to `F020`, which is not mapped as a primary/secondary misconception for Fraction of Quantity.

Pilot impact:

- Skill-level weak-area claims are still usable.
- Misconception-specific claims should remain cautious unless the runtime record has explicit mapped tags.

## Curated Reference Check

The service checks Recovery Pack guided, independent, mastery, and recheck references against:

- `GeneratedQuestion.sourceQuestionId`
- `GeneratedQuestion.fingerprint`
- `GeneratedQuestion.templateId`
- `GeneratedQuestion.questionFamilyId`
- generic question IDs where supplied

Local DB result:

- 4 curated references audited.
- The sampled Recovery Pack references resolved.

Unit fixtures confirm the service flags:

- fallback-only references
- missing GeneratedQuestion/Question records
- questions without explanations
- questions without misconception tags in intervention contexts
- questions mapped to the wrong canonical skill

## Issues Found

Critical:

- 6 shared `Mistake` records in the sample had skill references that did not resolve directly to canonical `F001-F026`. These appear to be shared-model ObjectId skill references rather than canonical MathPath skill codes.

High:

- 2 recheck question references did not resolve to available generated/question records.

Medium:

- 76 mostly misconception-link issues:
  - rechecks missing misconception specificity
  - diagnostic/mistake misconception tags not mapped to target skill
  - generic mistake codes in `MathPathMistakeRecord`
  - broad runtime misconception density still partial for most skills

## Issues Fixed

No runtime data repairs were applied in this sprint.

Reason:

- The gaps are evidence/data-shape issues, not safe one-line deterministic metadata fixes.
- Some records use legacy/shared ObjectId skill references and require a migration plan before mutation.
- Recheck missing question references require either preserved generated-question IDs or explicit diagnostic question snapshots.
- Misconception-code normalization requires a mapping from legacy `M###`/`practice_error` codes to canonical misconception IDs.

## Pilot Readiness Impact

5-student controlled Fractions pilot:

- Still viable with caveats.
- Do not overclaim misconception-level repair unless the specific runtime chain includes mapped misconception evidence.

20-50 student parent pilot:

- Not certified from this runtime evidence audit.
- Recheck and misconception-link density need tightening first.

Tutor/student-care assisted Fractions pilot:

- Partial.
- Adult support can compensate for sparse misconception tags, but reports should surface confidence/limited-evidence labels.

School pilot:

- Not ready.
- Runtime evidence is not yet robust enough for school-scale claims.

## Recommended Next Sprint

Fractions Runtime Evidence Repair Pass

Focus:

1. Normalize shared `Mistake` skill references so MathPath mistakes preserve canonical `skillCode`.
2. Map legacy `M###` and `practice_error` mistake codes to canonical misconception IDs where deterministic.
3. Ensure recheck diagnostics preserve:
   - assignmentId
   - targetSkillIds
   - targetMisconceptionIds
   - question snapshot/reference IDs that resolve later
4. Seed or generate one real worksheet from:
   - Recovery Pack
   - PaperAnalysis
   - Recheck
5. Re-run this audit and require:
   - Recovery Packs: Ready
   - Rechecks: Ready or Partial, no missing question refs
   - Worksheets: at least one audited Ready record
   - Misconception density: no Not Ready and at least target pilot skills Ready

