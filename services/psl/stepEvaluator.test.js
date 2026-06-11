import { describe, it, expect } from 'vitest';
import { evaluateStep, evaluateAttempt, STEP_IDS } from './stepEvaluator.js';

describe('STEP_IDS', () => {
  it('has exactly the 6 scaffold steps in order', () => {
    expect(STEP_IDS).toEqual(['understand', 'identify_info', 'identify_question', 'plan', 'solve', 'check']);
  });
});

describe('evaluateStep — understand', () => {
  const expected = { correctIndex: 0 };

  it('correct MC selection', () => {
    const r = evaluateStep('understand', { selectedIndex: 0 }, expected);
    expect(r.correct).toBe(true);
    expect(r.score).toBe(1);
    expect(r.feedback).toBe('Well done!');
  });

  it('wrong MC selection', () => {
    const r = evaluateStep('understand', { selectedIndex: 2 }, expected);
    expect(r.correct).toBe(false);
    expect(r.score).toBe(0);
  });

  it('string index coerced to number', () => {
    const r = evaluateStep('understand', { selectedIndex: '0' }, expected);
    expect(r.correct).toBe(true);
  });

  it('free text mode — accepts sufficiently long text', () => {
    const r = evaluateStep('understand', { text: 'The story is about buying apples' }, {});
    expect(r.correct).toBe(true);
    expect(r.score).toBe(1);
  });

  it('free text mode — rejects very short text', () => {
    const r = evaluateStep('understand', { text: 'ok' }, {});
    expect(r.correct).toBe(false);
  });
});

describe('evaluateStep — identify_info', () => {
  const expected = { numbers: [45, 23] };

  it('correct numbers in any order', () => {
    const r = evaluateStep('identify_info', { numbers: [23, 45] }, expected);
    expect(r.correct).toBe(true);
    expect(r.score).toBe(1);
  });

  it('partial — missed one number', () => {
    const r = evaluateStep('identify_info', { numbers: [45] }, expected);
    expect(r.correct).toBe(false);
    expect(r.partial).toBe(true);
    expect(r.score).toBe(0.5);
    expect(r.misconceptionTag).toBe('psl/missed-number');
  });

  it('wrong — included irrelevant number', () => {
    const r = evaluateStep('identify_info', { numbers: [99] }, expected);
    expect(r.correct).toBe(false);
    expect(r.misconceptionTag).toBe('psl/included-irrelevant');
  });

  it('wrong — empty selection', () => {
    const r = evaluateStep('identify_info', { numbers: [] }, expected);
    expect(r.correct).toBe(false);
    expect(r.score).toBe(0);
  });

  it('handles string numbers', () => {
    const r = evaluateStep('identify_info', { numbers: ['45', '23'] }, expected);
    expect(r.correct).toBe(true);
  });

  it('no expected numbers — always correct', () => {
    const r = evaluateStep('identify_info', { numbers: [1, 2, 3] }, { numbers: [] });
    expect(r.correct).toBe(true);
  });
});

describe('evaluateStep — identify_question', () => {
  const expected = { correctIndex: 1 };

  it('correct selection', () => {
    const r = evaluateStep('identify_question', { selectedIndex: 1 }, expected);
    expect(r.correct).toBe(true);
    expect(r.misconceptionTag).toBe('');
  });

  it('wrong selection', () => {
    const r = evaluateStep('identify_question', { selectedIndex: 0 }, expected);
    expect(r.correct).toBe(false);
    expect(r.misconceptionTag).toBe('psl/confused-question');
  });
});

describe('evaluateStep — plan', () => {
  const expected = { modelType: 'partWhole', unknownPosition: 'whole' };

  it('both correct', () => {
    const r = evaluateStep('plan', { modelType: 'partWhole', unknownPosition: 'whole' }, expected);
    expect(r.correct).toBe(true);
    expect(r.score).toBe(1);
  });

  it('case insensitive match', () => {
    const r = evaluateStep('plan', { modelType: 'PARTWHOLE', unknownPosition: 'Whole' }, expected);
    expect(r.correct).toBe(true);
  });

  it('partial — right model wrong position', () => {
    const r = evaluateStep('plan', { modelType: 'partWhole', unknownPosition: 'part' }, expected);
    expect(r.correct).toBe(false);
    expect(r.partial).toBe(true);
    expect(r.score).toBe(0.5);
    expect(r.misconceptionTag).toBe('psl/wrong-unknown-position');
  });

  it('partial — wrong model right position', () => {
    const r = evaluateStep('plan', { modelType: 'comparison', unknownPosition: 'whole' }, expected);
    expect(r.correct).toBe(false);
    expect(r.partial).toBe(true);
    expect(r.misconceptionTag).toBe('psl/wrong-model-type');
  });

  it('both wrong', () => {
    const r = evaluateStep('plan', { modelType: 'comparison', unknownPosition: 'difference' }, expected);
    expect(r.correct).toBe(false);
    expect(r.score).toBe(0);
    expect(r.misconceptionTag).toBe('psl/wrong-model-type');
  });
});

