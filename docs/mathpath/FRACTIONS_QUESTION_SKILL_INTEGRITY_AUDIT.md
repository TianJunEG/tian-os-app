# Fractions Question-to-Skill Integrity Audit

Date: 2026-06-07

## Status Update (2026-06-10): 14 incorrect families quarantined

The 14 "Incorrect Mapping" pilot blockers below have been **quarantined** in
`frontend/src/mathpath/fractions/fractionQuestionFamilies.js` via
`QUARANTINED_FRACTION_FAMILY_IDS`. Quarantined families are excluded from all live generation
(diagnostic, practice, assessment, worksheet, recovery-pack) through `getQuestionFamiliesBySkill()`,
and any question forced from one now carries a `quarantined` flag that the runtime evidence
integrity service flags (`quarantined_question_reference`, high severity).

Because families were added/reordered after this audit, the same problematic *content* now carries
different positional ids than the table below. The current quarantined ids are:

`QF_F011_005`, `QF_F011_006`, `QF_F012_004`, `QF_F012_005`, `QF_F013_005`, `QF_F014_005`,
`QF_F017_004`, `QF_F018_005`, `QF_F018_006`, `QF_F021_005`, `QF_F022_005`, `QF_F023_005`,
`QF_F025_005`, `QF_F026_005`.

Remapping (rather than quarantine) of the clear-target cases (e.g. F011/F012 comparison → F007/F008,
F018 unlike subtraction → F019) is deferred as content authoring work; quarantine is the pilot-safe
default so no student sees evidence generated against the wrong skill. The 21 "questionable" rows
remain active and should be reviewed in the next content sprint.

## Executive Summary

This audit checks whether Fractions question-family content genuinely matches the canonical F001-F026 skill map.

Verdict: partial pass, with content drift that should be cleaned before relying on high-stakes diagnostic claims.

The canonical mapping is now clear, but the current static question-family layer still contains items that look like older broader curriculum coverage. Several question families are mapped under an F-code while actually testing a different F-code or content outside the active F001-F026 pilot map.

## Scope Audited

Audited source:

- `frontend/src/mathpath/curriculum/fractionCanonicalSkillMap.js`
- `frontend/src/mathpath/fractions/fractionQuestionFamilies.js`

Static question families audited: 110

Current report does not directly query live MongoDB `GeneratedQuestion` records. The new integrity service can validate generated, diagnostic, worksheet, recovery-pack, and recheck questions when passed those records.

## Canonical Reference

Each F001-F026 skill is now treated as a canonical target with:

- canonical meaning
- prerequisites
- expected representations
- expected misconception alignment
- expected question type

Examples:

| Skill | Canonical Meaning | Expected Question Type |
| --- | --- | --- |
| F001 | Identify fractions as equal parts of a whole using simple models. | visual identification / equal parts |
| F010 | Recognise fractions that represent the same value. | equivalent fraction recognition |
| F016 | Add fractions that share a common denominator. | same-denominator addition |
| F018 | Add unlike fractions by finding common denominators first. | unlike-denominator addition |
| F020 | Find a fraction of a discrete or continuous quantity. | fraction of quantity |
| F024 | Solve multi-step fraction tasks involving conversion and operations. | multi-step problem |
| F025 | Handle school-style fraction items in mixed formats and contexts. | exam-style application |
| F026 | Demonstrate consolidated mastery across all fraction strands. | mastery challenge |

## Audit Results

| Metric | Count |
| --- | ---: |
| Audited question families | 110 |
| Correct Mapping | 75 |
| Questionable Mapping | 21 |
| Incorrect Mapping | 14 |
| High Risk | 21 |
| Medium Risk | 14 |
| Low Risk | 75 |

Top issue types:

| Issue | Count |
| --- | ---: |
| contradicts_canonical_scope | 19 |
| weak_target_signal | 19 |
| misconception_alignment_weak | 15 |
| strong_cross_skill_signal | 10 |
| out_of_scope | 9 |

## Critical Pilot Blockers

These rows appear to test the wrong skill or content outside the canonical active Fractions map.

| Question Family | Mapped Skill | Finding |
| --- | --- | --- |
| QF_F011_004 | F011 | Same-denominator comparison is mapped to equivalent-fraction generation. Likely belongs closer to F007. |
| QF_F012_004 | F012 | Same-numerator comparison is mapped to simplification. Likely belongs closer to F008. |
| QF_F013_004 | F013 | Signed/negative fraction comparison is outside the active primary Fractions map. |
| QF_F014_004 | F014 | Fraction/decimal ordering is outside mixed-number interpretation. |
| QF_F015_004 | F015 | Like-denominator addition is mapped to mixed/improper conversion. Likely belongs to F016. |
| QF_F015_005 | F015 | Like-denominator addition with simplification is mapped to mixed/improper conversion. Likely belongs to F016. |
| QF_F017_004 | F017 | Signed fraction addition is outside same-denominator subtraction. |
| QF_F018_005 | F018 | Signed fraction subtraction is outside unlike-denominator addition. |
| QF_F018_006 | F018 | Unlike-fraction subtraction is mapped to unlike-fraction addition. Likely belongs to F019. |
| QF_F021_005 | F021 | Fraction-decimal mixed multiplication extends beyond pure fraction multiplication. |
| QF_F022_005 | F022 | Signed fraction division is outside active primary fraction division scope. |
| QF_F023_005 | F023 | Ratio with fractions and decimals is outside one-step fraction word problems. |
| QF_F025_005 | F025 | Percentage/fraction/decimal conversion is outside exam-style Fractions applications as currently defined. |
| QF_F026_005 | F026 | Algebraic fraction notation is outside the active Fractions mastery challenge scope. |

