import { describe, expect, it } from 'vitest';
import {
  buildPaperAnalysisRecommendations,
  mapPaperQuestionToSkills,
} from '../services/mathpath/paperAnalysisSkillMapper.js';

describe('paper analysis skill mapper', () => {
  it('maps adult manual overrides with high confidence', () => {
    expect(mapPaperQuestionToSkills({
      questionText: 'Unclear scan',
      manualSkillIds: ['f015', 'F019'],
    })).toMatchObject({
      detectedSkillIds: ['F015', 'F019'],
      confidence: 1,
      source: 'adult_manual_override',
      needsAdultReview: false,
    });
  });

  it('treats reviewed detected skill ids as adult overrides', () => {
    expect(mapPaperQuestionToSkills({
      questionText: 'Simplify 4/8',
      detectedSkillIds: ['f007'],
    })).toMatchObject({
      detectedSkillIds: ['F007'],
      confidence: 1,
      source: 'adult_manual_override',
      needsAdultReview: false,
    });
  });

  it('maps detected fraction keywords but keeps low-confidence analysis review-gated', () => {
    const result = mapPaperQuestionToSkills({
      questionText: 'After Ali spent some money, 2/3 of the remainder was left.',
    });

    expect(result.detectedSkillIds).toEqual(expect.arrayContaining(['F025', 'F026']));
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.suggestedMisconceptions).toEqual(expect.arrayContaining(['uses_original_instead_of_remainder']));
    expect(result.source).toBe('keyword_mapping');
    expect(result.needsAdultReview).toBe(true);
  });

  it('recommends targeted practice only from confirmed wrong questions', () => {
    const recommendations = buildPaperAnalysisRecommendations([
      { detectedSkillIds: ['F015'], adultConfirmedWrong: true },
      { detectedSkillIds: ['F019'], teacherMarkedCorrect: false },
      { detectedSkillIds: ['F011'], adultConfirmedCorrect: true },
    ]);

    expect(recommendations.weakSkillIds).toEqual(['F015', 'F019']);
    expect(recommendations.recommendedActions).toEqual([
      expect.objectContaining({ type: 'assign_practice', skillId: 'F015', status: 'pending_review' }),
      expect.objectContaining({ type: 'assign_practice', skillId: 'F019', status: 'pending_review' }),
    ]);
  });
});
