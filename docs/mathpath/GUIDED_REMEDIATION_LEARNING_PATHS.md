# Guided Remediation Learning Paths

## Executive Summary

This sprint converts MathPath Recovery Packs from question-set assignments into structured remediation journeys.

Student remediation now has a consistent path shape:

1. Understand the mistake
2. Learn the concept visually
3. See a worked example
4. Practice with support
5. Practice independently
6. Mastery check
7. Recheck ready

The implementation is intentionally lightweight. It adds first-class learning path metadata, assignment linkage, mastery criteria, and a read-only admin quality report without changing dashboards or adding new subject content.

## Recovery Path Readiness Matrix

The current Fractions misconception map covers 26 active skills. Each skill can be translated into a seven-stage learning path using the existing misconception intervention map.

| Area | Status | Notes |
| --- | --- | --- |
| Skill to misconception mapping | Ready | Existing `skillMisconceptionMap` provides primary and secondary misconception IDs. |
| Misconception to intervention mapping | Ready | Existing `misconceptionInterventionMap` provides guided sequences, worked example focus and recheck strategy. |
| Learning path template | Ready | New default seven-stage path is generated from skill and misconception metadata. |
| Recovery Pack assignment linkage | Ready | New assignments store `learningPathId`, `currentStage`, `completedStages` and `stageHistory`. |
| Stage progression | MVP | Progress is inferred from practice attempt count, completion and accuracy. |
| Mastery criteria | MVP | Recheck gating uses stage completion, mastery check and accuracy. |
| Learning path analytics | MVP | Stage completion and drop-off can be reported from assignment state. |
| Admin quality report | Ready | `/admin/learning-path-quality` exposes path coverage, criteria risks and drop-off. |

## New Learning Path Model

`models/mathpath/LearningPath.js` stores reusable remediation paths:

- `learningPathId`
- `subjectId`
- `domainId`
- `skillId`
- `misconceptionId`
- `title`
- `stages[]`
- `masteryCriteria`
- `status`

This keeps paths subject/domain-aware while preserving the generic remediation structure.

## Assignment Linkage

`MathPathAssignment` now supports:

- `learningPathId`
- `currentStage`
- `completedStages`
- `stageHistory`

New Recovery Packs created from diagnostics, paper analysis or lesson prep create/reuse a matching learning path and attach these fields.

Legacy assignments without `learningPathId` remain valid.

## Recheck Gating

Recheck is no longer recommended merely because a learning-path assignment is completed.

For assignments with `learningPathId`, recheck readiness now requires:

- enough Recovery Pack completion evidence
- required learning path stages completed
- mastery check completed
- accuracy threshold met

Legacy assignments without learning path metadata keep the previous completion-based behaviour and are labelled as legacy in the readiness result.

## Quality Report

Admin route:

`/admin/learning-path-quality`

API:

`GET /api/admin/learning-path-quality`

Report includes:

- recovery path readiness matrix
- persisted path count
- misconceptions without persisted paths
- incomplete learning paths
- weak mastery criteria
- high drop-off stages

## Remaining MVP Limitations

- Stage progression is inferred from assignment progress, not yet from explicit student stage actions.
- Student-facing Recovery Pack UI is not redesigned in this sprint.
- Learning paths are persisted when new Recovery Packs are created; historical assignments may need backfill if they should show path linkage.
- Mastery criteria are generic defaults for now. Some misconceptions may later need stricter criteria.
- Recheck gating uses assignment evidence only; deeper cross-evidence criteria can be added later.

## Recommended Next Sprint

Build the student-facing Recovery Pack stage UI:

- show current learning path title
- show stage progress, e.g. `Stage 3 of 7`
- separate worked examples, guided practice and independent practice
- record explicit stage completion telemetry
- backfill active Recovery Packs with learning path IDs
