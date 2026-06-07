import { describe, expect, it } from 'vitest';
import { buildStudentRecheckSummary } from '../services/mathpath/studentRecheckSummaryService.js';

describe('studentRecheckSummaryService', () => {
  it('generates a coaching-oriented recheck summary with improved and still-practising skills', () => {
    const summary = buildStudentRecheckSummary({
      baseline: {
        readinessScore: 42,
        perSkillSnapshot: [
          { skillId: 'F018', score: 30, misconceptionTags: ['adds_denominators_directly'] },
          { skillId: 'F024', score: 45, misconceptionTags: ['skipped_step'] },
        ],
      },
      previous: {
        readinessScore: 52,
        perSkillSnapshot: [
          { skillId: 'F018', score: 45, misconceptionTags: ['adds_denominators_directly'] },
          { skillId: 'F024', score: 50, misconceptionTags: ['skipped_step'] },
        ],
      },
      recheck: {
        diagnosticPurpose: 'recheck',
        readinessScore: 76,
        perSkillSnapshot: [
          { skillId: 'F018', score: 82, misconceptionTags: [] },
          { skillId: 'F024', score: 62, misconceptionTags: ['skipped_step'] },
        ],
      },
      assignment: {
        title: 'Fractions Recovery Pack',
        status: 'completed',
        skillIds: ['F018', 'F024'],
      },
    });

    expect(summary.title).toBe('Recovery Pack Recheck');
    expect(summary.overallImprovement).toBe(34);
    expect(summary.improvedSkills.map((skill) => skill.displayName)).toContain('Adding fractions with different denominators');
    expect(summary.stillNeedsWork.map((skill) => skill.displayName)).toContain('Solving multi-step fraction problems');
    expect(summary.resolvedMisconceptions[0].explanation).toMatch(/bottom numbers/i);
    expect(summary.nextRecommendedAction.reason).toMatch(/guided questions/i);
    expect(JSON.stringify(summary)).not.toMatch(/\bF\d{3}\b/);
    expect(JSON.stringify(summary)).not.toMatch(/failed|intervention/i);
  });

  it('recommends moving on when all targeted skills are secure', () => {
    const summary = buildStudentRecheckSummary({
      baseline: { readinessScore: 50, perSkillSnapshot: [{ skillId: 'F011', score: 45 }] },
      recheck: { readinessScore: 82, perSkillSnapshot: [{ skillId: 'F011', score: 88 }] },
      assignment: { status: 'completed', skillIds: ['F011'] },
    });

    expect(summary.stillNeedsWork).toHaveLength(0);
    expect(summary.nextRecommendedAction.label).toBe('Start Next Learning Path');
  });
});
