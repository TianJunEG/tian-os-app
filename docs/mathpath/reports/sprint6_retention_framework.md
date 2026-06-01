# Sprint 6 Retention Framework

Status: Completed

## Retention States

- Not Reviewed
- Review Due
- Review Scheduled
- Retained
- Retention Risk
- Forgotten

## Retention Model

Retention tracks initial mastery and five review points:

- Review 1: 1 day
- Review 2: 7 days
- Review 3: 30 days
- Review 4: 90 days
- Review 5: 180 days

## Forgetting Detection

Previously mastered skills are flagged when recent attempts show decline or when scheduled reviews become due.

## Implementation

- `buildSpacedReviewSchedule`
- `evaluateRetentionStatus`
- `detectForgetting`
- Existing `fractionRetentionEngine` interval list updated to 1/7/30/90/180 days.
