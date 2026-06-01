# Sprint 2 Working Data Model Summary

Generated: 2026-06-01

## Primary model
`MathPathWorkingSession`

## Core identifiers
- `workingSessionId`
- `studentId`
- `practiceSessionId`
- `assessmentSessionId`
- `domainId`
- `skillIds`
- `questionIds`
- `questionWorkingMap`

## Working code linkage
Each mapped question can hold:
- `questionId`
- `workingCode`
- `skillId`
- `domainId`
- `sessionId`
- `workingRequired`
- `noWorkingRequiredChecked`
- `workingReason`

## Evidence storage fields
- `fileUrls`
- `uploadedImages`
- `fileMetadata`
- `canvasImage`
- `canvasStrokeData`
- `doodleOverlayData`
- `digitalInkData`

## Review/AI readiness fields
- `status`
- `submittedByRole`
- `submittedByUserId`
- `submissionTimestamp`
- `analysisStatus`
- `analysisEvidence`
- `analysisSummary`
- `interventionRecommendation`

## Attempt-level working evidence
`MathPathAttempt` already stores:
- `workingImage`
- `workingStrokes`
- `workingSubmitted`
- `workingSubmittedAt`
- `workingNotNeeded`
- `fullscreenWorkingImage`
- `fullscreenWorkingStrokes`
- `fullscreenWorkingSubmitted`
- `fullscreenWorkingSubmittedAt`
- `workingEvidence`
- `workingCode`
- `workingSessionId`
- `timeTaken`
- `questionStartedAt`
- `questionEndedAt`

## Remaining data-model gap
Question-level paper uploads are mapped through `questionWorkingMap`, but individual uploaded image pages do not yet carry a required `questionId` field in `fileMetadata`. This is acceptable for the current session-level upload flow but should be tightened before automated marking or page-level adult comments.