## High Priority Drift

These may not be hard failures, but they weaken diagnostic precision.

| Question Family | Mapped Skill | Finding |
| --- | --- | --- |
| QF_F007_003 | F007 | Equivalent context check may test equivalence rather than same-denominator comparison. |
| QF_F008_002 | F008 | Ordering set wording is weakly aligned to same-numerator comparison. |
| QF_F008_003 | F008 | Mixed representation comparison may be too broad. |
| QF_F011_005 | F011 | Visual same-denominator comparison is weakly aligned to equivalent-fraction generation. |
| QF_F012_005 | F012 | Same-numerator visual mismatch is weakly aligned to simplification. |
| QF_F022_003 | F022 | Division with simplification/conversion may bundle too many skills. |
| QF_F023_006 | F023 | Set-based fraction counting may be closer to fraction-of-quantity than one-step word problems. |

## Diagnostic Integrity Findings

The new service can validate diagnostic items when they include:

- `skillId` or `skillCode`
- question text
- diagnostic purpose
- misconception tags

Current static question-family drift means any diagnostic generated from the flagged families could route students to the wrong remediation even if the adaptive engine behaves correctly.

Risk: Medium to High for flagged skills.

## Recovery Pack Integrity Findings

Recovery packs are only trustworthy if their guided, independent, mastery-check, and recheck questions inherit correctly mapped items.

Risk:

- Low for skills whose question families are clean.
- High for skills where family drift exists, especially F011, F012, F015, F018, F023, F025, and F026.

## Worksheet Integrity Findings

Worksheet generation selects by `skillId`. If a question is tagged to the wrong skill, worksheet output can look targeted while practising the wrong objective.

This is most risky for:

- same-denominator comparison under F011
- same-numerator comparison under F012
- like-denominator addition under F015
- unlike subtraction under F018
- percentage/decimal/ratio/algebraic items under F023-F026

## Misconception Alignment Findings

Misconception alignment is weak where:

- question content is cross-skill
- tags use older generic IDs
- target skill expectations are not reflected in question tags

Most common issue:

- `misconception_alignment_weak`

This does not always mean the question is wrong, but it reduces diagnostic explainability.

## Drift Detection Engine

Implemented:

- `services/mathpath/questionSkillIntegrityService.js`

The service detects:

- skill mismatch
- prerequisite/cross-skill mismatch
- representation/scope mismatch
- misconception mismatch
- out-of-scope pilot content

Risk levels:

- High
- Medium
- Low

Classifications:

- Correct Mapping
- Questionable Mapping
- Incorrect Mapping

## Admin QA Report

Added admin report endpoint/page:

- API: `GET /api/admin/fractions-skill-integrity`
- UI: `/admin/fractions-skill-integrity`

The report shows:

- audited question count
- incorrect mappings
- questionable mappings
- pilot blockers
- high-priority drift
- canonical reference table

## Recommended Fixes Before Pilot

1. Remove or remap the 14 incorrect question families listed above.
2. Keep signed, ratio, percentage/decimal, and algebraic fraction items out of the active F001-F026 pilot unless the canonical map explicitly adds those outcomes.
3. Remap:
   - QF_F011_004 to F007 or remove
   - QF_F012_004 to F008 or remove
   - QF_F015_004 and QF_F015_005 to F016
   - QF_F018_006 to F019
4. Review the 7 high-priority drift rows before using them in diagnostics, recovery packs, worksheets, or rechecks.
5. Run the integrity report as part of content QA whenever new Fractions question families are added.

## Pilot Readiness Impact

The platform remains technically pilot-ready, but the content-quality risk is real.

Pilot recommendation:

- Do not use flagged incorrect families for diagnostic placement, recovery packs, worksheets, or rechecks.
- Either quarantine flagged families or remap them before pilot content is assigned.

## Next Sprint

Run a targeted Fractions content repair sprint:

1. Quarantine incorrect families.
2. Remap cross-skill families where the target is clear.
3. Regenerate any worksheets/recovery packs seeded from flagged families.
4. Add CI or preflight checks using `questionSkillIntegrityService`.
