# Fractions Pilot Inventory

Audit date: 2026-06-05  
Scope: active Tian OS MathPath Fractions `F001-F026` inventory.  
Audit type: read-only inventory audit. No production data or code was changed.

## Sources Checked

- Active skill graph: `frontend/src/mathpath/fractions/fractionSkillGraph.js`
- SG curriculum mappings: `frontend/src/mathpath/curriculum/fractionCurriculumMappings.js`
- Question coverage report: `docs/mathpath/Fractions_Content_Coverage_Report.md`
- Working metadata: `frontend/src/mathpath/fractions/fractionQuestionGenerator.js`
- Practice working flow: `frontend/src/mathpath/fractions/fractionPracticeFlow.js`
- Working upload workflow: `frontend/src/mathpath/working/workingUploadWorkflow.js`

Coverage counts below come from the latest checked-in DB-backed report generated on `2026-06-04T06:12:42.077Z`.

## Pilot Readiness Rules Used

Minimum pilot threshold:

- Diagnostic coverage: at least 3
- Practice coverage: at least 10
- Remediation coverage: at least 3
- Worksheet-compatible coverage: at least 5
- Working evidence support: supported in generated question/session metadata

Status labels:

- `pilot-ready`: meets minimum coverage thresholds and has working evidence support.
- `partial`: has some coverage but misses a minimum pilot threshold or has a serious mapping risk.
- `insufficient`: coverage exists but is below pilot minimum.
- `mapping-risk`: coverage may pass, but the skill code/title/curriculum mapping is inconsistent enough to require correction before scale-up.

## Executive Summary

- Active skill count: 26 skills, `F001-F026`.
- Coverage score in latest DB report: `100/100` pilot readiness.
- Pilot-ready by coverage only: 26/26.
- Skills below pilot minimum coverage: 0/26.
- Skills below full 100-item coverage target: 26/26.
- Predominant level by current SG curriculum mapping bucket: P4/readiness foundations.
- Bucket count by current mapping:
  - P4/readiness bucket: 22 skills
  - P5 bucket: 2 skills
  - P6 bucket: 2 skills
- Major concern: the active skill titles in `fractionSkillGraph.js` do not reliably match the SG curriculum mapping rows in `fractionCurriculumMappings.js`. This means a skill can show good question coverage while being mapped to the wrong MOE level or syllabus outcome.

## Key Verdict

The current Fractions inventory is pilot-ready for a controlled P4-P6 internal/student pilot if the pilot is framed as a broad Fractions readiness path.

It is not yet clean enough to treat the `F001-F026` codes as authoritative curriculum micro-skills. The primary blocker for scale-up is not raw question count. It is mapping correctness: several active F-code titles and curriculum mapping titles are misaligned.

## P4 / Readiness Bucket

This bucket includes skills whose mapped mastery level is P4 or below. Some are actually P2/P3 foundations currently placed inside the P4 readiness path.

