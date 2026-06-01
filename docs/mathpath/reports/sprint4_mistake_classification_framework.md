# Sprint 4 Mistake Classification Framework

Status: Completed

## Framework

Fractions mistakes are now classified with a stable mistake id, category, severity level, root-cause skills, remediation skills, evidence, history and next action.

## Categories

- Knowledge Gap
- Conceptual Misconception
- Procedure Error
- Careless Error
- Question Misread
- Confidence Error
- Fluency Deficit
- Exam Technique Error
- Working Evidence Deficit

## Severity

- Minor: likely self-correction or one-off slip
- Moderate: needs targeted practice
- Major: needs reteach plus guided practice
- Critical: repeated or foundational issue requiring adult review

## Implementation

- `frontend/src/mathpath/fractions/fractionMistakeToMasteryEngine.js`
- `models/Mistake.js`

Existing legacy `severity` values are retained for compatibility. Sprint 4 adds `severityLevel` using Minor/Moderate/Major/Critical semantics.
