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
});
