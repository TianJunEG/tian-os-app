import { describe, expect, it } from 'vitest';
import {
  applyLegacyMistakeEvidenceBackfill,
  buildLegacyMistakeEvidenceAudit,
  classifyLegacyMistakeEvidence,
} from '../services/mathpath/legacyMistakeEvidenceAuditService.js';

function mistake(overrides = {}) {
  return {
    _id: overrides._id || 'mistake_1',
    module: 'MathPath',
    studentId: 'student_1',
    skillCode: 'F011',
    reviewed: false,
    resolved: false,
    status: 'open',
    learningStatus: '',
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
      return this;
    },
    ...overrides,
  };
}

describe('legacyMistakeEvidenceAuditService', () => {
  it('keeps reviewed-only legacy mistakes acknowledged, not mastered', () => {
    const row = classifyLegacyMistakeEvidence(mistake({ reviewed: true, status: 'reviewed' }));

    expect(row.classification).toBe('reviewed_without_evidence');
    expect(row.proposedState).toBe('acknowledged');
    expect(row.proposedPatch).toMatchObject({ learningStatus: 'acknowledged', resolved: false, status: 'reviewed' });
    expect(row.riskLevel).toBe('medium');
  });

  it('classifies reviewed mistakes with correction evidence as corrected', () => {
    const row = classifyLegacyMistakeEvidence(mistake({
      reviewed: true,
      reflection: 'I added the bottom numbers.',
      correctionAttempt: '5/6',
    }));

    expect(row.classification).toBe('reviewed_with_correction_evidence');
    expect(row.proposedState).toBe('corrected');
  });

  it('classifies reviewed mistakes with understanding evidence as understood', () => {
    const row = classifyLegacyMistakeEvidence(mistake({
      reviewed: true,
      understandingCheck: { answer: 'I need same-sized parts first.', passed: true },
    }));

    expect(row.classification).toBe('reviewed_with_understanding_evidence');
    expect(row.proposedState).toBe('understood');
  });

  it('downgrades mastered/resolved legacy mistakes without mastery evidence', async () => {
    const legacy = mistake({
      reviewed: true,
      resolved: true,
      status: 'resolved',
      learningStatus: 'mastered',
      understandingCheck: { answer: 'I now know the method.', passed: true },
    });

    const report = await applyLegacyMistakeEvidenceBackfill({ mistakes: [legacy], apply: true });

    expect(report.updated).toBe(1);
    expect(legacy.learningStatus).toBe('understood');
    expect(legacy.status).toBe('reviewed');
    expect(legacy.resolved).toBe(false);
    expect(legacy.saveCalls).toBe(1);
  });

  it('dry-run reports proposed updates without mutating records', async () => {
    const legacy = mistake({ reviewed: true, status: 'reviewed' });

    const report = await applyLegacyMistakeEvidenceBackfill({ mistakes: [legacy], apply: false });

    expect(report.dryRun).toBe(true);
    expect(report.wouldUpdate).toBe(1);
    expect(legacy.learningStatus).toBe('');
    expect(legacy.saveCalls).toBe(0);
  });

  it('is idempotent once the proposed state is already stored', async () => {
    const legacy = mistake({ reviewed: true, status: 'reviewed', learningStatus: 'acknowledged' });

    const first = await applyLegacyMistakeEvidenceBackfill({ mistakes: [legacy], apply: true });
    const second = await applyLegacyMistakeEvidenceBackfill({ mistakes: [legacy], apply: true });

    expect(first.updated).toBe(0);
    expect(second.updated).toBe(0);
    expect(legacy.saveCalls).toBe(0);
  });

  it('builds an admin QA report with affected students and skills', () => {
    const report = buildLegacyMistakeEvidenceAudit({
      mistakes: [
        mistake({ _id: 'm1', reviewed: true, status: 'reviewed', studentId: 's1', skillCode: 'F011' }),
        mistake({ _id: 'm2', reviewed: true, status: 'resolved', resolved: true, studentId: 's2', skillCode: 'F015' }),
        mistake({ _id: 'm3', reviewed: true, masteryEvidence: { evidenceType: 'recheck' }, studentId: 's3', skillCode: 'F018' }),
      ],
    });

    expect(report.totalLegacyMistakes).toBe(3);
    expect(report.reviewedWithoutEvidence).toBe(1);
    expect(report.masteredWithoutEvidence).toBe(1);
    expect(report.progressRiskRecords).toBe(2);
    expect(report.affectedStudents).toEqual(['s1', 's2']);
    expect(report.affectedSkills).toEqual(['F011', 'F015']);
  });
});
