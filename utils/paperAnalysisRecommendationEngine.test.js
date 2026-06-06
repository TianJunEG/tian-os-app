import { describe, expect, it } from 'vitest';
import {
  buildPaperAnalysisRecommendations,
  buildPaperAnalysisReport,
} from '../services/mathpath/paperAnalysisRecommendationEngine.js';

describe('paperAnalysisRecommendationEngine', () => {
  it('builds report and pending adult-confirmed actions only', () => {
    const analysis = {
      detectedQuestions: [
        { detectedSkillIds: ['F015'], adultConfirmedWrong: true, misconceptionTags: ['fraction_add_denominators_directly'], confidence: 0.8 },
        { detectedSkillIds: ['F007'], adultConfirmedCorrect: true, confidence: 0.9 },
      ],
    };

    const report = buildPaperAnalysisReport(analysis);
    const recommendations = buildPaperAnalysisRecommendations(analysis);

    expect(report).toMatchObject({
      totalQuestions: 2,
      correct: 1,
      incorrect: 1,
      weakSkills: ['F015'],
    });
    expect(recommendations.recommendedActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'assign_practice', skillId: 'F015', status: 'pending_review' }),
      expect.objectContaining({ type: 'run_mini_diagnostic', status: 'pending_review' }),
    ]));
  });

  it('does not recommend interventions from detected teacher marks without adult confirmation', () => {
    const recommendations = buildPaperAnalysisRecommendations({
      detectedQuestions: [
        { detectedSkillIds: ['F019'], teacherMarkedCorrect: false, confidence: 0.8 },
      ],
    });

    expect(recommendations.report.weakSkills).toEqual([]);
    expect(recommendations.recommendedActions).toEqual([]);
  });
});
