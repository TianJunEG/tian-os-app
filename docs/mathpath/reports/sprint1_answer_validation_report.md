# Sprint 1 Answer Validation Report (Fractions)

Generated: 2026-06-01T00:00:00Z

## Scope
- Generator-side validation for diagnostic and practice answer checking.
- `checkFractionAnswer` in `frontend/src/mathpath/fractions/fractionQuestionGenerator.js`.

## Current validation status
- Equivalent fractions are validated by reduced-form compare (`numerator/denominator`) and are accepted after reduction.
- Whole numbers, decimals, and fraction strings are supported.
- Symbol answers (`>`, `<`, `=`) are now explicitly parsed and validated for comparison-family questions.
- Mixed-number answers like `1 2/3` are still accepted and normalized.
- Working-answer fallback currently trims and tolerates formatting variations (`" 2/4 "`).

## Issues found and fixed
- High mismatch identified: families using comparison prompts were storing fraction answers (`1/2`) while questions asked for symbols.  
  - Fixed by returning symbol-valued answer payloads and matching `checkFractionAnswer` symbol branch.
- `checkFractionAnswer` now handles `correctAnswer.type === 'text'` to properly parse symbol answers.

## Residual risks
- Numeric tolerance for decimal parsing remains strict around exact string equivalence, which is acceptable at current difficulty bands.
- No automated symbolic math parser for algebraic equivalence beyond fractions, symbols, and decimals is enabled.

## Recommended next high-value validation additions
- Add tolerance window and canonicalization for unit conversion responses where unit suffix is included.
- Add strict unit validation for questions requiring specific units (`mL`, `cm`, `kg`) once those prompts are introduced at higher levels.
