# Sprint 6 Fluency Framework

Status: Completed

## Principle

Knowledge, fluency and retention are measured separately.

## Fluency Inputs

- Accuracy
- Effective answer time
- Consistency across attempts, sessions and variants
- Working dependence
- Confidence

## Fluency States

- Not Yet Fluent
- Developing Fluency
- Functional Fluency
- Fluent
- Automatic

## Implementation

- `frontend/src/mathpath/fractions/fractionFluencyRetentionEngine.js`
- `calculateSkillFluencyProfile`
- `analyzeWorkingDependence`
- `evaluateAccuracyConsistency`

The profile exposes `masteryScoreSeparate: true` so downstream dashboards do not merge fluency with mastery.
