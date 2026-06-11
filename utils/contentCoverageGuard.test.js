import { describe, expect, it } from 'vitest';
import { coverageReportQuestionTotal } from '../services/mathpath/contentCoverageEngine.js';

describe('coverageReportQuestionTotal (empty-DB clobber guard)', () => {
  it('sums totalQuestions across all skills', () => {
    expect(coverageReportQuestionTotal({
      skillCoverage: [
        { skillId: 'F001', totalQuestions: 61 },
        { skillId: 'F002', totalQuestions: 65 },
      ],
    })).toBe(126);
  });

  it('returns 0 when every skill has no questions (unseeded DB)', () => {
    expect(coverageReportQuestionTotal({
      skillCoverage: [
        { skillId: 'F001', totalQuestions: 0 },
        { skillId: 'F002', totalQuestions: 0 },
      ],
    })).toBe(0);
  });

  it('treats missing/invalid counts as zero and is safe on empty input', () => {
    expect(coverageReportQuestionTotal({ skillCoverage: [{ skillId: 'F001' }, { totalQuestions: 'x' }] })).toBe(0);
    expect(coverageReportQuestionTotal({})).toBe(0);
    expect(coverageReportQuestionTotal()).toBe(0);
  });
});
