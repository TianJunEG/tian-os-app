// Skill-graph integrity guard over the 10 domain definitions in scripts/domains.
// The recommendation engine (recommendNextSkill) descends the prerequisite chain
// to the deepest un-mastered skill a student is ready for, so a single dangling
// slug, a cycle, or a prerequisite that lives at a HIGHER curriculum level than
// the skill it gates would silently misroute a learner. These are hard
// invariants the seeder cannot catch (it wires by slug at seed time).
//
// Known cross-level edges (a lower-level skill depending on a higher-level one)
// are listed in EXPECTED_CROSS_LEVEL below. They are flagged for curriculum
// review — the test forbids NEW inversions but documents the current three so a
// regression is caught without silently re-levelling the curriculum here.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const domainsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../scripts/domains');

// 'Primary 3' -> 3, 'Secondary …' -> 7, anything unknown -> 0 (treated as most foundational).
const levelRank = (s = '') => {
  const m = /Primary\s*(\d)/i.exec(s);
  if (m) return Number(m[1]);
  if (/secondary|sec\b/i.test(s)) return 7;
  return 0;
};

// Lower-level skill -> higher-level prerequisite it currently depends on. The
// graph is now fully level-consistent, so this is empty: any cross-level edge is
// a regression. (History: geo.angle-intro/geo.lines flipped, mea.unit-convert
// repointed to op.mult.by-10-100, mea.money re-levelled to P4.)
const EXPECTED_CROSS_LEVEL = new Set([]);

async function loadGraph() {
  const bases = fs.readdirSync(domainsDir).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3));
  const skills = new Map(); // slug -> { name, level, prereqs }
  const dups = [];
  for (const base of bases) {
    const mod = await import(`../scripts/domains/${base}.js`);
    const data = mod.default || Object.values(mod)[0];
    const walk = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) return o.forEach(walk);
      if (o.slug && o.name) {
        if (skills.has(o.slug)) dups.push(o.slug);
        skills.set(o.slug, { name: o.name, level: o.level, prereqs: o.prerequisites || [] });
      }
      if (o.skills) walk(o.skills);
      if (o.topics) walk(o.topics);
    };
    walk(data);
  }
  return { skills, dups };
}

describe('skill-graph integrity', async () => {
  const { skills, dups } = await loadGraph();

  it('has a healthy number of uniquely-slugged skills', () => {
    expect(dups).toEqual([]);
    expect(skills.size).toBeGreaterThanOrEqual(161);
  });

  it('has no dangling prerequisite references', () => {
    const dangling = [];
    for (const [slug, s] of skills) for (const p of s.prereqs) if (!skills.has(p)) dangling.push(`${slug} -> ${p}`);
    expect(dangling).toEqual([]);
  });

  it('is acyclic (a topological order exists)', () => {
    const indeg = new Map([...skills.keys()].map((k) => [k, 0]));
    const dependents = new Map();
    for (const [slug, s] of skills) for (const p of s.prereqs) if (skills.has(p)) {
      indeg.set(slug, indeg.get(slug) + 1);
      if (!dependents.has(p)) dependents.set(p, []);
      dependents.get(p).push(slug);
    }
    const queue = [...indeg].filter(([, d]) => d === 0).map(([k]) => k);
    let visited = 0;
    while (queue.length) {
      const n = queue.shift();
      visited++;
      for (const m of dependents.get(n) || []) { indeg.set(m, indeg.get(m) - 1); if (indeg.get(m) === 0) queue.push(m); }
    }
    const inCycle = [...indeg].filter(([, d]) => d > 0).map(([k]) => k);
    expect(inCycle, `cycle through: ${inCycle.join(', ')}`).toEqual([]);
    expect(visited).toBe(skills.size);
  });

  it('introduces no new cross-level (higher-level-prerequisite) edges', () => {
    const inverted = [];
    for (const [slug, s] of skills) for (const p of s.prereqs) {
      const ps = skills.get(p);
      if (ps && levelRank(ps.level) > levelRank(s.level)) inverted.push(`${slug} -> ${p}`);
    }
    // Every inversion present must be one of the documented, review-flagged edges.
    const unexpected = inverted.filter((e) => !EXPECTED_CROSS_LEVEL.has(e));
    expect(unexpected, `unexpected cross-level edges: ${unexpected.join(', ')}`).toEqual([]);
  });
});
