# Answer Input and Working Submission UX Audit

## Scope Checked

- Practice answer input and working evidence flow
- Diagnostic answer input and working evidence flow
- Assessment/test answer input and working evidence flow
- Model Trainer final answer input and full-screen drawing flow
- Similar/remediation practice answer input and working evidence flow
- Full-screen working save/restore and paper upload handoff

## Fixes Applied

- Added shared `MathInputPopup` for structured whole number, fraction, and mixed number entry.
- Updated `FractionAnswerInput` to use contextual tool buttons that open the structured popup.
- Updated `AnswerInputRenderer` so whole-number answers use the same structured popup path.
- Removed the older raw text-insert math toolbar from answer text/expression fields, preventing raw templates such as `()/()` or `(1)/(3)` from being inserted.
- Preserved required confidence selection in assessment/test mode.
- Updated assessment review so it requires answers, confidence choices, and working evidence declarations before submission.

## Current Working UX Findings

- Practice, diagnostic, assessment, and similar practice all use `WorkingCanvas` plus `WorkingEvidenceDecision`.
- Model Trainer uses the existing full-screen working mode for drawing and preview.
- Full-screen working save/restore is available through shared `FullScreenWorkingMode`.
- Paper upload and success screens remain separate route-level flows.

## Follow-Up Recommended

- Extract the repeated `WorkingCanvas` + `WorkingEvidenceDecision` markup into a shared `WorkingEvidencePanel`.
- Extract repeated working summary/status copy into a shared `WorkingSummary`.
- Align Model Trainer drawing save state with the same `WorkingEvidencePanel` API once the shared panel exists.
- Add E2E coverage for assessment working submission with confidence and working evidence.

## Verification

- `npm --prefix frontend test -- AnswerInputRenderer`
- `npm --prefix frontend run build`