describe('evaluateStep — solve', () => {
  const expected = { operation: 'addition', answer: 68 };

  it('correct answer', () => {
    const r = evaluateStep('solve', { answer: 68, operation: 'addition' }, expected);
    expect(r.correct).toBe(true);
    expect(r.score).toBe(1);
  });

  it('right operation wrong answer — arithmetic error', () => {
    const r = evaluateStep('solve', { answer: 67, operation: 'addition' }, expected);
    expect(r.correct).toBe(false);
    expect(r.partial).toBe(true);
    expect(r.misconceptionTag).toBe('psl/arithmetic-error');
  });

  it('wrong operation', () => {
    const r = evaluateStep('solve', { answer: 22, operation: 'subtraction' }, expected);
    expect(r.correct).toBe(false);
    expect(r.score).toBe(0);
    expect(r.misconceptionTag).toBe('psl/wrong-operation');
  });

  it('correct answer with no operation field', () => {
    const r = evaluateStep('solve', { answer: 68 }, expected);
    expect(r.correct).toBe(true);
  });

  describe('two-step problems', () => {
    const twoStepExpected = {
      steps: [
        { expression: '100 - 35' },
        { expression: '65 + 100' },
      ],
      answer: 165,
    };

    it('correct final answer', () => {
      const r = evaluateStep('solve', { answer: 165 }, twoStepExpected);
      expect(r.correct).toBe(true);
    });

    it('wrong final answer but correct intermediate', () => {
      const r = evaluateStep('solve', { answer: 999, intermediates: [65] }, twoStepExpected);
      expect(r.correct).toBe(false);
      expect(r.partial).toBe(true);
      expect(r.misconceptionTag).toBe('psl/arithmetic-error');
    });

    it('wrong everything', () => {
      const r = evaluateStep('solve', { answer: 999, intermediates: [50] }, twoStepExpected);
      expect(r.correct).toBe(false);
      expect(r.score).toBe(0);
      expect(r.misconceptionTag).toBe('psl/used-wrong-numbers');
    });
  });
});

describe('evaluateStep — check', () => {
  it('reasonable = true is correct', () => {
    const r = evaluateStep('check', { reasonable: true }, {});
    expect(r.correct).toBe(true);
    expect(r.score).toBe(1);
  });

  it('reasonable = false is wrong', () => {
    const r = evaluateStep('check', { reasonable: false }, {});
    expect(r.correct).toBe(false);
    expect(r.misconceptionTag).toBe('psl/skipped-check');
  });

  it('missing reasonable field is wrong', () => {
    const r = evaluateStep('check', {}, {});
    expect(r.correct).toBe(false);
  });
});

describe('evaluateStep — unknown step', () => {
  it('returns score 0 with feedback', () => {
    const r = evaluateStep('bogus', {}, {});
    expect(r.correct).toBe(false);
    expect(r.feedback).toBe('Unknown step.');
  });
});

describe('evaluateStep — feedback messages', () => {
  it('correct gives Well done!', () => {
    const r = evaluateStep('check', { reasonable: true }, {});
    expect(r.feedback).toBe('Well done!');
  });

  it('partial gives Almost there', () => {
    const r = evaluateStep('plan', { modelType: 'partWhole', unknownPosition: 'part' }, { modelType: 'partWhole', unknownPosition: 'whole' });
    expect(r.feedback).toMatch(/Almost there/);
  });

  it('wrong gives Not quite', () => {
    const r = evaluateStep('identify_question', { selectedIndex: 3 }, { correctIndex: 0 });
    expect(r.feedback).toMatch(/Not quite/);
  });
});

describe('evaluateAttempt', () => {
  it('all correct', () => {
    const steps = [
      { correct: true, score: 1 },
      { correct: true, score: 1 },
      { correct: true, score: 1 },
    ];
    const r = evaluateAttempt(steps);
    expect(r.overallCorrect).toBe(true);
    expect(r.overallScore).toBe(1);
  });

  it('mixed results', () => {
    const steps = [
      { correct: true, score: 1 },
      { correct: false, score: 0.5 },
      { correct: false, score: 0 },
    ];
    const r = evaluateAttempt(steps);
    expect(r.overallCorrect).toBe(false);
    expect(r.overallScore).toBe(0.5);
  });

  it('empty steps', () => {
    const r = evaluateAttempt([]);
    expect(r.overallCorrect).toBe(false);
    expect(r.overallScore).toBe(0);
  });

  it('single step', () => {
    const r = evaluateAttempt([{ correct: true, score: 1 }]);
    expect(r.overallCorrect).toBe(true);
    expect(r.overallScore).toBe(1);
  });
});
