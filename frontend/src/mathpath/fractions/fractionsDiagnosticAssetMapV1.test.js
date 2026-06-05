import { describe, expect, it } from 'vitest';
import { flattenMicroSkills } from '../knowledge/knowledgeMapModel.js';
import {
  DIAGNOSTIC_OUTCOMES,
  DIAGNOSTIC_QUESTION_TYPES,
  buildDiagnosticCoverageAudit,
  getDiagnosticEntryByMicroSkillId,
  validateDiagnosticAssetMap,
} from '../knowledge/diagnosticAssetModel.js';
import { fractionsKnowledgeMapV1 } from './fractionsKnowledgeMapV1.js';
import { fractionsRemediationMapV1 } from './fractionsRemediationMapV1.js';
import { fractionsDiagnosticAssetMapV1 } from './fractionsDiagnosticAssetMapV1.js';

describe('fractionsDiagnosticAssetMapV1', () => {
  it('covers every P4 fractions micro-skill with diagnostic-ready assets', () => {
    const microSkillCount = flattenMicroSkills(fractionsKnowledgeMapV1).length;
    const result = validateDiagnosticAssetMap(
      fractionsDiagnosticAssetMapV1,
      fractionsKnowledgeMapV1,
      fractionsRemediationMapV1
    );

    expect(result.ok).toBe(true);
    expect(result.summary).toMatchObject({
      domain: 'fractions',
      stage: 'P4',
      entryCount: microSkillCount,
      diagnosticQuestionCount: microSkillCount * 3,
      knowledgeMicroSkillCount: microSkillCount,
    });
  });

  it('marks all coverage audit rows as diagnostic ready', () => {
    const auditRows = buildDiagnosticCoverageAudit(fractionsDiagnosticAssetMapV1, fractionsKnowledgeMapV1);

    expect(auditRows).toHaveLength(flattenMicroSkills(fractionsKnowledgeMapV1).length);
    auditRows.forEach((row) => {
      expect(row).toMatchObject({
        diagnosticQuestionsCount: 3,
        coverageStatus: 'DIAGNOSTIC_READY',
        missingAssets: [],
        riskLevel: 'LOW',
      });
    });
  });

  it('supports confidence and working interpretation signals', () => {
    expect(fractionsDiagnosticAssetMapV1.diagnosticSignalRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'wrong_high_confidence_no_working',
          outcome: DIAGNOSTIC_OUTCOMES.OVERCONFIDENCE_RISK,
          remediationWeight: 1,
        }),
        expect.objectContaining({
          id: 'correct_no_working',
          outcome: DIAGNOSTIC_OUTCOMES.POSSIBLE_FLUENCY,
        }),
      ])
    );
  });

  it('detects improper-to-mixed misconceptions through diagnostic questions', () => {
    const entry = getDiagnosticEntryByMicroSkillId(
      fractionsDiagnosticAssetMapV1,
      'fractions.p4.convert_improper_to_mixed'
    );
    const misconceptionQuestion = entry.diagnosticQuestions.find((question) =>
      question.detectsMisconceptions?.length
    );

    expect(entry.diagnosticQuestions.map((question) => question.type)).toEqual([
      DIAGNOSTIC_QUESTION_TYPES.RECOGNITION,
      DIAGNOSTIC_QUESTION_TYPES.PROCEDURAL,
      DIAGNOSTIC_QUESTION_TYPES.REASONING,
    ]);
    expect(misconceptionQuestion.prompt).toContain('7/3 = 3 1/2');
    expect(misconceptionQuestion.detectsMisconceptions).toEqual(['M-MIX-006', 'M-MIX-007']);
  });
});
