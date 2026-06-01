# Sprint 9A Human Review Workflow

Status: Completed

## Reviewers

- Tutor
- Teacher
- Admin

## Statuses

- pending
- reviewed
- corrected
- verified
- rejected
- unreadable

## Correction Workflow

Reviewers can store:

- corrected OCR text
- corrected steps
- unreadable flags
- incomplete flags
- notes
- reviewer identity and role

## API

- `GET /api/mathpath-working/intelligence/queue`
- `GET /api/mathpath-working/intelligence/:workingId`
- `POST /api/mathpath-working/intelligence/:workingId/review`

