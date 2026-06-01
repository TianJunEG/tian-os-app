import { describe, expect, it } from 'vitest';
import {
  buildQuestionWorkingMap,
  generateWorkingCode,
  getWorkingCodeDomainPrefix,
  summarizeWorkingSessionForReview,
} from '../services/mathpath/workingCodeService.js';

describe('MathPath working code service', () => {
  it('generates readable working codes by domain and skill', () => {
    expect(getWorkingCodeDomainPrefix('fractions')).toBe('FRAC');
    expect(getWorkingCodeDomainPrefix('ratio')).toBe('RATIO');
    expect(generateWorkingCode({ domainId: 'fractions', skillId: 'F025' })).toMatch(/^MP-FRAC-F025-[A-Z0-9]{4}$/);
  });

  it('maps question refs to working codes with required-working metadata', () => {
    const map = buildQuestionWorkingMap(
      [
        { questionId: 'q1', skillId: 'F025', workingRequired: true, workingReason: 'required_multi_step' },
        { questionId: 'q2', skillId: 'F001', workingRequired: false, workingReason: 'optional_conceptual' },
      ],
      { domainId: 'fractions', sessionId: 'practice_1' }
    );

    expect(map).toHaveLength(2);
    expect(map[0]).toMatchObject({
      questionId: 'q1',
      skillId: 'F025',
      domainId: 'fractions',
      sessionId: 'practice_1',
      workingRequired: true,
      workingReason: 'required_multi_step',
      mappingStatus: 'autoMapped',
    });
    expect(map[0].workingCode).toMatch(/^MP-FRAC-F025-[A-Z0-9]{4}$/);
    expect(map[1].workingRequired).toBe(false);
  });

  it('summarizes uploaded and missing workings for adult review queues', () => {
    const missing = summarizeWorkingSessionForReview({
      questionWorkingMap: [{ questionId: 'q1', workingRequired: true }],
      fileUrls: [],
    });
    expect(missing.analysisStatus).toBe('needs_review');
    expect(missing.recommendation).toMatch(/upload working evidence/i);

    const uploaded = summarizeWorkingSessionForReview({
      questionWorkingMap: [{ questionId: 'q1', workingRequired: true }],
      fileUrls: ['working://work_1/1/1'],
    });
    expect(uploaded.analysisStatus).toBe('pending_analysis');
    expect(uploaded.recommendation).toMatch(/review/i);
  });
});
