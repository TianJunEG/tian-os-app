# Fractions Curriculum Map

Audit date: 2026-06-07  
Scope: Tian OS MathPath Fractions intervention pilot only.  
Status: canonical mapping for active `F001-F026` Fractions skills.

## Pilot Scope

Tian OS should describe this pilot as a **Fractions intervention pilot**.

Do not describe the current MathPath product as:

- full P1-P6 MathPath
- complete Singapore Math coverage
- school-ready P1-P6 intervention
- complete Primary Mathematics coverage

The current Fractions map is suitable for a controlled Fractions pilot and for parent/tutor/student-care reporting that is explicitly scoped to Fractions.

## Source Of Truth

The canonical F-code map lives in:

- `frontend/src/mathpath/curriculum/fractionCanonicalSkillMap.js`

This map is the source of truth for:

- F-code to slug mapping
- display names
- student-friendly names
- parent-friendly names
- topic grouping
- level alignment
- prerequisites
- question-family mappings
- pilot-scope wording

The following files derive from the canonical map and should not drift independently:

- `frontend/src/mathpath/curriculum/fractionUniversalSkills.js`
- `frontend/src/mathpath/curriculum/fractionCurriculumMappings.js`
- `services/mathpath/skillDisplayNameService.js`
- `services/mathpath/fractionCurriculumAuditService.js`

The active skill graph remains an implementation input and should match the canonical map:

- `frontend/src/mathpath/fractions/fractionSkillGraph.js`

The audit service is the validation layer, not the source of truth. It should detect drift across diagnostics, recovery packs, rechecks, worksheets, and reports without owning a separate mapping table.

## Migration Rules

Preserve `F001-F026` IDs because they are already used in attempts, diagnostics, mistakes, assignments, worksheets, paper analysis, recovery packs, and reports.

Do not rename persisted F-codes casually. If an old persisted record contains a slug or lower-case F-code, repair it through a dry-run migration script first.

Canonical rule:

```json
{
  "skillId": "F018",
  "slug": "fractions.add_different_denominators",
  "studentName": "Adding fractions with different denominators",
  "parentName": "Adding fractions with different denominators"
}
```

Student, parent, tutor, and report surfaces should use friendly labels. Raw F-codes are allowed only in admin/debug/audit contexts.

## Reporting Rules

Parent and student-facing reports should make narrow, evidence-backed statements.

Allowed:

- "Your child improved in these Fractions skills."
- "This Fractions intervention identified evidence of improvement."
- "Your child is ready for a recheck in this skill."
- "More practice is recommended before another recheck."

Avoid:

- "Your child has mastered Fractions."
- "MathPath identified all weak areas."
- "Full P1-P6 MathPath coverage."
- "Complete Singapore Math coverage."
- "School-ready Singapore Math platform."

Every improvement claim should be traceable to at least one of:

- diagnostic snapshot
- practice attempt
- correction evidence
- recovery pack progress
- mastery check
- recheck result
- working evidence

## Mastery Claim Rules

Mistake-level mastery and skill-level mastery are different.

A successful correction may support a claim such as:

- "Your child corrected this mistake."
- "Your child showed understanding of this question."

It must not by itself support:

- "Your child mastered this Fractions skill."
- "Your child has mastered Fractions."

Skill-level mastery requires broader evidence, such as:

- independent practice success
- mastery check success
- recheck success
- repeated accurate attempts across the skill

Recovery Pack completion can support "ready for recheck" only when the required learning evidence exists. It should not automatically become skill mastery.

## Confidence Labels

Use parent-friendly confidence labels:

| Label | Meaning | Use when |
|---|---|---|
| High Confidence | Multiple evidence sources agree. | Diagnostic, independent/recheck evidence, and sufficient attempts support the same conclusion. |
| Moderate Confidence | Evidence is useful but not complete. | At least two signals agree, such as practice plus working evidence, or diagnostic plus paper review. |
| Limited Evidence | Treat as an early signal. | Only one weak signal exists, or the evidence is incomplete. |

Do not expose internal scoring, raw weighting, or developer diagnostics to parents or students.

## Canonical F001-F026 Mapping

