# MathPath Visual Model & Diagram Coverage Program

Date: 2026-06-07

Scope: MathPath visual model coverage architecture and audit visibility.

## Summary

This sprint adds a reusable visual model layer for MathPath. The goal is not decorative graphics. The goal is to make visual representations explicit, auditable, and reusable across diagnostics, practice, worksheets, paper analysis, and remediation.

## Files Changed

New services:

- `services/mathpath/visualModelRegistry.js`
- `services/mathpath/skillVisualRequirementEngine.js`
- `services/mathpath/visualQualityAuditService.js`

Updated services/models/routes:

- `services/mathpath/questionDiagramRequirementEngine.js`
- `services/mathpath/worksheetGenerationEngine.js`
- `services/mathpath/fractionContentGenerationEngine.js`
- `models/mathpath/GeneratedQuestion.js`
- `models/mathpath/MathPathQuestionFamily.js`
- `routes/pilotAnalytics.js`

Frontend:

- `frontend/src/pages/admin/QuestionVisualQualityPage.jsx`
- `frontend/src/App.jsx`
- `frontend/src/services/api.js`
- `frontend/src/mathpath/fractions/fractionQuestionGenerator.js`

Tests:

- `utils/visualModelRegistry.test.js`
- `utils/skillVisualRequirementEngine.test.js`
- `utils/visualQualityAuditService.test.js`
- Updated `utils/worksheetGenerationEngine.test.js`
- Updated `utils/questionDiagramRequirementEngine.test.js` indirectly through shared engine behaviour
- Updated `utils/questionQualityAuditService.test.js` indirectly through shared engine behaviour
- Updated `routes/learningTelemetryAnalytics.test.js`
- Updated `frontend/src/mathpath/fractions/fractionQuestionGenerator.test.js`

## Visual Model Registry

Supported visual model types:

- `fraction_strip`
- `shaded_fraction_model`
- `number_line`
- `bar_model`
- `geometry_shape`
- `geometry_diagram`
- `table`
- `graph`
- `picture_model`

The registry also normalises legacy aliases:

- `fraction_bar` -> `fraction_strip`
- `fraction_model` -> `shaded_fraction_model`
- `shaded_shape` -> `shaded_fraction_model`
- `comparison_models` -> `bar_model`
- `bar_graph` / `line_graph` -> `graph`

## Skill Visual Requirements

Fractions `F001-F026` now have explicit visual requirements.

High-priority requirements:

- F001-F003: `shaded_fraction_model`
- F004, F006-F008, F010-F019, F022: `fraction_strip`
- F005, F009: `number_line`
- F020: `picture_model`
- F023-F026: `bar_model`
- F021: `shaded_fraction_model`

This gives MathPath a single reusable rule source for visual decisions.

## Fraction Coverage Findings

Fractions is visually partial, not complete.

Priority skill groups:

- Foundations F001-F005 need consistent shaded models, strips, and number lines.
- Comparison/equivalence F006-F012 need fraction strips and number-line support.
- Operations F016-F019 need common-denominator strip models.
- Quantity/application F020 needs picture/set models.
- Word-problem skills F023-F026 need Singapore bar-model coverage.

## Bar Model Findings

Bar models are required for:

- F023 Fraction Word Problems
- F024 Multi-Step Fraction Problems
- F025 Exam-Style Fraction Applications
- F026 Fractions Mastery Challenge

The new audit can identify where questions request or require bar models but do not yet provide them. Remaining work is to author/render the actual model-method diagrams and include them in worksheets.

## Worksheet Integration

Generated intervention worksheet question payloads now include:

- `requiredVisualTypes`
- `optionalVisualTypes`
- `providedVisualTypes`
- `visualModelRequired`
- `visualCoverageStatus`

Worksheet content also includes `visualModelReferences`, so rendering/export layers can include diagrams without hardcoding image assets.

## Question Generator Integration

Fractions generated questions now include visual metadata:

- `requiredVisualTypes`
- `providedVisualTypes`
- `visualCoverageStatus`

Persisted `GeneratedQuestion` and `MathPathQuestionFamily` models now support optional visual metadata fields.

## Admin Quality Report

New admin route:

- `GET /api/admin/question-visual-quality`

New admin page:

- `/admin/question-visual-quality`

The report shows:

- skills missing visuals
- questions missing visuals
- visual coverage percentage
- visual coverage by level
- bar-model findings

## Tests Run

Passed:

```bash
npm test -- utils/visualModelRegistry.test.js utils/skillVisualRequirementEngine.test.js utils/visualQualityAuditService.test.js utils/questionDiagramRequirementEngine.test.js utils/questionQualityAuditService.test.js utils/worksheetGenerationEngine.test.js routes/learningTelemetryAnalytics.test.js
```

Result:

- 7 test files passed
- 31 tests passed

Passed:

```bash
npm --prefix frontend run test -- src/mathpath/fractions/fractionQuestionGenerator.test.js
```

Result:

- 1 test file passed
- 17 tests passed

Passed:

```bash
npm --prefix frontend run build
```

## Diagram Gaps Remaining

Still missing:

- Actual authored/rendered bar-model diagrams for many F023-F026 questions.
- Full diagram rendering inside worksheet PDFs.
- Live DB coverage report expansion for diagram counts by skill/family.
- Visual-model authoring for non-Fractions domains; those domains are not MathPath-ready yet.
- Human review of whether every required visual is pedagogically sufficient, not only present.

## Recommended Next Sprint

Run a **Fractions Visual Authoring Sprint**:

1. Add concrete bar-model specs for F023-F026.
2. Add fraction strip specs for F006-F019.
3. Add picture/set models for F020.
4. Render those specs in student question views and worksheet PDFs.
5. Extend the DB-backed Fractions coverage report with visual coverage counts.

