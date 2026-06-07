import { describe, expect, it } from 'vitest';
import {
  auditCuratedReferenceIntegrity,
  auditFractionsRuntimeEvidenceIntegrity,
  auditRecoveryPackIntegrity,
  auditRecheckIntegrity,
  auditReportClaimIntegrity,
  auditWorksheetIntegrity,
  buildRuntimeEvidenceRepairPlan,
  buildMisconceptionDensityReport,
  buildQuestionReferenceIndex,
  evaluatePilotClaimGate,
  normalizeLegacyMistakeEvidence,
  normalizeRecheckSnapshot,
  runRuntimeEvidenceRepairAudit,
} from '../services/mathpath/fractionsRuntimeEvidenceIntegrityService.js';

function generatedQuestion(overrides = {}) {
  return {
    _id: overrides._id || overrides.sourceQuestionId || 'q1',
    domainId: 'fractions',
    skillId: 'F018',
    sourceQuestionId: overrides.sourceQuestionId || 'guided_f018_1',
    fingerprint: overrides.fingerprint || 'fp_guided_f018_1',
    templateId: overrides.templateId || 'template_f018_1',
    questionFamilyId: overrides.questionFamilyId || 'QF_F018_001',
    prompt: '1/2 + 1/3 = ?',
    explanation: 'Rename both fractions as sixths.',
    solutionSteps: ['1/2 = 3/6', '1/3 = 2/6', '3/6 + 2/6 = 5/6'],
    misconceptionTags: ['common_denominator_missing'],
    ...overrides,
  };
}

function recoveryPack(overrides = {}) {
  return {
    _id: 'assignment_1',
    sourceType: 'diagnostic',
    sourceId: 'diag_1',
    domainId: 'fractions',
    skillIds: ['F018'],
    misconceptionIds: ['common_denominator_missing'],
    guidedPracticeFlow: {
      misconceptionIds: ['common_denominator_missing'],
      steps: [
        { type: 'guided_question', practiceId: 'guided_f018_1' },
        { type: 'independent_practice', practiceIds: ['independent_f018_1'] },
        { type: 'mastery_check', recheckQuestionIds: ['mastery_f018_1'] },
      ],
    },
    ...overrides,
  };
}

