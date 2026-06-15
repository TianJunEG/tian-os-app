import { describe, expect, it } from 'vitest';
import {
  buildPaperAnalysisRecommendations,
  mapPaperQuestionToSkills,
} from '../services/mathpath/decimalsPaperAnalysisMapper.js';

describe('decimals paper analysis skill mapper', () => {
  it('maps adult manual overrides with high confidence', () => {
    expect(mapPaperQuestionToSkills({
      questionText: 'Unclear scan',
      manualSkillIds: ['d006', 'D010'],
    })).toMatchObject({
      detectedSkillIds: ['D006', 'D010'],
      confidence: 1,
      source: 'adult_manual_override',
      needsAdultReview: false,
    });
  });

  it('treats reviewed detected skill ids as adult overrides', () => {
    expect(mapPaperQuestionToSkills({
      questionText: 'Round 3.456 to the nearest tenth',
      detectedSkillIds: ['d005'],
    })).toMatchObject({
      detectedSkillIds: ['D005'],
      confidence: 1,
      source: 'adult_manual_override',
      needsAdultReview: false,
    });
  });

  it('maps decimals keywords to skills', () => {
    const result = mapPaperQuestionToSkills({
      questionText: 'Add 3.45 and 2.7. Align the decimal point before adding.',
    });
    expect(result.detectedSkillIds).toEqual(expect.arrayContaining(['D006']));
    expect(result.source).toBe('keyword_mapping');
    expect(result.needsAdultReview).toBe(true);
  });

  it('maps place value keywords', () => {
    const result = mapPaperQuestionToSkills({
      questionText: 'What is the value of the digit 5 in 3.057? Give your answer in tenths and hundredths.',
    });
    expect(result.detectedSkillIds).toEqual(expect.arrayContaining(['D001']));
  });

  it('maps fraction-decimal conversion keywords', () => {
    const result = mapPaperQuestionToSkills({
      questionText: 'Express 3/8 as a decimal.',
    });
    expect(result.detectedSkillIds).toEqual(expect.arrayContaining(['D012']));
  });

  it('returns unmapped for unrecognisable questions', () => {
    const result = mapPaperQuestionToSkills({
      questionText: 'Draw a triangle.',
    });
    expect(result.detectedSkillIds).toEqual([]);
    expect(result.source).toBe('unmapped');
  });

  it('recommends targeted practice only from confirmed wrong questions', () => {
    const recommendations = buildPaperAnalysisRecommendations([
      { detectedSkillIds: ['D006'], adultConfirmedWrong: true },
      { detectedSkillIds: ['D010'], teacherMarkedCorrect: false },
      { detectedSkillIds: ['D001'], adultConfirmedCorrect: true },
    ]);
    expect(recommendations.weakSkillIds).toEqual(['D006']);
    expect(recommendations.recommendedActions).toEqual([
      expect.objectContaining({ type: 'assign_practice', skillId: 'D006', status: 'pending_review' }),
    ]);
  });
});
