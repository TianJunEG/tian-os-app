import { describe, it, expect } from 'vitest';
import { isCorrectWithContext } from './answerCheck.js';

// Generic/kiosk/test-paper grading must not mark a correctly grouped number wrong.
describe('isCorrectWithContext — thousands separators', () => {
  it('accepts a correct number written with thousands separators', () => {
    expect(isCorrectWithContext('2,808', '2808')).toBe(true);
    expect(isCorrectWithContext('1,000', '1000')).toBe(true);
    expect(isCorrectWithContext('1,000,000', '1000000')).toBe(true);
    // reversed (expected grouped, student plain) also holds
    expect(isCorrectWithContext('2808', '2,808')).toBe(true);
    // with a decimal part
    expect(isCorrectWithContext('1,234.5', '1234.5')).toBe(true);
  });

  it('still rejects a genuinely wrong number', () => {
    expect(isCorrectWithContext('2,808', '2807')).toBe(false);
    expect(isCorrectWithContext('1,000', '10000')).toBe(false);
  });
});
