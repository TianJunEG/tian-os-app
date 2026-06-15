import { describe, it, expect } from 'vitest';
import { buildDecimalsLearningPathView } from '../shared/mathpath/decimals/decimalsLearningPathModel.js';

describe('Decimals learning-path view model', () => {
  it('starts a fresh student with everything not-started and D001 recommended', () => {
    const view = buildDecimalsLearningPathView({ masteryRecords: [] });
    expect(view.progress).toMatchObject({ total: 14, mastered: 0, inProgress: 0, notStarted: 14, percentageMastered: 0 });
    expect(view.recommendedNext.skillId).toBe('D001');
    const all = view.strands.flatMap((s) => s.skills);
    expect(all).toHaveLength(14);
    expect(all.every((s) => s.statusLabel === 'Not Started' || s.locked)).toBe(true);
  });

  it('groups skills by strand in graph order', () => {
    const view = buildDecimalsLearningPathView({ masteryRecords: [] });
    expect(view.strands.map((s) => s.label)).toEqual([
      'Foundations', 'Comparison', 'Rounding', 'Operations', 'Conversion', 'Applications',
    ]);
  });

  it('locks a skill whose prerequisite is not yet complete', () => {
    const view = buildDecimalsLearningPathView({ masteryRecords: [] });
    const all = view.strands.flatMap((s) => s.skills);
    const d001 = all.find((s) => s.id === 'D001');
    const d004 = all.find((s) => s.id === 'D004'); // needs D003
    expect(d001.locked).toBe(false); // foundation, no prereqs
    expect(d004.locked).toBe(true);
    expect(d004.missingPrerequisiteNames).toContain('Comparing Decimals');
  });

  it('unlocks the next skill once its prerequisite is mastered', () => {
    const view = buildDecimalsLearningPathView({
      masteryRecords: [
        { skillId: 'D001', status: 'retained' },
        { skillId: 'D002', status: 'accurate' },
        { skillId: 'D003', status: 'fluent' },
      ],
    });
    const all = view.strands.flatMap((s) => s.skills);
    const d004 = all.find((s) => s.id === 'D004');
    expect(d004.locked).toBe(false);
    expect(view.progress.mastered).toBe(3);
    // D004 is now the recommended next skill (earliest incomplete unlocked)
    expect(view.recommendedNext.skillId).toBe('D004');
  });

  it('marks a weak skill as needs-review and surfaces it as recommended', () => {
    const view = buildDecimalsLearningPathView({
      masteryRecords: [
        { skillId: 'D001', status: 'accurate' },
        { skillId: 'D003', status: 'weak' },
      ],
    });
    const all = view.strands.flatMap((s) => s.skills);
    const d003 = all.find((s) => s.id === 'D003');
    expect(d003.needsReview).toBe(true);
    expect(d003.statusLabel).toBe('Needs Review');
    expect(view.recommendedNext.skillId).toBe('D003');
    expect(view.progress.inProgress).toBe(1); // D003 has a record but isn't complete
  });

  it('reports accurate progress percentages', () => {
    const records = ['D001', 'D002', 'D003', 'D005', 'D006', 'D007', 'D012'].map((skillId) => ({ skillId, status: 'accurate' }));
    const view = buildDecimalsLearningPathView({ masteryRecords: records });
    expect(view.progress.mastered).toBe(7);
    expect(view.progress.percentageMastered).toBe(50); // 7/14
  });
});
