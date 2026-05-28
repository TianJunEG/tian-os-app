import { describe, it, expect } from 'vitest';
import { buildRecommendations } from './parentRecommendations.js';

describe('buildRecommendations — rule-based parent actions', () => {
  it('flags a low-mastery skill as assign-practice (high)', () => {
    const recs = buildRecommendations({ records: [{ skillId: 's1', skillName: 'Equivalent fractions', score: 25, attempts: 4, status: 'needs_review' }] });
    const r = recs.find((x) => x.actionType === 'assign_practice');
    expect(r).toBeTruthy();
    expect(r.priority).toBe('high');
    expect(r.relatedSkillId).toBe('s1');
  });

  it('flags 3+ recent mistakes as review (high)', () => {
    const recs = buildRecommendations({ mistakesBySkill: [{ skillId: 's2', skillName: 'Decimals', count: 3 }] });
    expect(recs.some((r) => r.actionType === 'review_mistakes' && r.priority === 'high')).toBe(true);
  });

  it('flags inactivity (7+ days) as restart (medium)', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 86400000);
    const recs = buildRecommendations({ records: [{ skillId: 's', score: 60, attempts: 2, status: 'learning' }], lastPracticedAt: eightDaysAgo });
    expect(recs.some((r) => r.actionType === 'restart_practice')).toBe(true);
  });

  it('flags an overdue assignment as follow-up (high) and sorts it first', () => {
    const recs = buildRecommendations({
      records: [{ skillId: 'm', score: 90, attempts: 6, status: 'mastered' }],
      assignments: [{ status: 'overdue', dueDate: new Date(Date.now() - 86400000) }],
    });
    expect(recs[0].actionType).toBe('follow_up_assignment');
  });

  it('celebrates mastered skills (low priority, last)', () => {
    const recs = buildRecommendations({ records: [{ skillId: 'm', score: 95, attempts: 6, status: 'mastered' }] });
    const celebrate = recs.find((r) => r.actionType === 'celebrate');
    expect(celebrate.priority).toBe('low');
  });

  // A non-MathPath record (e.g. Spelling) whose skillId ref doesn't resolve
  // against Skill arrives with a blank skillName — it must not produce a
  // blank-text, mis-routed action.
  it('skips a nameless weak skill (no assign-practice with empty name)', () => {
    const recs = buildRecommendations({ records: [{ skillId: 'list1', skillName: '', score: 10, attempts: 3, status: 'needs_review' }] });
    expect(recs.some((r) => r.actionType === 'assign_practice')).toBe(false);
  });

  it('skips nameless skills with 3+ mistakes (no review action with empty name)', () => {
    const recs = buildRecommendations({ mistakesBySkill: [{ skillId: 'list1', skillName: '', count: 5 }] });
    expect(recs.some((r) => r.actionType === 'review_mistakes')).toBe(false);
  });

  // Multi-module: each skill-specific action carries its module so the UI can
  // label and route it (e.g. a Spelling weak list → the Spelling assign flow).
  it('carries the module through to assign-practice and review actions', () => {
    const recs = buildRecommendations({
      records: [{ skillId: 'l1', skillName: 'Primary 4 common words', module: 'Spelling Practice', score: 20, attempts: 5, status: 'needs_review' }],
      mistakesBySkill: [{ skillId: 'l1', skillName: 'Primary 4 common words', module: 'Spelling Practice', count: 4 }],
    });
    expect(recs.find((r) => r.actionType === 'assign_practice')?.module).toBe('Spelling Practice');
    expect(recs.find((r) => r.actionType === 'review_mistakes')?.module).toBe('Spelling Practice');
  });

  it('surfaces weak skills across modules, worst-first', () => {
    const recs = buildRecommendations({
      records: [
        { skillId: 'm1', skillName: 'Long division', module: 'MathPath', score: 35, attempts: 4, status: 'needs_review' },
        { skillId: 'l1', skillName: 'Science vocab', module: 'Spelling Practice', score: 15, attempts: 3, status: 'needs_review' },
      ],
    });
    const assigns = recs.filter((r) => r.actionType === 'assign_practice');
    expect(assigns.map((r) => r.module)).toEqual(['Spelling Practice', 'MathPath']); // 15% before 35%
  });
});
