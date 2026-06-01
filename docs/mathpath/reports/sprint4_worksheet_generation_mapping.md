# Sprint 4 Worksheet Generation Mapping

Status: Completed

## Worksheet Mapping

Each mistake pattern maps to a worksheet plan containing:

- Worksheet id
- Mistake code
- Skill focus
- Question family ids
- Supported -> guided -> independent progression
- Working space requirement
- Working code prefix
- Answer key availability
- Misconception check label

## Implementation

- `buildWorksheetMappingForMistake`

Example:

`M008` operation selection error maps to `F020`, `F023`, `F024`, includes working space, and produces working code prefix `MP-FRA-M008`.