| F-code | Canonical slug | Display name | Student label | Parent label | Introduced | Mastery | Topic | Prerequisites | Question families |
|---|---|---|---|---|---|---|---|---|---|
| F001 | fractions.recognise_fractions | Recognise Fractions | Recognising fractions | Recognising fractions as equal parts | P2 | P2 | Understanding Fractions | - | QF_F001_001, QF_F001_002 |
| F002 | fractions.numerator_denominator | Numerator and Denominator | Understanding top and bottom numbers | Understanding numerator and denominator | P2 | P2 | Understanding Fractions | F001 | QF_F002_001, QF_F002_002 |
| F003 | fractions.fraction_of_whole | Fraction of a Whole | Finding fractions of a whole | Representing a fraction of one whole | P2 | P3 | Understanding Fractions | F001, F002 | QF_F003_001, QF_F003_002 |
| F004 | fractions.unit_fractions | Unit Fractions | Understanding unit fractions | Understanding unit fractions | P2 | P3 | Understanding Fractions | F003 | QF_F004_001, QF_F004_002 |
| F005 | fractions.number_line | Fractions on Number Line | Fractions on a number line | Placing fractions on a number line | P3 | P4 | Representing Fractions | F003 | QF_F005_001, QF_F005_002 |
| F006 | fractions.compare_unit_fractions | Compare Unit Fractions | Comparing unit fractions | Comparing unit fractions | P3 | P4 | Comparing Fractions | F004, F005 | QF_F006_001, QF_F006_002 |
| F007 | fractions.compare_same_denominator | Compare Same Denominator | Comparing fractions with the same denominator | Comparing fractions with the same denominator | P3 | P4 | Comparing Fractions | F003 | QF_F007_001, QF_F007_002 |
| F008 | fractions.compare_same_numerator | Compare Same Numerator | Comparing fractions with the same numerator | Comparing fractions with the same numerator | P4 | P4 | Comparing Fractions | F004, F006 | QF_F008_001, QF_F008_002 |
| F009 | fractions.order_fractions | Order Fractions | Ordering fractions | Ordering fractions | P4 | P5 | Comparing Fractions | F006, F007, F008 | QF_F009_001, QF_F009_002 |
| F010 | fractions.equivalent_fractions | Equivalent Fractions | Recognising equivalent fractions | Recognising equivalent fractions | P3 | P4 | Equivalent Fractions | F003, F007 | QF_F010_001, QF_F010_002 |
| F011 | fractions.generate_equivalent_fractions | Generate Equivalent Fractions | Making equivalent fractions | Generating equivalent fractions | P4 | P5 | Equivalent Fractions | F010 | QF_F011_001, QF_F011_002 |
| F012 | fractions.simplify_fractions | Simplify Fractions | Simplifying fractions | Simplifying fractions | P4 | P5 | Equivalent Fractions | F011 | QF_F012_001, QF_F012_002 |
| F013 | fractions.improper_fractions | Improper Fractions | Understanding improper fractions | Understanding improper fractions | P4 | P4 | Improper Fractions and Mixed Numbers | F003, F010 | QF_F013_001, QF_F013_002 |
| F014 | fractions.mixed_numbers | Mixed Numbers | Understanding mixed numbers | Understanding mixed numbers | P4 | P5 | Improper Fractions and Mixed Numbers | F013 | QF_F014_001, QF_F014_002 |
| F015 | fractions.convert_mixed_improper | Convert Mixed to/from Improper | Changing mixed numbers and improper fractions | Converting between mixed numbers and improper fractions | P4 | P5 | Improper Fractions and Mixed Numbers | F013, F014 | QF_F015_001, QF_F015_002 |
| F016 | fractions.add_same_denominator | Add Same Denominator | Adding fractions with the same denominator | Adding fractions with the same denominator | P3 | P4 | Fraction Operations | F007, F010 | QF_F016_001, QF_F016_002 |
| F017 | fractions.subtract_same_denominator | Subtract Same Denominator | Subtracting fractions with the same denominator | Subtracting fractions with the same denominator | P3 | P4 | Fraction Operations | F007, F016 | QF_F017_001, QF_F017_002 |
| F018 | fractions.add_different_denominators | Add Different Denominators | Adding fractions with different denominators | Adding fractions with different denominators | P5 | P5 | Fraction Operations | F011, F012, F016 | QF_F018_001, QF_F018_002 |
| F019 | fractions.subtract_different_denominators | Subtract Different Denominators | Subtracting fractions with different denominators | Subtracting fractions with different denominators | P5 | P5 | Fraction Operations | F011, F012, F017 | QF_F019_001, QF_F019_002 |
| F020 | fractions.fraction_of_quantity | Fraction of Quantity | Finding a fraction of a quantity | Finding a fraction of a quantity | P4 | P5 | Fraction Applications | F003, F010, F016 | QF_F020_001, QF_F020_002 |
| F021 | fractions.multiply_fractions | Multiply Fractions | Multiplying fractions | Multiplying fractions | P6 | P6 | Fraction Operations | F012, F015 | QF_F021_001, QF_F021_002 |
| F022 | fractions.divide_fractions | Divide Fractions | Dividing fractions | Dividing fractions | P6 | P6 | Fraction Operations | F021 | QF_F022_001, QF_F022_002 |
| F023 | fractions.word_problems | Fraction Word Problems | Solving fraction word problems | Solving fraction word problems | P5 | P6 | Fraction Applications | F018, F019, F020 | QF_F023_001, QF_F023_002 |
| F024 | fractions.multi_step_problems | Multi-Step Fraction Problems | Solving multi-step fraction problems | Solving multi-step fraction problems | P6 | P6 | Fraction Applications | F023, F021 | QF_F024_001, QF_F024_002 |
| F025 | fractions.exam_style_applications | Exam-Style Fraction Applications | Solving exam-style fraction questions | Solving exam-style fraction applications | P6 | P6 | Fraction Applications | F024, F022 | QF_F025_001, QF_F025_002 |
| F026 | fractions.mastery_challenge | Fractions Mastery Challenge | Putting fraction skills together | Consolidating fraction skills | P6 | P6 | Fraction Applications | F025 | QF_F026_001, QF_F026_002 |

## Known Limitations

- The map covers Fractions only.
- It does not certify complete P1-P6 MathPath coverage.
- Some existing historical data may still contain old slug aliases or lower-case F-code variants; run `scripts/auditAndRepairFractionSkillMappings.js` in dry-run mode before applying any repair.
- Question quality, visual model coverage, and recovery-pack asset coverage are separate readiness dimensions and should not be inferred from this mapping alone.

## Validation

Focused validation should cover:

- all `F001-F026` exist exactly once
- every F-code has one canonical slug
- every F-code has student and parent display labels
- active skill graph names match canonical display names
- curriculum mappings derive from canonical rows
- question families map only to valid F-codes
- student/parent-facing components use friendly labels instead of raw F-codes
