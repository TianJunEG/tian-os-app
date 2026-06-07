import { describe, expect, it } from 'vitest';
import {
  auditAndRepairFractionSkillMappings,
  normaliseFractionSkillRef,
} from '../scripts/auditAndRepairFractionSkillMappings.js';

function makeModel(records = []) {
  return {
    updates: [],
    find() {
      return {
        limit() { return this; },
        lean() { return this; },
        async exec() { return records; },
      };
    },
    async updateOne(filter, patch) {
      this.updates.push({ filter, patch });
    },
  };
}

describe('auditAndRepairFractionSkillMappings', () => {
  it('normalises valid F-code and slug aliases without renaming persisted IDs casually', () => {
    expect(normaliseFractionSkillRef('f018')).toMatchObject({ canonical: 'F018', valid: true, changed: true });
    expect(normaliseFractionSkillRef('fractions.add_different_denominators')).toMatchObject({ canonical: 'F018', valid: true, changed: true });
    expect(normaliseFractionSkillRef('F099')).toMatchObject({ canonical: 'F099', valid: false, reason: 'unknown_skill' });
  });

  it('dry-runs persisted mapping repair proposals without updating records', async () => {
    const GeneratedQuestion = makeModel([{ _id: 'q1', skillId: 'fractions.add_different_denominators' }]);
    const MathPathAssignment = makeModel([{ _id: 'a1', skillIds: ['F018', 'F099'], domainId: 'fractions' }]);
    const MathPathDiagnosticSession = makeModel([{ _id: 'd1', targetSkillIds: ['F018'], perSkillSnapshot: [{ skillId: 'f019' }] }]);
    const Worksheet = makeModel([{ _id: 'w1', skillIds: ['F020'] }]);

    const report = await auditAndRepairFractionSkillMappings({
      models: { GeneratedQuestion, MathPathAssignment, MathPathDiagnosticSession, Worksheet },
      apply: false,
    });

    expect(report.mode).toBe('dry-run');
    expect(report.scanned).toMatchObject({ generatedQuestions: 1, assignments: 1, diagnostics: 1, worksheets: 1 });
    expect(report.invalidRecords).toBe(1);
    expect(report.repairableRecords).toBe(2);
    expect(GeneratedQuestion.updates).toHaveLength(0);
  });

  it('applies only repairable alias/case changes and leaves invalid refs for manual review', async () => {
    const GeneratedQuestion = makeModel([{ _id: 'q1', skillId: 'fractions.add_different_denominators' }]);
    const MathPathAssignment = makeModel([{ _id: 'a1', skillIds: ['f018', 'F019'], domainId: 'fractions' }]);
    const MathPathDiagnosticSession = makeModel([]);
    const Worksheet = makeModel([]);

    const report = await auditAndRepairFractionSkillMappings({
      models: { GeneratedQuestion, MathPathAssignment, MathPathDiagnosticSession, Worksheet },
      apply: true,
    });

    expect(report.mode).toBe('apply');
    expect(report.updatedRecords).toBe(2);
    expect(GeneratedQuestion.updates[0].patch).toEqual({ $set: { skillId: 'F018' } });
    expect(MathPathAssignment.updates[0].patch).toEqual({ $set: { skillIds: ['F018', 'F019'] } });
  });
});
