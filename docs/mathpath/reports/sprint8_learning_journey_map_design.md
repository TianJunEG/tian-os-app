# Sprint 8 Learning Journey Map Design

Status: Completed

## Journey Events

The engine supports chronological mapping of:

- Diagnostic
- Intervention
- Worksheet
- Practice
- Reassessment
- Mastery
- Retention

## Purpose

Adults can see whether a student moved from diagnosis into actual remediation, and whether reassessment or retention review happened afterward.

## Implementation

`buildLearningJourneyMap(events)` normalises events into a sorted timeline with:

- ID
- order
- type
- label
- timestamp
- skill ID
- status
- metadata

