# Tian OS Diagram Engine v1

Deterministic, validator-first SVG diagram pipeline for MathPath, worksheets, diagnostics, assessments, and future modules.

## Pipeline

`DiagramSpec -> Validator -> SVG Renderer -> Question/Worksheet Renderer`

## DiagramSpec standard

```json
{
  "id": "DG001_EX1",
  "type": "number_line",
  "title": "Fraction on 0-1 Number Line",
  "labels": {},
  "metadata": {},
  "schemaVersion": "tian-diagram-spec-v1",
  "width": 640,
  "height": 360,
  "data": {}
}
```

## Supported types (DG001–DG016)

- `number_line`
- `fraction_model`
- `fraction_circle`
- `equal_groups`
- `arrays`
- `picture_collections`
- `place_value_blocks`
- `bar_graph`
- `picture_graph`
- `table`
- `shape_library`
- `shape_composition`
- `dot_grid`
- `clock`
- `length_measurement`
- `comparison_models`

## Integration notes

- Use `createQuestionDiagramPayload(diagramSpec)` from `diagramRegistry.js` in question/worksheet pipelines.
- Use `toQuestionVisual(diagramSpec)` to convert a validated spec into the existing visual payload format.
- Store diagram specs with question payloads.
- Render SVG on demand via `renderDiagramSpec(spec)` or `validateAndRenderDiagramSpec(spec)`.

## Example rendering

```bash
node shared/diagramEngine/examples/renderExampleSvgs.mjs
```

This generates 48 SVG example files in `shared/diagramEngine/examples/svg/`.

## Future hooks (not implemented in v1)

- Triangle area with advanced constructions
- Parallel lines and angle families
- 3D cube stacks and nets
- Pie charts and line graphs for upper primary
- Ratio bars and advanced bar models
