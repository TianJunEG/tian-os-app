import { describe, it, expect } from 'vitest';
import { buildFluencySubmitPayload, summariseFluencyResult } from './DecimalsFluencySession';

describe('DecimalsFluencySession.buildFluencySubmitPayload', () => {
  it('maps answers and drops blanks', () => {
    const payload = buildFluencySubmitPayload([
      { questionId: 'QF_D003_001__f0', studentAnswer: '4.8', timeTaken: 3 },
      { questionId: 'x', studentAnswer: '  ', timeTaken: 9 },
      { questionId: 'QF_D003_002__f0', studentAnswer: 7, timeTaken: '2' },
    ]);
    expect(payload.responses).toEqual([
      { questionId: 'QF_D003_001__f0', studentAnswer: '4.8', timeTaken: 3 },
      { questionId: 'QF_D003_002__f0', studentAnswer: '7', timeTaken: 2 },
    ]);
  });
});

describe('DecimalsFluencySession.summariseFluencyResult', () => {
  it('maps a band result into display fields', () => {
    const view = summariseFluencyResult({
      band: 'gold',
      accuracy: 95,
      averageTime: 6.2,
      total: 8,
      correct: 8,
      benchmarks: { bronze: 18, silver: 14, gold: 10, platinum: 7 },
    });
    expect(view).toMatchObject({
      band: 'gold',
      bandLabel: 'Gold',
      accuracy: 95,
      averageTime: 6.2,
      total: 8,
      correct: 8,
      goldSeconds: 10,
    });
  });

  it('falls back to notReady on an empty summary', () => {
    const view = summariseFluencyResult({});
    expect(view).toMatchObject({ band: 'notReady', bandLabel: 'Keep practising', accuracy: 0, averageTime: null, goldSeconds: null });
  });
});
