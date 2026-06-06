# Worksheet Generator 2.0: Intervention-Driven Architecture

Date: 2026-06-06

Scope: MathPath worksheet generation for diagnostics, Recovery Packs, paper analysis, tutor lesson planning, student care interventions, parent support, and manual skill selection.

## Existing Worksheet Capabilities

- `routes/worksheetsGen.js` provides structured worksheet generation at `/api/worksheets/gen`.
- `routes/worksheets.js` supports the legacy upload/photo worksheet flow and generated worksheet PDF export.
- `utils/worksheetGen.js` already supports rule-based generation from recommended practice, fluency, retention, weak skills, diagnostic results, selected topic, recent mistakes, class/group, homework, and intervention modes.
- `models/Worksheet.js` stores structured worksheet content, answer keys, assignment linkage, completion, generated-by metadata, and generated-for metadata.
- `routes/worksheetsGen.js` can assign a generated worksheet to the existing `Assignment` model as a `Mastery Worksheet`.
- `routes/teacher.js` already supports weak-group worksheet generation for teacher-led interventions.

## Existing PDF Capabilities

- `GET /api/worksheets/:id/pdf` returns a lightweight generated PDF.
- `?answers=1` includes the answer key.
- PDF generation is server-side and does not require an external PDF service.

## Existing Weaknesses

- Worksheet source evidence was mostly mode-based, not intervention-source based.
- The system did not persist explicit `interventionSourceType` / `interventionSourceId`.
- Recovery Pack, Paper Analysis, Tutor Lesson Prep, Student Care, and Parent Support did not share one worksheet generation contract.
- Sectioning was not enforced as a concept-to-fluency worksheet pathway.
- PDF export printed a flat question list and did not show intervention rationale or targeted skills.
- Misconception targeting existed in source systems but was not directly used by worksheet question selection.

## New 2.0 Architecture

### `services/mathpath/worksheetQuestionSelector.js`

Defines worksheet type rules and section allocation:

- Recovery Worksheet: 60% foundation, 30% guided, 10% mastery
- Practice Worksheet: balanced mix
- Homework Worksheet: moderate challenge
- Tutor Lesson Worksheet: warm-up, guided practice, exit check
- Recheck Worksheet: verification-heavy
- Parent Support Worksheet: parent-supported foundation and guided practice

It selects questions from the shared `Question` bank and prioritises misconception-targeted questions when evidence includes misconception tags.

### `services/mathpath/worksheetGenerationEngine.js`

Creates intervention worksheets from:

- diagnostic
- recovery_pack
- paper_analysis
- tutor_lesson
- student_care_intervention
- parent_support
- manual

Each worksheet stores:

- source type
- source id
- targeted skills
- rationale
- sections
- answer key
- reflection prompt
- personalization metadata explaining why the worksheet was generated

### New API

- `POST /api/worksheets/gen/intervention`
- `GET /api/worksheets/gen/intervention/history`

## Worksheet History

`models/Worksheet.js` now stores:

- `interventionSourceType`
- `interventionSourceId`
- `interventionRationale`

This allows regeneration and audit of which diagnostic, Recovery Pack, paper analysis, or lesson plan caused a worksheet.

## PDF Improvements

The PDF export now includes:

- targeted skills
- intervention rationale
- worksheet sections
- digital-diagram note when visual models are present
- reflection prompt
- answer-key worked solution where available

## Integrations Added

- Tutor Lesson Prep can generate a Tutor Lesson Worksheet.
- Student Care Homework can generate a Recovery Worksheet from an active Recovery Pack.
- Paper Analysis can generate a Targeted Worksheet from confirmed weak skills.
- Parent MathPath dashboard routes worksheet creation through a parent-support worksheet intent.

## What Remains MVP

- Tutor worksheet preview route is not role-specific yet, so tutor generation currently confirms creation instead of opening a tutor preview.
- PDF rendering is text-first and does not render structured diagrams into the PDF yet.
- Direct worksheet generation from diagnostic history cards can use the new API but has not been added to every adult growth card.
- Question selection depends on the existing shared `Question` bank being linked to F-code skill metadata.

## Recommended Next Step

Add a shared adult worksheet preview route that supports parent, tutor, teacher, and student-care roles. Then render structured diagrams in PDF output using the existing MathPath diagram metadata.
