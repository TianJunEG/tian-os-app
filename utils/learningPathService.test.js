import { describe, expect, it } from 'vitest';
import {
  advanceLearningPathStage,
  attachLearningPathToAssignmentPayload,
  buildDefaultLearningPath,
  buildRecoveryPathReadinessMatrix,
} from '../services/mathpath/learningPathService.js';

describe('learningPathService', () => {
  it('builds a seven-stage path for a skill misconception', () => {
    const path = buildDefaultLearningPath({
      skillId: 'F018',
      misconceptionId: 'common_denominator_missing',
    });

    expect(path.learningPathId).toBe('lp_fractions_f018_common_denominator_missing');
    expect(path.stages).toHaveLength(7);
    expect(path.stages.map((stage) => stage.stageId)).toEqual([
      'concept_introduction',
      'visual_understanding',
      'worked_example',
      'guided_practice',
      'independent_practice',
      'mastery_check',
      'recheck_ready',
    ]);
  });

  it('adds learning path fields to Recovery Pack assignment payloads', () => {
    const payload = attachLearningPathToAssignmentPayload({
      subjectId: 'math',
      domainId: 'fractions',
      skillIds: ['F018'],
      title: 'Recovery Pack',
    }, { misconceptionId: 'common_denominator_missing' });

    expect(payload.learningPathId).toBe('lp_fractions_f018_common_denominator_missing');
    expect(payload.currentStage).toBe('concept_introduction');
    expect(payload.completedStages).toEqual([]);
  });

  it('advances the learning path stage for a student assignment', () => {
    const updated = advanceLearningPathStage({
      assignment: {
        currentStage: 'worked_example',
        completedStages: ['concept_introduction', 'visual_understanding'],
      },
      completedStageId: 'worked_example',
    });

    expect(updated.completedStages).toContain('worked_example');
    expect(updated.currentStage).toBe('guided_practice');
    expect(updated.stageHistory[0].stageId).toBe('worked_example');
  });

  it('creates a readiness matrix across all active Fractions skills', () => {
    const matrix = buildRecoveryPathReadinessMatrix();

    expect(matrix.skillCount).toBe(26);
    expect(matrix.readyCount).toBe(26);
    expect(matrix.rows.find((row) => row.skillId === 'F018').readinessStatus).toBe('ready');
  });
});
