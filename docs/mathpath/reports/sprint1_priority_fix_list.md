# Sprint 1 Priority Fix List

Generated: 2026-06-01T00:00:00Z

## Critical / High (Implemented)
1. Comparison families returned fraction answers where symbols were required.
   - Families affected: `F006`, `F007`, `F008`, `F011(_005)`, plus related branches.
   - Fix:
     - answer payload now stores `<`, `>`, `=` where prompt asks for symbol comparison.
     - `checkFractionAnswer` parses and validates symbol answers.
     - `correctAnswer.type === 'text'` branch added in checker.
2. `F010` completion family returned whole-number answers for `?/<den>` prompts.
   - Fix:
     - now returns equivalent fraction in numerator/denominator form.

## Medium (Recommended in next pass)
1. Difficulty drift in generated diagnostics:
   - Several rows still flagged outside expected band.
2. Duplicate stems in generated question sets:
   - Deterministic family variants can produce repeats.
3. Multiple distinct accepted answers where one canonical form would be preferable.

## Low (Cleanup)
1. Consolidate duplicate accepted answer entries in ordering families.
2. Minor wording polishing for low-level prompts with clearer real-world context.
