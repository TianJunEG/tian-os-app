import { evaluateQuestionVisualCoverage } from './skillVisualRequirementEngine.js';

export function evaluateDiagramRequirement(question = {}) {
  const coverage = evaluateQuestionVisualCoverage(question);

  return {
    requiresDiagram: coverage.diagramRequired,
    requiredVisuals: coverage.requirements,
    providedVisuals: coverage.providedVisualTypes,
    hasVisual: coverage.hasVisual,
    missingVisuals: coverage.missingVisualTypes,
    status: coverage.status,
  };
}

export function getRequiredVisualTypes(question = {}) {
  return evaluateDiagramRequirement(question).requiredVisuals.map((item) => item.visualType);
}

export default {
  evaluateDiagramRequirement,
  getRequiredVisualTypes,
};
