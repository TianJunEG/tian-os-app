import { describe, it, expect } from 'vitest';
import { buildSkillGraphView } from './skillGraphView.js';

// A tiny two-topic graph: a → b → c (chain) and a standalone d.
//   a mastered, b in-progress, c not-started (locked by b), d not-started (ready).
const topics = [
  {
    topicId: 't1', name: 'Number Sense', moeLevel: 'Primary 1',
    skills: [
      { _id: 'a', name: 'Counting to 20', moeLevel: 'Primary 1', prerequisiteSkillIds: [] },
      { _id: 'b', name: 'Counting to 100', moeLevel: 'Primary 1', prerequisiteSkillIds: ['a'] },
      { _id: 'c', name: 'Counting to 1000', moeLevel: 'Primary 2', prerequisiteSkillIds: ['b'] },
    ],
  },
  {
    topicId: 't2', name: 'Geometry', moeLevel: 'Primary 1',
    skills: [
      { _id: 'd', name: 'Identifying 2D shapes', moeLevel: 'Primary 1', prerequisiteSkillIds: [] },
    ],
  },
];

const recordsBySkill = new Map([
  ['a', { status: 'mastered', score: 95, attempts: 8 }],
  ['b', { status: 'learning', score: 55, attempts: 4 }],
]);
const masteredIds = new Set(['a']);

describe('buildSkillGraphView — prerequisite-aware mastery map', () => {
  const view = buildSkillGraphView({ topics, recordsBySkill, masteredIds });
  const skill = (id) => view.topics.flatMap((t) => t.skills).find((s) => String(s.skillId) === id);

  it('marks a skill ready when all prerequisites are mastered', () => {
    expect(skill('b').ready).toBe(true);   // a (its prereq) is mastered
    expect(skill('b').locked).toBe(false);
    expect(skill('d').ready).toBe(true);    // no prerequisites
  });

  it('locks a not-started skill whose prerequisite is unmet, and names the gap', () => {
    const c = skill('c');
    expect(c.ready).toBe(false);            // b is not mastered
    expect(c.locked).toBe(true);
    expect(c.missingPrereqs).toEqual(['Counting to 100']);
  });

  it('does not lock an in-progress skill even if a prerequisite is unmet', () => {
    // (none in this fixture has that shape, but the rule: locked requires not_started)
    expect(skill('b').status).toBe('learning');
    expect(skill('b').locked).toBe(false);
  });

  it('summarises counts correctly', () => {
    expect(view.summary).toMatchObject({
      total: 4, mastered: 1, inProgress: 1, notStarted: 2, locked: 1, ready: 1,
    });
  });

  it('recommends in-progress first, then freshly-unlocked not-started skills', () => {
    const names = view.readyNext.map((s) => s.name);
    expect(names[0]).toBe('Counting to 100');          // in-progress, surfaced first
    expect(names).toContain('Identifying 2D shapes');  // ready, not started
    expect(names).not.toContain('Counting to 1000');   // locked — excluded
    expect(names).not.toContain('Counting to 20');     // mastered — excluded
  });
});