| Skill | Active skill title | Mapped MOE level | Total questions | Diagnostic | Practice | Remediation | Worksheet | Working evidence support | Status |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| F001 | Recognise Fractions | P2 -> P2 | 61 | 9 | 28 | 3 | 46 | Supported; optional/visual working | pilot-ready |
| F002 | Numerator and Denominator | P2 -> P2 | 65 | 9 | 32 | 3 | 50 | Supported; optional/visual working | pilot-ready |
| F003 | Fraction of a Whole | P2 -> P2 | 55 | 10 | 27 | 3 | 47 | Supported; optional/visual working | mapping-risk |
| F004 | Unit Fractions | P2 -> P2 | 58 | 10 | 24 | 3 | 43 | Supported; optional/visual working | mapping-risk |
| F005 | Fractions on Number Line | P2/P3 -> P3 | 52 | 10 | 22 | 3 | 41 | Supported; optional/visual working | pilot-ready |
| F006 | Compare Unit Fractions | P2 -> P2 | 47 | 10 | 17 | 3 | 33 | Supported; optional/visual working | pilot-ready |
| F007 | Compare Same Denominator | P3 -> P3 | 61 | 10 | 26 | 3 | 46 | Supported; optional/visual working | mapping-risk |
| F008 | Compare Same Numerator | P3 -> P3 | 57 | 10 | 25 | 3 | 45 | Supported; optional/visual working | mapping-risk |
| F009 | Order Fractions | P3 -> P3 | 51 | 10 | 22 | 3 | 42 | Supported; optional/visual working | mapping-risk |
| F010 | Equivalent Fractions | P3 -> P3 | 67 | 10 | 32 | 3 | 52 | Supported; optional/visual working | mapping-risk |
| F011 | Generate Equivalent Fractions | P2 -> P2/P3 | 62 | 9 | 29 | 3 | 48 | Supported; optional/visual working | mapping-risk |
| F012 | Simplify Fractions | P2/P3 -> P3 | 61 | 9 | 31 | 3 | 48 | Supported; optional/visual working | mapping-risk |
| F013 | Improper Fractions | P3 -> P3 | 62 | 10 | 31 | 3 | 51 | Supported; optional/visual working | mapping-risk |
| F014 | Mixed Numbers | P2/P3 -> P3 | 64 | 10 | 30 | 3 | 50 | Supported; optional/visual working | mapping-risk |
| F015 | Convert Mixed <-> Improper | P2 -> P2/P3 | 63 | 10 | 28 | 3 | 48 | Required in practice/session metadata | mapping-risk |
| F016 | Add Same Denominator | P2 -> P2/P3 | 62 | 10 | 27 | 3 | 47 | Supported; calculation working where family requires it | mapping-risk |
| F017 | Subtract Same Denominator | P3 -> P4 | 64 | 9 | 31 | 3 | 50 | Required in practice/session metadata | mapping-risk |
| F018 | Add Different Denominators | P3 -> P4 | 52 | 10 | 19 | 3 | 37 | Required in practice/session metadata | mapping-risk |
| F019 | Subtract Different Denominators | P4 -> P4 | 61 | 10 | 27 | 3 | 47 | Supported; calculation working where family requires it | mapping-risk |
| F020 | Fraction of Quantity | P4 -> P4 | 67 | 10 | 32 | 3 | 52 | Supported; calculation working where family requires it | mapping-risk |
| F021 | Multiply Fractions | P4 -> P4 | 60 | 8 | 30 | 3 | 46 | Supported; calculation working where family requires it | mapping-risk |
| F025 | Exam-Style Fraction Applications | P2/P3 -> P4 | 64 | 9 | 31 | 3 | 49 | Required in practice/session metadata | mapping-risk |

## P5 Bucket

| Skill | Active skill title | Mapped MOE level | Total questions | Diagnostic | Practice | Remediation | Worksheet | Working evidence support | Status |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| F022 | Divide Fractions | P5 -> P5 | 62 | 7 | 33 | 3 | 47 | Supported; calculation working where family requires it | mapping-risk |
| F023 | Fraction Word Problems | P4 -> P4/P5 | 67 | 10 | 33 | 3 | 52 | Required in practice/session metadata | mapping-risk |

## P6 Bucket

| Skill | Active skill title | Mapped MOE level | Total questions | Diagnostic | Practice | Remediation | Worksheet | Working evidence support | Status |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| F024 | Multi-Step Fraction Problems | P4/P5 -> P5/P6 | 65 | 10 | 30 | 3 | 50 | Supported; model/calculation working where family requires it | mapping-risk |
| F026 | Fractions Mastery Challenge | P4/P5 -> P5/P6 | 64 | 10 | 33 | 3 | 52 | Required in practice/session metadata | mapping-risk |

## Which Skills Are Truly Pilot-Ready?

By coverage thresholds only, all 26 skills are pilot-ready.

For a controlled pilot, these are usable now:

- F001-F026 all meet diagnostic, practice, remediation, and worksheet-compatible minimums.
- All generated question payloads support working metadata fields such as `workingRequired`, `requiresWorking`, `workingOptional`, `allowNoWorking`, `workingType`, and `workingPrompt`.
- Practice/session flow supports working evidence collection through full-screen working, paper-working declaration, and upload workflow.

However, the word "truly" depends on whether curriculum mapping correctness is included:

- Coverage-ready: 26/26.
- Curriculum-clean and scale-ready: not yet.
- Mapping-risk skills: most of F003-F026 require a curriculum/code alignment pass.

## Which Skills Are Partially Implemented?

No skill is partial by pilot minimum coverage.

All 26 are partial by full-content depth because every skill is below the full 100-item target in `Fractions_Content_Coverage_Report.md`.

The largest full-depth gaps are:

- F006: 47/100
- F005: 52/100
- F018: 52/100
- F009: 51/100
- F003: 55/100

These are not pilot blockers but should be treated as post-pilot expansion targets.

## Which Skills Have Insufficient Question Coverage?

Against pilot minimums:

- None.

Against full target of 100 items per skill:

- All 26 are below full coverage.

The current system is therefore pilot-ready, not full-production content-complete.

## Predominant Level of the Current 26-Skill Structure

By the current primary curriculum mapping fields:

