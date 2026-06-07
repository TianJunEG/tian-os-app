import { describe, expect, it } from 'vitest';
import {
  assetForMisconception,
  buildGuidedPracticeFlow,
  buildRecoveryPackAssetMatrix,
  deriveAssignmentAssetMetadata,
  validateRecheckTargets,
} from '../services/mathpath/recoveryPackAssetService.js';

describe('recoveryPackAssetService', () => {
  it('looks up complete assets for a misconception', () => {
    const asset = assetForMisconception('uses_original_instead_of_remainder');

    expect(asset.visualModelType).toBe('bar_model');
    expect(asset.workedExample.whyIncorrect).toMatch(/remaining/i);
    expect(asset.guidedPracticeIds.length).toBeGreaterThan(0);
    expect(asset.independentPracticeIds.length).toBe(1);
    expect(asset.recheckQuestionIds.length).toBe(1);
  });

  it('builds a full asset matrix with worked examples, visuals, guided practice and rechecks', () => {
    const matrix = buildRecoveryPackAssetMatrix();

    expect(matrix.misconceptionCount).toBeGreaterThan(0);
    expect(matrix.assetCoveragePercent).toBe(100);
    expect(matrix.missingWorkedExamples).toHaveLength(0);
    expect(matrix.missingVisualExplanations).toHaveLength(0);
    expect(matrix.missingRechecks).toHaveLength(0);
  });

  it('builds the guided practice sequence for Recovery Packs', () => {
    const flow = buildGuidedPracticeFlow({ misconceptionIds: ['adds_denominators_directly'] });

    expect(flow.status).toBe('ready');
    expect(flow.steps.map((step) => step.type)).toEqual([
      'worked_example',
      'visual_explanation',
      'guided_question',
      'guided_question',
      'independent_practice',
      'mastery_check',
    ]);
  });

  it('derives assignment misconception and intervention metadata from skills', () => {
    const metadata = deriveAssignmentAssetMetadata({
      skillIds: ['F018'],
      evidenceSource: { sourceType: 'diagnostic', sourceId: 'diag_1' },
    });

    expect(metadata.misconceptionIds).toContain('adds_denominators_directly');
    expect(metadata.interventionIds).toContain('adds_denominators_directly');
    expect(metadata.evidenceSource.studentExplanation).toMatch(/helps you understand the method/i);
    expect(metadata.guidedPracticeFlow.status).toBe('ready');
  });

  it('validates whether a recheck targets assignment skills and misconceptions', () => {
    const result = validateRecheckTargets({
      assignment: {
        _id: 'assignment_1',
        skillIds: ['F018', 'F019'],
        misconceptionIds: ['adds_denominators_directly'],
      },
      diagnostic: {
        diagnosticSessionId: 'diag_recheck_1',
        targetSkillIds: ['F018'],
        perSkillSnapshot: [
          { skillId: 'F018', misconceptionTags: ['adds_denominators_directly'] },
        ],
      },
    });

    expect(result.status).toBe('partial');
    expect(result.missingSkillIds).toEqual(['F019']);
  });
});
