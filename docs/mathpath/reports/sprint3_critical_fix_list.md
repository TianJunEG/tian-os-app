# Sprint 3 Critical Fix List

Generated: 2026-06-01

## Critical / High implemented
1. Diagnostic outputs now include evidence by skill.
   - Implemented through `skillEvidence`.
2. Weak skills now include root-cause inference.
   - Implemented through `rootCauses`.
3. Misconceptions are now structured definitions, not loose labels.
   - Implemented through `FRACTION_MISCONCEPTION_LIBRARY`.
4. Readiness score is now explainable.
   - Implemented through `readinessComponents`.
5. Recommendations are audience-specific.
   - Implemented through `recommendations.student`, `parent`, `tutor`, and `teacher`.
6. Student diagnostic page now explains why, where, how, and next action.
   - Implemented in `DiagnosticResultScreen.jsx`.

## Partial / remaining
1. Parent diagnostic page rendering.
2. Tutor diagnostic page rendering.
3. Teacher class grouping rendering.
4. Retention score from historical attempts rather than current fallback.
5. Deeper working-quality analysis beyond presence and stroke length.

## Missing by design
AI working-step analysis is not built in this sprint. The storage and explainability objects are prepared for it.
