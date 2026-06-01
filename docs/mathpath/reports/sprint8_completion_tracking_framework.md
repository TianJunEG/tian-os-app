# Sprint 8 Completion Tracking Framework

Status: Completed

## Root Cause

Assignments previously tracked only broad status and completion date. Sprint 8 requires full operational state changes.

## Statuses Supported

- not_started
- started
- in_progress
- completed
- skipped
- expired
- overdue

## Timestamps Supported

- assignedAt
- startedAt
- inProgressAt
- completedAt
- skippedAt
- expiredAt
- overdueAt

## API Support

Added:

- `PATCH /api/assignments/:id/status`
- `assignmentsAPI.updateStatus(id, data)`

This allows current and future student task flows to persist completion state without changing the learning activity itself.

