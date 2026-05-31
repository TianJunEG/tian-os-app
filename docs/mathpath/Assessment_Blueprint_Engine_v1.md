# Tian OS Assessment Blueprint Engine v1

## Purpose

Blueprint-first assessment modelling for Test Mode, revision workflows, and school-aligned assessment analytics.

This layer stores structure only:

- sections
- marks
- timing
- calculator rules
- topic distribution
- cognitive distribution
- diagram requirements

It does **not** store original paper files or generate final papers yet.

## Core models

### `AssessmentBlueprint`

Key fields:

- `title`, `level`, `subject`, `school`, `assessmentType`
- `durationMinutes`, `totalMarks`, `calculatorAllowed`, `timed`
- `status` (`draft | active | archived`)
- `sections[]`
  - `name`, `marks`, `questionCount`
  - `questionTypes[]` (`mcq`, `short_answer`, `open_ended`, `word_problem`, `multi_step`, `diagram`, `graph`, `table`, `mixed`)
  - `difficultyMix`
  - `cognitiveMix` (`Recall`, `Procedural`, `Application`, `ComplexApplication`)
- `topics[]`
  - `topic`, `topicId`, `domainId`, `skillIds[]`
  - `weightage`, `marks`, `difficulty`, `difficultyMix`
  - `diagramTypes[]`
- `requiredDiagramTypes[]`
- `blueprintVersion`, `parentBlueprintId`, `versionGroupId`
- `createdBy`, `createdByUserId`, `workspaceId`, `archivedAt`

### `AssessmentBlueprintVersion`

Version log snapshots:

- `blueprintId`, `versionGroupId`, `versionNumber`
- `changeType` (`create | update | archive | duplicate | seed`)
- `changedBy`
- `snapshot`
- timestamps

### `SchoolAssessmentProfile`

Metadata-only profile fields:

- `school`, `level`, `subject`, `assessmentType`
- `difficultyProfile`
- `diagramProfile`
- `questionStyleProfile`
- `assessmentStyleProfile`
- plus compatibility fields (`sectionStructure`, `difficultyDistribution`, `topicDistribution`, `questionStyleTendencies`)

## Validation contract

`validateAssessmentBlueprint(payload)` enforces:

- required identity fields
- `durationMinutes > 0`, `totalMarks > 0`
- sections non-empty, valid marks and question counts
- section marks sum equals total marks
- topic marks sum equals total marks
- topic weightage totals 100%
- `cognitiveMix` totals 100% when provided
- `difficultyMix` totals 100% when provided

Return shape:

```json
{
  "valid": true,
  "errors": [],
  "normalized": {}
}
```

## API endpoints

`/api/assessment-blueprints`

- `GET /` list
- `GET /:id` fetch
- `POST /` create
- `PUT /:id` update
- `POST /:id/archive` archive
- `POST /:id/duplicate` duplicate
- `POST /validate` validate payload
- `GET /:id/versions` version history
- `GET /:id/test-blueprint` Test Mode blueprint payload (no question generation)
- `GET /library/examples` starter examples
- `POST /library/seed` seed starter examples
- `POST /upload-analyze` upload -> extract blueprint -> save metadata -> file not retained
- `GET /school-profiles` list school profile metadata

## Starter blueprint library

Provided examples:

- P3 WA
- P4 WA
- P5 WA
- P6 WA
- P6 Prelim
- P6 PSLE-style

## Test Mode integration output

`generateTestBlueprint()` returns structure only:

- `sections`
- `marks`
- `timing`
- `topics`
- `cognitiveMix`
- `difficultyMix`
- `requiredDiagramTypes`

No question instances are generated in this step.
