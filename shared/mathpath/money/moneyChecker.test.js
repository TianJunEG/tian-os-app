import { describe, it, expect } from 'vitest';
import { checkMoneyAnswer } from './MoneyQuestionGenerator.js';

const ans = (display) => ({ answer: { display } });

describe('checkMoneyAnswer — bare-cents leniency is scoped to sub-$1 answers', () => {
  it('rejects a 100x place-value error for a dollar answer', () => {
    // "$5.00" is 500 cents; a bare "500" must NOT be accepted as "500 cents".
    expect(checkMoneyAnswer({ question: ans('$5.00'), studentResponse: '500' }).correct).toBe(false);
    expect(checkMoneyAnswer({ question: ans('$1.20'), studentResponse: '120' }).correct).toBe(false);
  });

  it('still accepts the correct dollar answer in any normal form', () => {
    for (const s of ['5', '5.00', '$5.00', '$5']) {
      expect(checkMoneyAnswer({ question: ans('$5.00'), studentResponse: s }).correct).toBe(true);
    }
  });

  it('keeps the coin-value leniency for sub-$1 answers ("40" == $0.40)', () => {
    for (const s of ['40', '40c', '40¢', '$0.40', '0.40']) {
      expect(checkMoneyAnswer({ question: ans('$0.40'), studentResponse: s }).correct).toBe(true);
    }
    // ...but a wrong cent value is still wrong.
    expect(checkMoneyAnswer({ question: ans('$0.40'), studentResponse: '4' }).correct).toBe(false);
  });
});
