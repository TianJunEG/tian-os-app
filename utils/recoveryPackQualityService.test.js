import { describe, expect, it } from 'vitest';
import {
  auditGuidedPracticeProgression,
  auditRecheckAlignment,
  auditRecoveryPackCoverage,
  auditWorkedExampleCoverage,
  scoreRecoveryPackQuality,
} from '../services/mathpath/recoveryPackQualityService.js';

describe('recoveryPackQualityService', () => {
  it('scores a misconception-aligned Recovery Pack as strong', () => {
    const score = scoreRecoveryPackQuality({
      assignment: {
        _id: 'assignment_1',
        sourceType: 'diagnostic',
        skillIds: ['F018'],
        recheck: { diagnosticSessionId: 'recheck_1' },
      },
      sourceDiagnostic: {
        perSkillSnapshot: [
          { skillId: 'F018', score: 34, misconceptionTags: ['adds_denominators_directly'] },
        ],
      },
    });

    expect(score.qualityScore).toBeGreaterThanOrEqual(85);
    expect(score.qualityBand).toBe('strong');
    expect(score.misconceptionTags).toContain('adds_denominators_directly');
  });

  it('flags weak Recovery Packs that lack source evidence and recheck alignment', () => {
    const score = scoreRecoveryPackQuality({
      assignment: { _id: 'assignment_2', skillIds: [] },
    });

    expect(score.qualityBand).toBe('weak');
    expect(score.missing).toContain('skill_alignment_missing');
    expect(score.missing).toContain('recheck_alignment_missing');
  });

  it('audits Recovery Pack coverage across fraction skills', () => {
    const coverage = auditRecoveryPackCoverage();

    expect(coverage.skillCount).toBe(26);
    expect(coverage.rows.every((row) => row.recoveryContentExists)).toBe(true);
    expect(coverage.rows.find((row) => row.skillId === 'F024').recheckAlignmentExists).toBe(true);
  });

  it('audits worked example coverage and common trap explanation', () => {
    const audit = auditWorkedExampleCoverage();

    expect(audit.rows.length).toBeGreaterThan(0);
    expect(audit.rows.find((row) => row.misconceptionId === 'uses_original_instead_of_remainder').explainsCommonTrap).toBe(true);
  });

  it('audits guided practice progression and missing stages', () => {
    const audit = auditGuidedPracticeProgression();
    const f018 = audit.rows.find((row) => row.skillId === 'F018');

    expect(f018.checks.guidedPractice).toBe(true);
    expect(f018.checks.masteryCheck).toBe(true);
  });

  it('checks whether recheck covers the assigned target skills', () => {
    const rows = auditRecheckAlignment({
      assignments: [
        { _id: 'assignment_1', skillIds: ['F018', 'F019'], recheck: {} },
      ],
      diagnostics: [
        { diagnosticPurpose: 'recheck', assignmentId: 'assignment_1', perSkillSnapshot: [{ skillId: 'F018', score: 80 }] },
      ],
    });

    expect(rows[0].alignmentStatus).toBe('partial');
    expect(rows[0].missingTargetSkills).toEqual(['F019']);
  });
});
