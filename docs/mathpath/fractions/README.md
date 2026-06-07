# Tian OS Fractions Reference Maps

These files are curriculum-design references for the Tian OS MathPath Fractions vertical.

## Current pilot structure

The existing `F001`-`F026` skills remain the pilot reporting anchors. They should not be removed or renamed during the pilot.

## Future structure

The reference maps introduce child micro-skills under the existing anchors so diagnostics, remediation, question generation, parent/tutor dashboards, and model-drawing support can become more precise.

Recommended hierarchy:

```text
Fractions domain
→ Stage / topic
→ Teachable micro-skill
→ Question family
→ Generated question
→ Misconception / remediation / recheck
```

## Files

- `FRACTIONS_MASTER_SKILL_MAP.md` — human-readable master skill map.
- `FRACTIONS_KOOBITS_REFERENCE_CROSSWALK.md` — source-reference crosswalk from uploaded screenshots/PDFs to Tian OS skill areas.
- `FRACTIONS_MODEL_DRAWING_MAP.md` — model-drawing and heuristics classification.
- `fractions-master-skill-map.json` — JSON-ready structure for later runtime/data work.

## Source-use boundary

The uploaded third-party screenshots/PDFs are used only for curriculum structure inspiration. Runtime Tian OS content must use original wording, original values, original diagrams, and original explanations.

Do not copy source questions, source diagrams, source IDs, or source solution wording into production content.

## Implementation boundary

These docs are reference maps only. They do not change runtime code, question generation, seed data, routes, dashboards, or student-facing content.
