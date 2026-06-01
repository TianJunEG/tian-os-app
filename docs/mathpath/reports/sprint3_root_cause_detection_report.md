# Sprint 3 Root Cause Detection Report

Generated: 2026-06-01

## Status
Completed

## Implemented
Root-cause detection is implemented in `fractionDiagnosticExplainabilityEngine.js`.

The engine uses:
- weak skill IDs
- prerequisite gaps
- question-level correctness
- speed signals
- confidence calibration
- working evidence availability
- misconception library matches

## Example inference
If a student is weak in:
- comparing unit fractions
- comparing same-numerator fractions
- ordering fractions

The engine can infer:
- likely denominator-size misconception
- possible common-denominator reasoning gap
- suggested intervention using fraction bars and equivalent fractions

## Output fields
- `rootCauseId`
- `title`
- `why`
- `evidenceSkillIds`
- `evidenceQuestionIds`
- `suggestedIntervention`
- `confidence`

## Audit rule
Every detected root cause includes evidence and a suggested intervention. No root cause is returned as a bare label.
