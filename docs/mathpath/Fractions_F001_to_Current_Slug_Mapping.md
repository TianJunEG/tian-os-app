# Fractions F001–F026 to Current Slug Mapping

Status: Repository alignment reference for Step 27A.

Purpose:
- Map the intended MathPath Fractions skills (`F001`–`F026`) to the current slug-based domain in `scripts/domains/fractions.js`.
- Preserve slug compatibility while introducing canonical MathPath IDs via metadata.

## Canonical Mapping

| MathPath ID | Intended Skill | Current Slug | Current Seed Skill Name | Coverage |
|---|---|---|---|---|
| F001 | Recognise Fractions | `fr.meaning.parts` | Recognise Fractions | Mapped |
| F002 | Numerator and Denominator | `fr.meaning.num-den` | Numerator and denominator | Mapped |
| F003 | Fraction of a Whole | `fr.meaning.whole` | Fraction of a whole | Mapped |
| F004 | Unit Fractions | `fr.meaning.unit` | Unit fractions | Mapped |
| F005 | Fractions on Number Line | `fr.meaning.number-line` | Fractions on a number line | Mapped |
| F006 | Compare Unit Fractions | `fr.compare.unit` | Comparing unit fractions | Mapped |
| F007 | Compare Same Denominator | `fr.compare.same-denom` | Comparing fractions (same denominator) | Mapped |
| F008 | Compare Same Numerator | `fr.compare.same-num` | Comparing fractions (same numerator) | Mapped |
| F009 | Order Fractions | `fr.order` | Ordering fractions | Mapped |
| F010 | Equivalent Fractions | `fr.equivalent` | Equivalent fractions | Mapped |
| F011 | Generate Equivalent Fractions | `fr.equivalent.generate` | Generate equivalent fractions | Mapped |
| F012 | Simplify Fractions | `fr.simplify` | Simplifying fractions to lowest terms | Mapped |
| F013 | Improper Fractions | `fr.mixed-improper` | Improper fractions | Mapped |
| F014 | Mixed Numbers | `fr.mixed-proper` | Mixed numbers | Mapped |
| F015 | Convert Mixed ↔ Improper | `fr.mixed-convert` | Convert mixed numbers and improper fractions | Mapped |
| F016 | Add Same Denominator | `fr.add.same-denom` | Add fractions with same denominator | Mapped |
| F017 | Subtract Same Denominator | `fr.sub.like` | Subtracting like fractions | Mapped |
| F018 | Add Different Denominators | `fr.add.unlike` | Adding and subtracting unlike fractions | Mapped (primary emphasis: addition) |
| F019 | Subtract Different Denominators | `fr.sub.unlike` | Subtracting unlike fractions | Mapped |
| F020 | Fraction of Quantity | `fr.of-quantity` | Fraction of a quantity | Mapped |
| F021 | Multiply Fractions | `fr.mult.fraction` | Multiplying a fraction by a fraction | Mapped |
| F022 | Divide Fractions | `fr.div.fraction` | Dividing by a fraction | Mapped |
| F023 | Fraction Word Problems | `fr.word-problems` | Fraction word problems | Mapped |
| F024 | Multi-Step Fraction Problems | `fr.word-multi-step` | Multi-step fraction problems | Mapped |
| F025 | Exam-Style Fraction Applications | `fr.exam-applications` | Exam-style fraction applications | Mapped |
| F026 | Fractions Mastery Challenge | `fr.mastery-challenge` | Fractions mastery challenge | Mapped |

## Missing Canonical Skills

No missing `F001`–`F026` skills were found in the current `scripts/domains/fractions.js` mapping.

## Compatibility Metadata Standard

Each seeded Fractions skill now carries:

```json
{
  "mathPathSkillId": "F010",
  "mathPathSkillName": "Equivalent Fractions"
}
```

This preserves slug compatibility while allowing engine/reporting layers to consume canonical MathPath IDs.

