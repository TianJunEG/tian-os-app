import { describe, expect, it } from 'vitest';
import {
  DIAGNOSTIC_QUESTION_TYPES,
  buildDiagnosticCoverageAudit,
  diagnosticSignalRules,
  getDiagnosticEntryByMicroSkillId,
  validateDiagnosticAssetMap,
} from './diagnosticAssetModel.js';

describe('diagnosticAssetModel', () => {
  const knowledgeMap = {
    domain: 'sample',
    stage: 'P4',
    topics: [
      {
        id: 'sample.topic',
        title: 'Sample Topic',
        microSkills: [
          {
            id: 'sample.micro',
            title: 'Sample micro skill',
            learningObjectives: ['Understand the idea.'],
            misconceptions: [{ id: 'M-SAMPLE-001', title: 'Sample misconception' }],
          },
        ],
      },
    ],
  };

  const remediationMap = {
    domain: 'sample',
    stage: 'P4',
    entries: [
      {
        topic: 'sample.topic',
        microSkill: 'sample.micro',
        misconceptions: [{ id: 'M-SAMPLE-001', title: 'Sample misconception' }],
      },
    ],
  };

  const diagnosticMap = {
    domain: 'sample',
    stage: 'P4',
    diagnosticSignalRules,
    entries: [
      {
        topic: 'sample.topic',
        microSkill: 'sample.micro',
        diagnosticQuestions: [
          { id: 'q1', type: DIAGNOSTIC_QUESTION_TYPES.RECOGNITION, prompt: 'Recognise?', expectedAnswer: 'Yes' },
          { id: 'q2', type: DIAGNOSTIC_QUESTION_TYPES.PROCEDURAL, prompt: 'Do it.', expectedAnswer: '4' },
          { id: 'q3', type: DIAGNOSTIC_QUESTION_TYPES.REASONING, prompt: 'Explain error.', expectedAnswer: 'Reason', detectsMisconceptions: ['M-SAMPLE-001'] },
        ],
        confidenceIndicators: [{ signal: 'Wrong + high confidence' }],
        workingIndicators: [{ signal: 'Wrong without working' }],
        misconceptionIndicators: [{ misconceptionId: 'M-SAMPLE-001', observableBehaviours: ['Wrong pattern'] }],
        remediationTriggers: [{ signalRuleId: 'wrong_high_confidence', triggerStrength: 'STRONG' }],
        practiceAssets: [],
        fluencyAssets: [],
        checkpointAssets: [],
        wordPathAssets: [],
        paperReviewMapping: [],
      },
    ],
  };

  it('validates diagnostic asset coverage against knowledge and remediation maps', () => {
    const result = validateDiagnosticAssetMap(diagnosticMap, knowledgeMap, remediationMap);

    expect(result.ok).toBe(true);
    expect(result.summary).toMatchObject({
      domain: 'sample',
      stage: 'P4',
      entryCount: 1,
      diagnosticQuestionCount: 3,
      knowledgeMicroSkillCount: 1,
    });
  });

  it('builds coverage audit rows', () => {
    expect(buildDiagnosticCoverageAudit(diagnosticMap, knowledgeMap)).toEqual([
      expect.objectContaining({
        microSkill: 'sample.micro',
        diagnosticQuestionsCount: 3,
        coverageStatus: 'DIAGNOSTIC_READY',
        riskLevel: 'LOW',
      }),
    ]);
  });

  it('resolves diagnostic entries by micro-skill', () => {
    expect(getDiagnosticEntryByMicroSkillId(diagnosticMap, 'sample.micro')).toMatchObject({
      topic: 'sample.topic',
      diagnosticQuestions: expect.arrayContaining([
        expect.objectContaining({ type: DIAGNOSTIC_QUESTION_TYPES.PROCEDURAL }),
      ]),
    });
  });

  it('rejects entries without misconception detection questions', () => {
    const result = validateDiagnosticAssetMap({
      ...diagnosticMap,
      entries: [{
        ...diagnosticMap.entries[0],
        diagnosticQuestions: diagnosticMap.entries[0].diagnosticQuestions.slice(0, 2),
      }],
    }, knowledgeMap, remediationMap);

    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('misconception detection question');
  });
});
