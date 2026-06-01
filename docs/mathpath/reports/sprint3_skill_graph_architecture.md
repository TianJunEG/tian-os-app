# Sprint 3 Skill Graph Architecture

Generated: 2026-06-01

## Status
Completed

## Architecture
Fractions already has a dependency graph for `F001` to `F026` in `fractionSkillGraph.js`.

Each skill stores:
- skill ID
- skill name
- parent skill/domain (`Fractions`)
- strand
- prerequisites
- remediation targets
- difficulty level
- Singapore level / MOE mapping
- mastery rules
- fluency targets
- question families

## Sprint 3 addition
`fractionDiagnosticExplainabilityEngine.js` now exposes `buildSkillGraphArchitecture()`, which returns a diagnostic-ready graph object with prerequisite and MOE fields for dashboards and reports.

## Critical outcome
Weaknesses can now be traced back through prerequisite chains instead of being shown as isolated failed skills.
