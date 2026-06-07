import { describe, expect, it } from 'vitest';
import { buildMisconceptionCoverageMatrix } from '../services/mathpath/misconceptionCoverageService.js';
import { getMisconception, matchMisconceptionsFromText } from '../services/mathpath/misconceptionRegistry.js';
import { getMisconceptionsForSkill, listSkillMisconceptionEntries } from '../services/mathpath/skillMisconceptionMap.js';
import { detectMisconceptions } from '../services/mathpath/misconceptionDetectionService.js';
import { mapPaperQuestionToSkills } from '../services/mathpath/paperAnalysisSkillMapper.js';
import { runWorkingInsightPipeline } from '../services/mathpath/workingInsightPipeline.js';

describe('MathPath misconception registry and coverage', () => {
  it('loads registry entries', () => {
    expect(getMisconception('adds_denominators_directly')).toMatchObject({
      misconceptionName: 'Adds denominators directly',
    });
  });

  it('maps every active F-code to misconception coverage', () => {
    const entries = listSkillMisconceptionEntries();
    expect(entries).toHaveLength(26);
    expect(getMisconceptionsForSkill('F018')).toEqual(expect.arrayContaining([
      'common_denominator_missing',
      'adds_denominators_directly',
    ]));
  });

  it('scores coverage for all active skills', () => {
    const matrix = buildMisconceptionCoverageMatrix();
    expect(matrix.skillCount).toBe(26);
    expect(matrix.coveragePercent).toBeGreaterThanOrEqual(80);
    expect(matrix.rows.find((row) => row.skillId === 'F025')).toMatchObject({
      remediationCoverage: expect.arrayContaining(['story_mode']),
      diagnosticCoverage: expect.arrayContaining(['exam_application']),
    });
  });

  it('detects diagnostic misconception evidence', () => {
    const result = detectMisconceptions({
      questionText: 'Add 1/2 and 1/3',
      studentAnswer: '1/2 + 1/3 = 2/5',
      teacherMarkedCorrect: false,
    });
    expect(result.misconceptionTags).toEqual(expect.arrayContaining([
      'adds_denominators_directly',
      'fraction_add_denominators_directly',
    ]));
  });

  it('tags paper analysis misconceptions with confidence', () => {
    const result = mapPaperQuestionToSkills({
      questionText: 'Add 1/2 and 1/3',
      studentAnswer: '1/2 + 1/3 = 2/5',
      teacherMarkedCorrect: false,
    }, { treatDetectedSkillIdsAsManual: false });
    expect(result.suggestedMisconceptions).toContain('adds_denominators_directly');
    expect(result.misconceptionConfidence).toBeGreaterThan(0.5);
  });

  it('tags working evidence misconceptions', () => {
    const pipeline = runWorkingInsightPipeline({
      workingId: 'w1',
      questionId: 'q1',
      skillCode: 'F018',
      answerGiven: '2/5',
      answerCorrect: false,
      ocrOutput: { rawText: '1/2 + 1/3 = 2/5', confidence: { score: 0.8 } },
      detectedSteps: [{ text: '1/2 + 1/3 = 2/5' }],
    }, {
      studentAnswer: '2/5',
      correctAnswer: '5/6',
      answerCorrect: false,
    });
    expect(pipeline.insight.misconceptionTags).toContain('adds_denominators_directly');
    expect(pipeline.insight.misconceptionConfidence).toBeGreaterThan(0.5);
  });

  it('matches registry text directly', () => {
    const result = matchMisconceptionsFromText('The student chose the bigger denominator as bigger.', { answerCorrect: false });
    expect(result.misconceptionTags).toContain('compares_denominators_only');
  });
});
