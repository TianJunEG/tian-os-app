# Sprint 5 Alert System Design

Status: Completed

## Alert Types

- New misconception detected
- Retention review due
- Student requested help
- Confidence mismatch
- Repeated procedural errors
- Mastery milestone
- Working evidence needed

## Principles

Alerts are short, severity-ranked and action-linked. They should answer what happened and what adult action is useful next.

## Implementation

- Support flags are produced by `buildUnifiedAdultIntelligenceModel`.
- Alerts are produced by the adult intelligence alert builder.
- Parent, tutor and teacher dashboards can consume the same alert contract.
