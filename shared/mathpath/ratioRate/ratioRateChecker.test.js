import { describe, it, expect } from 'vitest';
import { checkRatioRateAnswer } from './ratioRateQuestionGenerator.js';

const q = (display, accepted = [display]) => ({ answer: { display }, acceptedAnswers: accepted });

describe('checkRatioRateAnswer — ratio order is significant', () => {
  it('rejects a reversed ratio (the authored distractor)', () => {
    // "3 red : 2 blue" — the reversed "2:3" is a deliberate wrong choice.
    expect(checkRatioRateAnswer({ question: q('3:2'), studentResponse: '2:3' }).correct).toBe(false);
    expect(checkRatioRateAnswer({ question: q('2:1'), studentResponse: '1:2' }).correct).toBe(false);
    // 3-term ratio permutation is also wrong.
    expect(checkRatioRateAnswer({ question: q('1:2:3'), studentResponse: '3:2:1' }).correct).toBe(false);
  });

  it('still accepts the correct ratio (incl. spacing)', () => {
    expect(checkRatioRateAnswer({ question: q('3:2'), studentResponse: '3:2' }).correct).toBe(true);
    expect(checkRatioRateAnswer({ question: q('3:2'), studentResponse: '3 : 2' }).correct).toBe(true);
    expect(checkRatioRateAnswer({ question: q('1:2:3'), studentResponse: '1:2:3' }).correct).toBe(true);
  });

  it('keeps order-independence for UNORDERED amount lists (no colon)', () => {
    // "$78 and $130" is an unordered pair — either order is fine here.
    expect(checkRatioRateAnswer({ question: q('$78 and $130'), studentResponse: '130, 78' }).correct).toBe(true);
    expect(checkRatioRateAnswer({ question: q('$78 and $130'), studentResponse: '78, 130' }).correct).toBe(true);
    // ...but a wrong amount is still wrong.
    expect(checkRatioRateAnswer({ question: q('$78 and $130'), studentResponse: '78, 120' }).correct).toBe(false);
  });
});
