# Sprint 2 Working Evidence Architecture Report

Generated: 2026-06-01

## Scope
This sprint stabilises working capture across MathPath questions. It does not add AI analysis or new learning modules.

## Existing architecture reused
- Inline working canvas: `frontend/src/components/learning/WorkingCanvas.jsx`
- Question doodle overlay: `frontend/src/components/learning/QuestionAnnotationOverlay.jsx`
- Full-screen working mode: `frontend/src/components/learning/FullScreenWorkingMode.jsx`
- Working upload flow: `frontend/src/pages/student/mathpath/working/*`
- Working session backend: `routes/mathpathWorking.js`
- Persistent model: `models/mathpath/MathPathWorkingSession.js`
- Working codes: `services/mathpath/workingCodeService.js`
- Adult review foundation: `frontend/src/components/mathpath/working/AdultWorkingReviewPanel.jsx`

## Implemented in this pass
- Upgraded shared canvas controls to include pen, pencil, highlighter, eraser, colour selector, brush size selector, undo, redo, clear, zoom controls, and basic pan hooks.
- Applied the upgraded controls to inline working and full-screen working.
- Added explicit persistent fields for canvas image, canvas stroke data, doodle overlay data, and uploaded image references.
- Extended working upload API response/output to expose the new evidence fields.

## Evidence flow
Question rendered -> student answers -> student confidence/time tracked -> working evidence captured from doodle, inline canvas, full-screen canvas, or paper upload -> answer payload persists evidence with attempts -> working session stores upload/digital evidence for adult review and later AI analysis.

## Priority classification
- Critical: answer/working/time evidence must be capturable per question. Status: Completed for practice flows; diagnostic/assessment already have inline canvas support.
- High: full-screen and upload evidence must be linked to session/question. Status: Completed/Partial depending on route; practice flow links working codes and session IDs.
- Medium: adult review should be view-only. Status: Partial, existing panel and routes expose sessions, but richer per-question review UI remains next pass.
- Low: advanced AI analysis. Status: intentionally not built.
