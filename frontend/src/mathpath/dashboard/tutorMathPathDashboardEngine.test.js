import { describe, expect, it } from 'vitest';
import {
  buildTutorIntelligenceInsight,
  buildTutorMathPathDashboard,
} from './tutorMathPathDashboardEngine.js';

describe('Tutor Intelligence Engine', () => {
  it('turns equivalent-fraction evidence into a root cause and intervention', () => {
    const insight = buildTutorIntelligenceInsight({
      rootCauseAnalysis: [
        {
          weakSkillId: 'F011',
          suspectedRootCauseSkillIds: ['F010'],
          severity: 'high',
          evidence: ['Flagged as weak in diagnostic scan.'],
        },
      ],
      mistakeClusters: [
        {
          mistakeCode: 'M004',
          mistakeName: 'Equivalent Fraction Weakness',
          frequency: 8,
          severity: 'high',
          affectedSkills: ['F010', 'F011'],
          remediationSkills: ['F010', 'F011'],
        },
      ],
      attempts: [
        { skillId: 'F010', questionFamilyId: 'QF_F010_001', correct: false, confidence: 'high' },
        { skillId: 'F010', questionFamilyId: 'QF_F010_002', correct: false, confidence: 'high' },
        { skillId: 'F011', questionFamilyId: 'QF_F011_001', correct: false, confidence: 'high' },
      ],
      workingAnalysisSummary: {
        analysisSummary: 'Student changed denominator only when making an equivalent fraction.',
      },
    });

    expect(insight.rootCause).toBe('Student does not understand Equivalent Fractions.');
    expect(insight.evidence).toContain('Wrong on 8 equivalent fraction questions.');
    expect(insight.evidence).toContain('3 high-confidence incorrect answers.');
    expect(insight.evidence).toContain('Working shows denominator misunderstanding.');
    expect(insight.qualityInsight.recommendation).toMatch(/visual models and guided examples/i);
    expect(insight.recommendedIntervention.title).toBe('20-minute remediation lesson');
    expect(insight.recommendedIntervention.durationMinutes).toBe(20);
    expect(insight.nextTutorAction).toMatch(/Run a 20-minute remediation lesson on Equivalent Fractions/);
  });

  it('includes tutor intelligence in the MathPath tutor dashboard payload', () => {
    const dashboard = buildTutorMathPathDashboard({
      studentId: 'student-1',
      studentProgressState: {
        studentId: 'student-1',
        currentDomain: 'fractions',
        weakSkills: [{ skillId: 'F011' }],
        currentSkill: { skillId: 'F011' },
        readinessLevel: { readinessBand: 'developing', readinessScore: 52 },
      },
      diagnosticResult: { weakSkillIds: ['F011'] },
      practiceState: { currentSkillId: 'F011', weakSkillIds: ['F011'] },
      mistakePlans: [
        {
          focusMistakes: [{ mistakeCode: 'M004', count: 8, highestSeverity: 'high' }],
          rootCauseSkillIds: ['F010'],
          remediationQueue: [{ skillId: 'F010' }],
        },
      ],
      attempts: [
        { skillId: 'F010', questionFamilyId: 'QF_F010_001', correct: false, confidence: 'high' },
        { skillId: 'F010', questionFamilyId: 'QF_F010_002', correct: false, confidence: 'high' },
      ],
      workingAnalysisSummary: {
        calculatorIntegrityFlags: [{ flagType: 'denominator_misunderstanding', reason: 'Denominator was changed alone.' }],
      },
    });

    expect(dashboard.tutorIntelligenceInsight.rootCause).toBe('Student does not understand Equivalent Fractions.');
    expect(dashboard.tutorIntelligenceInsight.evidence.join(' ')).toMatch(/high-confidence incorrect/);
    expect(dashboard.overallTutorSummary).toMatch(/20-minute remediation lesson/);
  });
});
