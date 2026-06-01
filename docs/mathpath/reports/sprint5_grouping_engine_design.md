# Sprint 5 Grouping Engine Design

Status: Completed

## Group Types

- Skill mastery groups
- Conceptual misconception groups
- Word-problem reasoning groups
- Fluency deficit groups
- Retention review groups

## Inputs

- Student skill statuses
- Mistake-to-Mastery plans
- Fluency states
- Retention states

## Output

Each group includes group id, group name, category, focus skill, student ids, reasons and recommended activity.

## Implementation

- `buildClassGroupingSuggestions`
- Existing `buildInterventionGroups`

The grouping layer avoids raw dumps and gives the teacher a clear reason and next activity.