describe('fractionsRuntimeEvidenceIntegrityService', () => {
  it('validates canonical skill ids across runtime evidence', async () => {
    const report = await auditFractionsRuntimeEvidenceIntegrity({
      assignments: [recoveryPack({ skillIds: ['F999'] })],
      generatedQuestions: [
        generatedQuestion({ sourceQuestionId: 'guided_f018_1' }),
        generatedQuestion({ sourceQuestionId: 'independent_f018_1' }),
        generatedQuestion({ sourceQuestionId: 'mastery_f018_1' }),
      ],
    });

    expect(report.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'invalid_canonical_skill_reference', actual: 'F999' }),
    ]));
    expect(report.ok).toBe(false);
  });

  it('detects missing Recovery Pack question references', () => {
    const questionIndex = buildQuestionReferenceIndex({
      generatedQuestions: [generatedQuestion({ sourceQuestionId: 'guided_f018_1' })],
    });
    const rows = auditRecoveryPackIntegrity({
      assignments: [recoveryPack()],
      questionIndex,
    });

    expect(rows[0].status).toBe('Not Ready');
    expect(rows[0].issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'missing_question_reference', actual: 'independent_f018_1' }),
      expect.objectContaining({ type: 'missing_question_reference', actual: 'mastery_f018_1' }),
    ]));
  });

  it('detects recheck target mismatch against linked assignment', () => {
    const rows = auditRecheckIntegrity({
      assignments: [recoveryPack({ _id: 'assignment_1', skillIds: ['F018'] })],
      rechecks: [{
        diagnosticSessionId: 'recheck_1',
        assignmentId: 'assignment_1',
        targetSkillIds: ['F019'],
        targetMisconceptionIds: ['common_denominator_missing'],
      }],
    });

    expect(rows[0].status).toBe('Not Ready');
    expect(rows[0].issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'recheck_target_mismatch' }),
    ]));
  });

  it('detects worksheet target-skill mismatch and raw F-code copy', () => {
    const questionIndex = buildQuestionReferenceIndex({
      generatedQuestions: [generatedQuestion({ sourceQuestionId: 'worksheet_q1', skillId: 'F018' })],
    });
    const rows = auditWorksheetIntegrity({
      questionIndex,
      worksheets: [{
        _id: 'worksheet_1',
        domain: 'fractions',
        sourceMode: 'recovery_pack',
        interventionSourceId: 'assignment_1',
        skillIds: ['F019'],
        generatedContent: {
          title: 'F018 Recovery Worksheet',
          questions: [{ questionId: 'worksheet_q1', skillId: 'F019', stem: 'Practise F018.' }],
        },
      }],
    });

    expect(rows[0].issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'question_skill_target_mismatch' }),
      expect.objectContaining({ type: 'worksheet_user_copy_raw_f_code' }),
    ]));
  });

  it('blocks broad P1-P6/full MathPath report claims', () => {
    const issues = auditReportClaimIntegrity({
      reports: [{
        reportId: 'report_1',
        scopeLabel: 'Full P1-P6 MathPath',
        parentFriendlySummary: 'Your child has mastered Fractions and MathPath identified all weak areas.',
      }],
    });

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'report_overclaim', severity: 'critical' }),
      expect.objectContaining({ type: 'report_scope_label_mismatch' }),
    ]));
  });

  it('flags sparse misconception density for skills without runtime tags', () => {
    const density = buildMisconceptionDensityReport({
      generatedQuestions: [generatedQuestion({ skillId: 'F018', misconceptionTags: ['common_denominator_missing'] })],
      assignments: [recoveryPack()],
    });

    const f018 = density.find((row) => row.skillId === 'F018');
    const f001 = density.find((row) => row.skillId === 'F001');
    expect(f018.status).toBe('Ready');
    expect(f001.status).toBe('Not Ready');
  });

  it('detects fallback-only curated references', () => {
    const rows = auditCuratedReferenceIntegrity({
      assignments: [recoveryPack()],
      generatedQuestions: [],
    });

    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ referenceId: 'guided_f018_1', resolved: false, source: 'fallback_required' }),
      expect.objectContaining({ referenceId: 'independent_f018_1', resolved: false, source: 'fallback_required' }),
      expect.objectContaining({ referenceId: 'mastery_f018_1', resolved: false, source: 'fallback_required' }),
    ]));
  });

  it('normalizes recheck refs to canonical skill ids and preserves assignment/source link', () => {
    const questionIndex = buildQuestionReferenceIndex({
      generatedQuestions: [generatedQuestion({ sourceQuestionId: 'recheck_f018_1' })],
    });
    const normalized = normalizeRecheckSnapshot({
      assignment: recoveryPack({ _id: 'assignment_1', skillIds: ['F018'], misconceptionIds: ['common_denominator_missing'] }),
      recheck: {
        diagnosticSessionId: 'recheck_1',
        sourceId: 'assignment_1',
        perSkillSnapshot: [{ skillId: 'F018', evidenceQuestionIds: ['recheck_f018_1'] }],
      },
      questionIndex,
    });

    expect(normalized.patch).toMatchObject({
      assignmentId: 'assignment_1',
      sourceType: 'assignment',
      targetSkillIds: ['F018'],
      targetMisconceptionIds: ['common_denominator_missing'],
      evidenceQuestionIds: ['recheck_f018_1'],
      confidenceLabel: 'Moderate Confidence',
    });
    expect(normalized.unrepaired).toEqual([]);
  });

  it('normalizes legacy mistake misconceptions safely without upgrading reviewed-only mastery', () => {
    const row = normalizeLegacyMistakeEvidence({
      mistake: {
        _id: 'mistake_1',
        skillCode: 'F018',
        misconceptionTag: 'M001',
        reviewed: true,
        status: 'reviewed',
      },
    });

    expect(row.patch).toMatchObject({
      misconceptionTag: 'common_denominator_missing',
      learningStatus: 'acknowledged',
    });
    expect(row.evidenceStatus).toBe('reviewed_only');
    expect(row.patch.resolved).toBeUndefined();
  });

  it('downgrades mastered legacy mistakes without mastery evidence in the repair plan', () => {
    const row = normalizeLegacyMistakeEvidence({
      mistake: {
        _id: 'mistake_2',
        skillCode: 'F018',
        misconceptionTag: 'common_denominator_missing',
        reviewed: true,
        resolved: true,
        status: 'resolved',
        learningStatus: 'mastered',
      },
    });

    expect(row.patch).toMatchObject({
      learningStatus: 'acknowledged',
      resolved: false,
      status: 'reviewed',
    });
  });

  it('adds an audit worksheet path from a real Recovery Pack when worksheet records are missing', () => {
    const plan = buildRuntimeEvidenceRepairPlan({
      assignments: [recoveryPack()],
      generatedQuestions: [
        generatedQuestion({ sourceQuestionId: 'guided_f018_1' }),
        generatedQuestion({ sourceQuestionId: 'independent_f018_1' }),
        generatedQuestion({ sourceQuestionId: 'mastery_f018_1' }),
      ],
      worksheets: [],
    });

    expect(plan.summary.worksheetsSeededForAudit).toBe(1);
    expect(plan.worksheetSeedRecord).toMatchObject({
      interventionSourceType: 'recovery_pack',
      skillIds: ['F018'],
    });
    expect(plan.worksheetSeedRecord.generatedContent.questions).toHaveLength(3);
  });

  it('detects worksheet records that include quarantined or wrong-family question references', () => {
    const questionIndex = buildQuestionReferenceIndex({
      generatedQuestions: [
        generatedQuestion({
          sourceQuestionId: 'bad_q',
          skillId: 'F019',
          metadata: { quarantined: true },
        }),
      ],
    });
    const rows = auditWorksheetIntegrity({
      questionIndex,
      worksheets: [{
        _id: 'worksheet_bad',
        domain: 'fractions',
        sourceMode: 'recovery_pack',
        interventionSourceId: 'assignment_1',
        skillIds: ['F018'],
        generatedContent: {
          title: 'Recovery Pack Worksheet',
          questions: [{ questionId: 'bad_q', frameworkSkillId: 'F018', stem: 'Question' }],
        },
      }],
    });

    expect(rows[0].issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'question_skill_target_mismatch' }),
    ]));
  });

  it('reports before/after counts from the runtime repair audit', async () => {
    const result = await runRuntimeEvidenceRepairAudit({
      assignments: [recoveryPack()],
      generatedQuestions: [
        generatedQuestion({ sourceQuestionId: 'guided_f018_1' }),
        generatedQuestion({ sourceQuestionId: 'independent_f018_1' }),
        generatedQuestion({ sourceQuestionId: 'mastery_f018_1' }),
        generatedQuestion({ sourceQuestionId: 'recheck_f018_1' }),
      ],
      rechecks: [{
        diagnosticSessionId: 'recheck_1',
        assignmentId: 'assignment_1',
        perSkillSnapshot: [{ skillId: 'F018', evidenceQuestionIds: ['recheck_f018_1'] }],
      }],
      worksheets: [],
      reports: [{ reportId: 'r1', scopeLabel: 'Fractions intervention pilot', confidenceLabel: 'Limited Evidence' }],
    });

    expect(result.before.recordsAudited.worksheets).toBe(0);
    expect(result.after.recordsAudited.worksheets).toBe(1);
    expect(result.repairPlan.summary.rechecksChanged).toBe(1);
  });

  it('blocks pilot-strength claims when critical issues or missing worksheet path remain', () => {
    const gate = evaluatePilotClaimGate({
      recordsAudited: { worksheets: 0 },
      issues: [
        { severity: 'critical', type: 'report_overclaim', source: 'reports' },
        { severity: 'high', type: 'missing_question_reference', source: 'rechecks' },
      ],
    });

    expect(gate.result).toBe('Pilot evidence blocked');
    expect(gate.reasons.join(' ')).toMatch(/critical/);
    expect(gate.reasons.join(' ')).toMatch(/worksheet audit path missing/);
  });
});