- The structure is predominantly P4/readiness-oriented.
- 22 of 26 skills fall into the P4-or-below bucket when grouped by mapped mastery level.
- Only 2 are currently grouped into P5 and 2 into P6.

By active skill titles in `fractionSkillGraph.js`, the structure appears broader than P4:

- Early skills are foundations and comparison.
- Middle skills include equivalence, conversion, same-denominator operations, and unlike-denominator operations.
- Later skills include multiplication/division, word problems, multi-step applications, exam-style applications, and a mastery challenge.

This mismatch is why the inventory should not be interpreted as a clean MOE P4/P5/P6 scope until mapping is corrected.

## Suspected Wrong-Level or Wrong-Meaning Mappings

The most serious audit finding is that the same F-code can mean one thing in the active skill graph and another thing in the curriculum mapping table.

Examples:

| Skill | Active skill graph title | Curriculum mapping title | Risk |
|---|---|---|---|
| F007 | Compare Same Denominator | Equivalent fractions using models | Wrong concept mapping |
| F008 | Compare Same Numerator | Equivalent fractions using multiplication | Wrong concept mapping |
| F009 | Order Fractions | Equivalent fractions using division | Wrong concept mapping |
| F010 | Equivalent Fractions | Simplifying fractions | Wrong concept mapping |
| F011 | Generate Equivalent Fractions | Comparing fractions with same denominator | Wrong concept mapping |
| F012 | Simplify Fractions | Comparing fractions with same numerator | Wrong concept mapping |
| F013 | Improper Fractions | Comparing unlike fractions | Wrong concept mapping |
| F014 | Mixed Numbers | Ordering fractions | Wrong concept mapping |
| F015 | Convert Mixed <-> Improper | Adding like fractions | Wrong concept mapping |
| F016 | Add Same Denominator | Subtracting like fractions | Wrong concept mapping |
| F017 | Subtract Same Denominator | Adding unlike fractions | Wrong concept mapping |
| F018 | Add Different Denominators | Subtracting unlike fractions | Wrong concept mapping |
| F019 | Subtract Different Denominators | Improper fractions | Wrong concept mapping |
| F020 | Fraction of Quantity | Mixed numbers | Wrong concept mapping |
| F021 | Multiply Fractions | Converting between mixed numbers and improper fractions | Wrong concept mapping |
| F022 | Divide Fractions | Adding and subtracting mixed numbers | Wrong concept mapping |
| F023 | Fraction Word Problems | Fraction of a quantity / set | Wrong or too narrow |
| F024 | Multi-Step Fraction Problems | Remainder concept | Partial overlap only |
| F025 | Exam-Style Fraction Applications | Basic fraction word problems | Wrong or too broad |
| F026 | Fractions Mastery Challenge | Multi-step fraction word problems | Partial overlap only |

These mapping mismatches can affect:

- diagnostic placement explanations
- parent/tutor reporting
- level grouping
- assessment readiness gates
- remediation recommendations
- future expansion to P1-S1 tracks

## Working Evidence Support

Working evidence is globally supported in the question and practice flow.

Observed support:

- Generated questions include working metadata.
- Practice flow creates working sessions and question-working maps.
- Full-screen working and paper-upload flows are integrated.
- Required-working logic is strongest for selected operation/application skills:
  - F015
  - F017
  - F018
  - F023
  - F025
  - F026
- Calculation/model support exists for other operation/application skills depending on family metadata:
  - F016
  - F019
  - F020
  - F021
  - F022
  - F024
- Earlier visual/conceptual skills support optional or visual working.

Risk:

- F024 is a multi-step skill by active title, but it is not in the hard required-working list in `shouldRequireWorkingForGeneratedQuestion`. It can still require working through question-family metadata, but the explicit skill-level rule should be reviewed.

## Final Go / No-Go View

Pilot go for controlled use:

- Yes, if the pilot goal is to test the student learning loop, working evidence, diagnostic/practice flow, and Fractions readiness experience.

Not ready for curriculum-scale claims:

- Do not claim the 26-skill structure is a clean MOE P4/P5/P6 scope until F-code curriculum mappings are corrected.
- Do not use the current mapping as an authoritative external syllabus map in parent-facing claims.

## Recommended Next Step

Run a mapping correction pass before adding more content:

1. Decide whether the source of truth is the active `fractionSkillGraph.js` titles or the newer micro-skill curriculum audit.
2. Rebuild `fractionCurriculumMappings.js` so each F-code title, introduced level, mastery level, and syllabus outcome matches the active skill.
3. Re-run coverage and diagnostic reports after remapping.
4. Only then split F001-F026 into finer P4/P5/P6 micro-skills if needed.

