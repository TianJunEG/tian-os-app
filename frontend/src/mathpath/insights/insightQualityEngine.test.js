import { describe, expect, it } from 'vitest';
import {
  buildInsightSet,
  buildParentInsight,
  buildPositiveInsight,
  buildStudentInsight,
  buildTutorInsight,
  explainRemediation,
  explainWorkingAnalysis,
  interpretConfidence,
} from './insightQualityEngine.js';

describe('insightQualityEngine', () => {
  it('generates student what/why/fix/next guidance for high-confidence wrong answers', () => {
    const insight = buildStudentInsight({
      correct: false,
      confidence: 'i_know_this',
      skillName: 'Equivalent Fractions',
      recommendedSkillName: 'Equivalent Fractions',
    });

    expect(insight.whatHappened).toMatch(/confident/i);
    expect(insight.whyItHappened).toMatch(/method needs a reset|confident/i);
    expect(insight.howToFixIt).toMatch(/Equivalent Fractions|guided/i);
    expect(insight.nextStep).toMatch(/Equivalent Fractions|review/i);
  });

  it('generates parent-friendly explanations without diagnostic codes', () => {
    const insight = buildParentInsight({
      correct: false,
      confidence: 'high',
      skillName: 'Equivalent Fractions',
      severity: 'high',
    });

    expect(insight.whatIsTheIssue).not.toMatch(/overconfident_misconception|M\d+/i);
    expect(insight.howSerious).toBe('Needs attention soon');
    expect(insight.whatCanIDo).toMatch(/explain|review|step/i);
  });

  it('generates tutor-focused explanations with evidence and intervention', () => {
    const insight = buildTutorInsight({
      correct: false,
      confidence: 'high',
      skillName: 'Equivalent Fractions',
      frequency: 4,
      evidenceSummary: '4 high-confidence incorrect answers.',
    });

    expect(insight.observation).toMatch(/Occurrences: 4/);
    expect(insight.evidenceSummary.join(' ')).toMatch(/high-confidence incorrect/);
    expect(insight.suggestedIntervention).toMatch(/visual|guided|Equivalent Fractions/i);
  });

  it('interprets confidence patterns by audience', () => {
    const highWrong = interpretConfidence({ correct: false, confidence: 'high' });
    const lowWrong = interpretConfidence({ correct: false, confidence: "I don't know" });

    expect(highWrong.student).toMatch(/confident but answered incorrectly/i);
    expect(highWrong.parent).toMatch(/misconception/i);
    expect(highWrong.tutor).toMatch(/conceptual reteaching/i);
    expect(lowWrong.student).toMatch(/okay not to know/i);
  });

  it('translates working analysis into readable explanations', () => {
    const insight = explainWorkingAnalysis({
      methodDetected: 'DIRECT_DENOMINATOR_ADDITION',
      analysisSummary: 'Student added denominators directly.',
    });

    expect(insight.observation).toMatch(/denominator/i);
    expect(insight.interpretation).toMatch(/whole numbers|fraction/i);
    expect(insight.recommendation).toMatch(/visual model|equivalent/i);
  });

  it('explains why remediation was selected', () => {
    const insight = explainRemediation({
      skillName: 'Equivalent Fractions',
      frequency: 3,
      reason: 'Recent mistakes suggest equivalent-value confusion',
    });

    expect(insight.observation).toMatch(/3/);
    expect(insight.interpretation).toMatch(/reason this review was selected/i);
    expect(insight.recommendation).toMatch(/Equivalent Fractions/);
  });

  it('recognises positive learning signals', () => {
    const insight = buildPositiveInsight({ correct: true, workingSubmitted: true });

    expect(insight.message).toMatch(/correctly and showed clear working/i);
    expect(insight.recommendation).toMatch(/harder|next/i);
  });

  it('builds a consistent insight set', () => {
    const set = buildInsightSet({
      correct: false,
      confidence: 'high',
      skillName: 'Fractions',
      frequency: 2,
      methodDetected: 'incorrect method',
    });

    expect(set.student.observation).toBeTruthy();
    expect(set.parent.recommendation).toBeTruthy();
    expect(set.tutor.recommendation).toBeTruthy();
    expect(set.working.recommendation).toBeTruthy();
  });
});
