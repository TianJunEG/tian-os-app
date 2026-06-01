# Sprint 3 Diagnostic Mockups

Generated: 2026-06-01

## Student Diagnostic Mockup
Status: Completed/Integrated

Sections:
- Diagnostic Summary
- Why this readiness score?
- Root cause explanation
- Timing + fluency
- Recommended Starting Skill
- Evidence by skill
- Detailed placement report

Language:
- short
- student-friendly
- action-oriented

## Parent Diagnostic Mockup
Status: Partial

Proposed sections:
- What your child can do
- What needs more practice
- Why this may be happening
- Confidence and fluency notes
- Recommended next action
- Worksheet recommendation

Data available now:
- `recommendations.parent`
- `rootCauses`
- `misconceptions`
- `skillEvidence`
- `readinessComponents`

## Tutor Diagnostic Mockup
Status: Partial

Proposed sections:
- Root cause priority
- Misconception cluster
- Evidence question IDs
- Suggested lesson sequence
- Suggested worksheets

Data available now:
- `recommendations.tutor`
- `rootCauses`
- `misconceptions`
- `masteryBands`
- `confidenceInsights`
- `fluencyInsights`

## Teacher Diagnostic Mockup
Status: Partial

Proposed sections:
- Class mastery overview
- Group by common misconception
- Students requiring intervention
- Suggested remediation groups

Data available now:
- `recommendations.teacher`
- misconception IDs
- root cause IDs
- skill evidence rows

## Notes
The student view is implemented in `DiagnosticResultScreen.jsx`. Parent, tutor, and teacher pages can now consume the same explainability payload in a later UI pass.
