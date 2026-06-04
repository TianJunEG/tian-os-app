import { describe, expect, it } from 'vitest';
import { buildRemediationPlan } from './remediationEngine.js';

describe('remediationEngine working evidence integration', () => {
  it('uses working analysis to adapt remediation', () => {
    const skill = {
      slug: 'adding-fractions',
      name: 'Adding Fractions',
      metadata: {
        remediation: { onRepeatedFail: 'guided-replication', strategy: 'Find a common denominator first.' },
        misconceptions: [{ tag: 'frac/add-denominators', label: 'Added denominators directly' }],
      },
      prerequisiteSkillIds: [],
    };

    const plan = buildRemediationPlan({
      skill,
      recentAttempts: [{
        correct: false,
        misconceptionTag: 'frac/add-denominators',
        workingAnalysisResult: {
          detectedMethod: 'Step-by-step working',
          detectedIssue: 'A key step appears to be missing.',
          studentExplanation: 'A step seems to be missing. Write the intermediate step before the final answer.',
          qualityBand: 'PARTIAL',
          workingQualityScore: 45,
        },
      }],
      prereqSkills: [],
    });

    expect(plan.workingEvidenceUsed).toBe(true);
    expect(plan.workingInsight).toMatchObject({
      detectedMethod: 'Step-by-step working',
      qualityBand: 'PARTIAL',
    });
    expect(plan.steps.some((step) => /missing step/i.test(step.text || ''))).toBe(true);
  });
});
