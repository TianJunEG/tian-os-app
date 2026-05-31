import { DIAGRAM_TYPE_DEFINITIONS } from './diagramTypes.js';
import { diagramRenderers, renderDiagramSpec } from './diagramRenderer.js';
import { diagramValidators, validateDiagramSpec } from './diagramValidator.js';

const registry = new Map(
  DIAGRAM_TYPE_DEFINITIONS.map((definition) => [
    definition.type,
    {
      ...definition,
      validate: diagramValidators[definition.type],
      render: diagramRenderers[definition.type],
    },
  ])
);

export function listDiagramTypes() {
  return [...registry.values()].map(({ code, type, name }) => ({ code, type, name }));
}

export function getDiagramType(type) {
  return registry.get(type) || null;
}

export function hasDiagramType(type) {
  return registry.has(type);
}

export function validateAndRenderDiagramSpec(spec, options = {}) {
  const validation = validateDiagramSpec(spec);
  if (!validation.valid) {
    return {
      valid: false,
      errors: validation.errors,
      spec: validation.normalizedSpec,
      svg: '',
    };
  }
  const rendered = renderDiagramSpec(validation.normalizedSpec, options);
  return {
    valid: true,
    errors: [],
    spec: rendered.spec,
    svg: rendered.svg,
  };
}

export function createQuestionDiagramPayload(diagramSpec) {
  const validation = validateDiagramSpec(diagramSpec);
  return {
    diagramSpec: validation.normalizedSpec,
    valid: validation.valid,
    errors: validation.errors,
  };
}

export function toQuestionVisual(diagramSpec) {
  const payload = createQuestionDiagramPayload(diagramSpec);
  return {
    type: 'diagram',
    alt: payload.diagramSpec?.title || payload.diagramSpec?.type || 'Diagram',
    version: 'v1',
    payload,
  };
}
