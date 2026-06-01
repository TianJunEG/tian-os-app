# Sprint 2 Feature Completion Checklist

Generated: 2026-06-01

| Sprint item | Status | Notes |
|---|---|---|
| Quick doodle overlay | Completed | Existing `QuestionAnnotationOverlay` supports toggle, exit, undo, clear, touch/stylus/mouse, and saved overlay data. |
| Question overlay canvas | Completed | Overlay aligns to question surface using `ResizeObserver` and normalized coordinates. |
| Full working canvas | Partial | Upgraded tools include colour, brush, pen, pencil, highlighter, eraser, undo, redo, clear, zoom, and pan. Advanced smooth pan/zoom UX can still improve. |
| Full-screen working mode | Partial | Exists with split question reference + working canvas and tablet-friendly modal. Dedicated split-pane resizing is not built. |
| Paper working upload | Completed | Existing route supports JPG/PNG/PDF, multiple files, metadata, timestamps, and session linkage. |
| Working attachment manager | Partial | Saved full-screen preview supports view/edit/delete/add another. Paper-upload page has separate review screens. Unified manager remains next pass. |
| Working submission requirement | Completed | Questions can require working; students can mark working not needed; flags are stored. |
| Working code system | Completed | Working codes are generated per mapped question/session and shown in working canvas/upload contexts. |
| Time tracking | Partial | Answer time is tracked; working submission timestamps are stored. Separate working-time duration is not yet calculated. |
| Working storage model | Completed | Model now explicitly stores canvas image, stroke data, doodle overlay data, uploaded images, and digital ink data. |
| Working review screen | Partial | Question review and adult review components exist. Per-question teacher/tutor comments placeholders need a dedicated screen pass. |
| Adult review foundation | Completed | Review-summary API and adult panel expose working sessions/help requests view-only. |
| AI readiness | Completed | Analysis status/evidence/summary fields and raw stroke/upload data are available for future analysis. |
| Mobile experience | Partial | Controls are finger-friendly and scrollable; screenshot-level verification still pending. |

## Critical/high implemented
- Canvas tool completeness upgraded.
- Full-screen and inline working now share richer working controls.
- Persistent schema now names canvas, doodle, and uploaded-image evidence explicitly.
- Working upload API exposes evidence fields for future dashboards and review screens.

## Remaining medium/low
- Dedicated per-question adult comments screen.
- Automated 320/375/390/414 Playwright screenshots.
- Working-time duration metric separate from answer time.
- Unified attachment manager across canvas and paper-upload evidence.
