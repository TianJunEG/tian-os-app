# Question Quality, Diagram & Curriculum Fidelity Engine

Date: 2026-06-06

Scope: MathPath question quality architecture and admin audit visibility for the active Tian OS app.

## Summary

This sprint adds a read-only quality audit layer for MathPath questions. It does not change question selection, generation, diagnostics, practice, fluency, story mode, remediation, or student delivery.

The new audit layer scores questions across:

- curriculum alignment
- diagram and visual-model requirements
- wording clarity
- age appropriateness
- misconception coverage
- answer input suitability
- template diversity

## Sources Reviewed

- `models/mathpath/GeneratedQuestion.js`
- `models/mathpath/MathPathQuestionFamily.js`
- `frontend/src/mathpath/fractions/fractionQuestionGenerator.js`
- `frontend/src/mathpath/fractions/fractionQuestionFamilies.js`
- `frontend/src/mathpath/fractions/fractionDiagnosticEngine.js`
- `frontend/src/mathpath/fractions/fractionFluencyEngine.js`
- `frontend/src/mathpath/fractions/fractionStoryModeEngine.js`
- `frontend/src/mathpath/curriculum/fractionCurriculumMappings.js`
- `frontend/src/mathpath/diagrams/diagramSpecSchema.js`
- `frontend/src/mathpath/diagrams/diagramValidators.js`
- `frontend/src/mathpath/diagrams/svgRenderers.js`
- `docs/mathpath/Fractions_Question_Quality_Audit.md`
- `FRACTIONS_PILOT_INVENTORY.md`

## Key Findings

### Missing Diagrams and Visual Models

The app already has a diagram schema and SVG renderer foundation, but generated question records do not consistently expose diagram metadata at the question-audit layer.

The new engine flags likely visual requirements for:

- fraction recognition and shaded shapes: `F001-F004`
- number-line fractions: `F005`
- equivalent/simplified fractions: `F010-F012`
- fraction of a set or quantity: `F020`
- word problems and remainder problems: `F023-F026`

### Repeated Templates

Existing checked-in audit evidence shows repeated generated items:

- `docs/mathpath/Fractions_Question_Quality_Audit.md`
- Warnings: `751`
- Issue type: `repeated_generated_item`

The new `questionVariationEngine` detects repeated wording, repeated number signatures, and repeated structures so this can be monitored continuously from the admin route.

### Curriculum Alignment Risk

The major known fidelity risk remains F-code mapping mismatch:

- `FRACTIONS_PILOT_INVENTORY.md` reports many `fractionSkillGraph.js` titles do not match `fractionCurriculumMappings.js`.
- This can affect parent/tutor claims, level grouping, diagnostic placement explanations, and future MOE-scope reporting.

This sprint does not remap F-codes. It adds scoring flags that help surface mapping drift during audits.

### Difficulty Calibration

The new quality service flags:

- fraction division language on non-P5/P6 skills
- algebra, ratio, or percentage drift inside fractions-only questions
- high difficulty on foundation skills
- high reading load
- out-of-primary-scope language

### Answer Input Quality

The new quality service flags fraction questions that rely on plain text or unspecified answer inputs where structured fraction, mixed-number, or numeric entry would be more reliable.

### Misconception Coverage

The audit service includes configured misconception expectations for key fractions skills, including:

- common denominator errors
- direct denominator addition/subtraction
- simplification errors
- mixed/improper conversion errors
- fraction-of-quantity whole errors
- original-versus-remainder errors
- multi-step order errors

This is an audit signal only. It does not alter remediation delivery.

## New Architecture

### `services/mathpath/questionDiagramRequirementEngine.js`

Determines whether a question likely requires:

- fraction model
- fraction strip
- shaded shape
- number line
- bar model
- geometry diagram
- table
- graph
- picture model

It returns missing-visual flags without requiring any rendering changes.

### `services/mathpath/questionVariationEngine.js`

Normalises question wording and detects:

- repeated templates
- repeated numbers
- repeated structures

It produces a diversity score for a question bank sample.

### `services/mathpath/questionQualityAuditService.js`

Scores each question and produces aggregate audit sections:

- low-quality questions
- missing diagrams
- repeated templates
- difficulty issues
- answer input issues
- misconception gaps
- top issue types

The service reads from:

- `GeneratedQuestion`
- `MathPathQuestionFamily`

## Admin Visibility

New API:

- `GET /api/admin/question-quality`

New page:

- `/admin/question-quality`

The page shows simple internal tables for low-quality questions, missing visual models, repeated templates, difficulty issues, answer input issues, and misconception gaps.

## Known Limitations

- The audit engine is heuristic-first.
- It does not perform full Singapore MOE syllabus validation.
- It does not render or inspect actual diagram pixels.
- It does not mutate question records.
- It does not repair curriculum mappings.
- It does not deduplicate generated questions automatically.
- Live audit depth depends on the generated-question records available in the connected database.

## Recommended Remediation Plan

1. Fix F-code curriculum mapping drift before making strong curriculum-scope claims.
2. Attach explicit diagram metadata to generated question records.
3. Add visual assets for high-need skills: `F001-F005`, `F010-F012`, `F020`, `F023-F026`.
4. Reduce repeated generated items in the content generator.
5. Add structured answer input metadata to all fraction and mixed-number questions.
6. Expand misconception tags per micro-skill using the Fractions misconception map.
7. Add a DB-backed scheduled audit job after question generation runs.

## Verification

Focused tests added for:

- quality scoring
- diagram requirement detection
- difficulty calibration
- template diversity detection
- misconception coverage reporting
- admin question-quality route authorization
