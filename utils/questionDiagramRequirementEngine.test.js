import { describe, expect, it } from 'vitest';
import { evaluateDiagramRequirement } from '../services/mathpath/questionDiagramRequirementEngine.js';

describe('questionDiagramRequirementEngine', () => {
  it('requires number-line visuals for number-line fraction skills', () => {
    const result = evaluateDiagramRequirement({
      skillId: 'F005',
      questionText: 'Place 3/4 on the number line.',
    });

    expect(result.requiresDiagram).toBe(true);
    expect(result.missingVisuals).toContain('number_line');
    expect(result.status).toBe('missing');
  });

  it('accepts supplied visual metadata when the required visual exists', () => {
    const result = evaluateDiagramRequirement({
      skillId: 'F005',
      questionText: 'Place 3/4 on the number line.',
      metadata: { visualType: 'number_line' },
    });

    expect(result.missingVisuals).toEqual([]);
    expect(result.status).toBe('present');
  });

  it('requires bar models for remainder-style word problems', () => {
    const result = evaluateDiagramRequirement({
      skillId: 'F025',
      questionText: 'A class used 1/2 of the cards, then 1/3 of the remainder. How many were left?',
    });

    expect(result.requiredVisuals.map((row) => row.visualType)).toContain('bar_model');
    expect(result.missingVisuals).toContain('bar_model');
  });
});
