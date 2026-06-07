import { describe, expect, it } from 'vitest';
import MisconceptionAsset from '../models/mathpath/MisconceptionAsset.js';

describe('MisconceptionAsset model', () => {
  it('validates a complete misconception asset', () => {
    const asset = new MisconceptionAsset({
      misconceptionId: 'adds_denominators_directly',
      title: 'Adds denominators directly',
      explanation: 'Student adds denominators when adding fractions.',
      visualModelType: 'fraction_strip',
      workedExample: {
        incorrectMethod: '1/2 + 1/3 = 2/5',
        whyIncorrect: 'The parts are not the same size.',
        correctMethod: 'Rename into sixths before adding.',
        visualExplanation: 'Use fraction strips.',
        keyTakeaway: 'Find a common denominator first.',
      },
      guidedPracticeIds: ['guided_1'],
      independentPracticeIds: ['independent_1'],
      recheckQuestionIds: ['recheck_1'],
      status: 'ready',
    });

    expect(asset.validateSync()).toBeUndefined();
  });

  it('requires an id, title and explanation', () => {
    const asset = new MisconceptionAsset({});
    const error = asset.validateSync();

    expect(error.errors.misconceptionId).toBeTruthy();
    expect(error.errors.title).toBeTruthy();
    expect(error.errors.explanation).toBeTruthy();
  });
});
