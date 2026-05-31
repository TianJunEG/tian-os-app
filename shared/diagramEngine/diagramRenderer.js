import { diagramSvgRenderers } from './svg/renderers.js';
import { validateDiagramSpec } from './diagramValidator.js';

export const diagramRenderers = diagramSvgRenderers;

export function renderDiagramSpec(rawSpec = {}, options = {}) {
  const validation = validateDiagramSpec(rawSpec);
  if (!validation.valid) {
    const error = new Error(`Invalid diagram spec: ${validation.errors.join(' | ')}`);
    error.validation = validation;
    throw error;
  }

  const type = validation.normalizedSpec.type;
  const renderer = diagramRenderers[type];
  if (!renderer) {
    throw new Error(`No SVG renderer registered for diagram type "${type}".`);
  }

  const svg = renderer(validation.normalizedSpec, options);
  return {
    svg,
    type,
    id: validation.normalizedSpec.id,
    spec: validation.normalizedSpec,
  };
}
