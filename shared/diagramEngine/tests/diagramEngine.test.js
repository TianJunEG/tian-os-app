import { describe, expect, it } from 'vitest';
import { DIAGRAM_TYPE_DEFINITIONS } from '../diagramTypes.js';
import { diagramExamples } from '../examples/diagramExamples.js';
import { listDiagramTypes, validateAndRenderDiagramSpec } from '../diagramRegistry.js';
import { renderDiagramSpec } from '../diagramRenderer.js';
import { validateDiagramSpec } from '../diagramValidator.js';

describe('Diagram Engine v1', () => {
  it('registers all DG001-DG016 diagram types', () => {
    const listed = listDiagramTypes();
    expect(listed).toHaveLength(22);
    DIAGRAM_TYPE_DEFINITIONS.forEach((typeDef) => {
      expect(listed.find((item) => item.type === typeDef.type)?.code).toBe(typeDef.code);
    });
  });

  it('has three examples per diagram type', () => {
    DIAGRAM_TYPE_DEFINITIONS.forEach((typeDef) => {
      const examples = diagramExamples[typeDef.type];
      expect(Array.isArray(examples)).toBe(true);
      expect(examples).toHaveLength(3);
    });
  });

  it('validates and renders all diagram examples', () => {
    DIAGRAM_TYPE_DEFINITIONS.forEach((typeDef) => {
      const examples = diagramExamples[typeDef.type] || [];
      examples.forEach((exampleSpec) => {
        const validation = validateDiagramSpec(exampleSpec);
        expect(validation.valid).toBe(true);
        expect(validation.errors).toEqual([]);

        const rendered = renderDiagramSpec(exampleSpec);
        expect(rendered.svg).toContain('<svg');
        expect(rendered.svg).toContain('width="100%"');
        expect(rendered.svg).toContain('preserveAspectRatio="xMidYMid meet"');
        expect(rendered.svg).toContain('fill="#ffffff"');
        expect(rendered.svg).toContain('#111111');
      });
    });
  });

  it('rejects invalid specs with clear errors', () => {
    const invalidFraction = {
      id: 'BAD_001',
      type: 'fraction_model',
      title: 'Invalid',
      labels: {},
      metadata: {},
      schemaVersion: 'tian-diagram-spec-v1',
      width: 640,
      height: 360,
      data: { parts: 0, shaded: 4 },
    };
    const result = validateDiagramSpec(invalidFraction);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('parts'))).toBe(true);
  });

  it('returns safe result from validateAndRenderDiagramSpec', () => {
    const validSpec = diagramExamples.number_line[0];
    const ok = validateAndRenderDiagramSpec(validSpec);
    expect(ok.valid).toBe(true);
    expect(ok.svg).toContain('<svg');

    const bad = validateAndRenderDiagramSpec({
      id: 'BAD_002',
      type: 'number_line',
      title: 'Broken',
      labels: {},
      metadata: {},
      schemaVersion: 'tian-diagram-spec-v1',
      width: 640,
      height: 360,
      data: { start: 10, end: 0, step: 0 },
    });
    expect(bad.valid).toBe(false);
    expect(Array.isArray(bad.errors)).toBe(true);
    expect(bad.svg).toBe('');
  });
});
