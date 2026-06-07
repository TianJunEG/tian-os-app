# Recovery Pack Asset Realisation

Audit date: 2026-06-07

Scope: MathPath Fractions misconception intervention assets for Recovery Packs.

## Executive Summary

This sprint turns remediation planning into a student-facing asset layer. Tian OS can now take a detected misconception and produce a concrete teaching sequence:

Misconception Detected -> Worked Example -> Visual Explanation -> Guided Practice -> Independent Practice -> Recheck

The implementation does not generate more questions and does not change unrelated dashboards. It creates the model and service layer needed for realised Recovery Pack assets, persists the reason a Recovery Pack was assigned, and exposes the learning path to students.

## What Was Implemented

### Misconception Asset Model

Created:

- `models/mathpath/MisconceptionAsset.js`

The model supports:

- misconception id
- title
- explanation
- visual model type
- worked example
- guided practice ids
- independent practice ids
- recheck question ids
- status

This gives Tian OS a future persistence layer for curated assets while the current sprint uses generated/static assets from the misconception map.

### Worked Example Engine

Created:

- `services/mathpath/workedExampleEngine.js`

For each major misconception, the engine returns:

- incorrect method
- why it is incorrect
- correct method
- visual explanation
- key takeaway

Examples are student-facing and avoid internal diagnostic labels.

### Recovery Pack Asset Service

Created:

- `services/mathpath/recoveryPackAssetService.js`

The service provides:

- asset lookup
- Recovery Pack Asset Matrix
- guided practice flow
- assignment asset metadata
- recheck target validation
- admin report payload

### Assignment Misconception Tagging

Updated:

- `models/mathpath/MathPathAssignment.js`
- `services/mathpath/mathPathAssignmentService.js`

Recovery Packs now preserve:

- `misconceptionIds`
- `interventionIds`
- `evidenceSource`
- `guidedPracticeFlow`

This means Recovery Packs preserve why they were assigned, not just which skill ids they target.

### Student Recovery Pack Experience

Updated:

- `frontend/src/pages/student/mathpath/MathPathAssignments.jsx`

Students now see:

- why the pack exists
- the teaching path: worked example, visual explanation, guided practice, independent practice, mastery check

This improves the learning loop without exposing internal scores or diagnostic labels.

### Recheck Target Validation

Updated:

- `services/mathpath/mathPathAssignmentService.js`

Rechecks created from assignments now preserve `targetSkillIds`, so validation can check whether the recheck matches the Recovery Pack target.

## Admin Report

New endpoint:

- `GET /api/admin/recovery-pack-assets`

New page:

- `/admin/recovery-pack-assets`

Shows:

- misconceptions with no assets
- misconceptions with no worked examples
- misconceptions with no visual explanation
- misconceptions with no recheck
- asset coverage percentage
- recheck target mismatches

## Asset Coverage

Current architecture-level coverage:

- Asset coverage: 100% of registered misconception mappings
- Missing misconceptions: 0 in the registered map
- Missing worked examples: 0 in the generated asset layer
- Missing visual explanations: 0 in the generated asset layer
- Missing recheck references: 0 in the generated asset layer

Important limitation:

This is asset architecture coverage. It does not mean every guided practice id or recheck question id is backed by a fully curated database question yet. The system now has the references and sequence needed to realise them.

## Missing / Remaining Gaps

1. Guided practice ids are generated asset references, not yet guaranteed curated question records.
2. Independent practice ids are generated asset references, not yet guaranteed curated question records.
3. Recheck question ids are generated asset references, while actual recheck generation still relies on the diagnostic runtime.
4. Visual explanations are referenced by visual model type, not yet rendered as a dedicated Recovery Pack teaching scene.
5. Student Recovery Pack page shows the learning sequence but does not yet render the full worked example inline.

## Recommended Next Sprint

Recommended next sprint: Recovery Pack Teaching Flow.

Goal:

Render the actual student-facing Recovery Pack sequence:

1. Worked example screen
2. Visual explanation screen
3. Two guided questions
4. Independent practice
5. Mastery check / recheck handoff

This would turn the current asset layer into a full guided remediation experience.
