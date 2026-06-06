import { describe, expect, it } from 'vitest';
import {
  auditQuestionBank,
  buildMisconceptionCoverage,
  scoreQuestionQuality,
} from '../services/mathpath/questionQualityAuditService.js';

describe('questionQualityAuditService', () => {
  it('flags missing diagrams for visual fraction questions', () => {
    const scored = scoreQuestionQuality({
      id: 'q1',
      skillId: 'F003',
      questionText: 'What fraction of the shape is shaded?',
      answerType: 'fraction',
    });

    expect(scored.componentScores.diagramQuality).toBeLessThan(70);
    expect(scored.flags).toContain('missing_required_visual_model');
  });

  it('flags out-of-level difficulty and plain text fraction answer inputs', () => {
    const scored = scoreQuestionQuality({
      id: 'q2',
      skillId: 'F010',
      questionText: 'Use the reciprocal to divide fractions: 1/2 ÷ 3/4.',
      answerType: 'text',
      difficultyLevel: 5,
    });

    expect(scored.flags).toEqual(expect.arrayContaining([
      'possible_out_of_level_fraction_division',
      'fraction_answer_should_not_be_plain_text_only',
      'difficulty_high_for_foundation_skill',
    ]));
    expect(scored.qualityScore).toBeLessThan(75);
  });

  it('flags invalid countable fraction contexts', () => {
    const scored = scoreQuestionQuality({
      id: 'q3',
      skillId: 'F020',
      questionText: 'What is 1/2 of 41 cards?',
      answerType: 'numeric',
    });

    expect(scored.flags).toContain('countable_fraction_has_non_integer_intermediate');
  });

  it('reports misconception coverage gaps by skill', () => {
    const coverage = buildMisconceptionCoverage([
      { skillId: 'F018', misconceptionTags: ['missing_common_denominator'] },
    ]);
    const unlikeAddition = coverage.find((row) => row.skillId === 'F018');

    expect(unlikeAddition.status).toBe('gap');
    expect(unlikeAddition.missing).toContain('fraction_add_denominators_directly');
  });

  it('builds aggregate audit sections', () => {
    const audit = auditQuestionBank([
      { id: 'q1', skillId: 'F005', questionText: 'Place 3/4 on the number line.', answerType: 'fraction' },
      { id: 'q2', skillId: 'F005', questionText: 'Place 2/4 on the number line.', answerType: 'fraction' },
      { id: 'q3', skillId: 'F005', questionText: 'Place 1/4 on the number line.', answerType: 'fraction' },
    ]);

    expect(audit.totalQuestions).toBe(3);
    expect(audit.missingDiagrams.length).toBe(3);
    expect(audit.repeatedTemplates.length).toBeGreaterThan(0);
    expect(audit.misconceptionGaps.length).toBeGreaterThan(0);
  });
});
