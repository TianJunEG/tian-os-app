// Rule-based question generator: coverage + structural correctness guard.
// Walks the 10 domain definitions (the source of truth for the skill graph) and
// asserts (a) every skill we CAN generate without a figure stays generatable,
// (b) the figure-dependent skills stay deliberately un-generated (so we never
// ship a text-only fake of a graph/shape/symmetry question), and (c) every
// generated question is structurally sound (no NaN/undefined, MCQs have four
// distinct choices that include the answer).
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isGeneratable, generateQuestionsForSkill } from './questionTemplates.js';

const domainsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../scripts/domains');

// Skills that intrinsically need a visual stimulus — left to authored items.
const FIGURE_ONLY = new Set([
  'Parallel and perpendicular lines', 'Angle types (right, acute, obtuse)',
  'Measuring and drawing angles',
  'Completing symmetric figures',
  'Identifying 3D solids (faces, edges, vertices)', 'Nets and views of solids',
  'Position and compass directions', 'Drawing and constructing figures',
]);

describe('question generator coverage', async () => {
  const bases = fs.readdirSync(domainsDir).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3));
  let allNames = [];
  for (const base of bases) {
    const mod = await import(`../scripts/domains/${base}.js`);
    const data = mod.default || Object.values(mod)[0];
    const names = [];
    const walk = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) return o.forEach(walk);
      if (o.slug && o.name) names.push(o.name);
      if (o.skills) walk(o.skills);
      if (o.topics) walk(o.topics);
    };
    walk(data);
    allNames = allNames.concat(names);
  }

  it('generates every figure-free skill and leaves figure-only skills to authored items', () => {
    const missing = allNames.filter((n) => !isGeneratable(n));
    // The only un-generatable skills must be the figure-dependent set.
    expect(new Set(missing)).toEqual(FIGURE_ONLY);
    expect(allNames.filter((n) => isGeneratable(n)).length).toBeGreaterThanOrEqual(150);
  });

  it('produces structurally valid questions for every generatable skill', () => {
    for (const name of allNames) {
      if (!isGeneratable(name)) continue;
      const qs = generateQuestionsForSkill(name, 4);
      expect(qs.length, `${name} should generate questions`).toBeGreaterThan(0);
      for (const q of qs) {
        expect(q.stem, name).toBeTruthy();
        expect(/undefined|NaN/.test(q.stem), `${name} stem: ${q.stem}`).toBe(false);
        expect(String(q.answer)).not.toBe('');
        expect(/undefined|NaN/.test(String(q.answer)), `${name} answer`).toBe(false);
        expect(/undefined|NaN/.test(q.workedSolution || ''), `${name} worked`).toBe(false);
        if (q.type === 'mcq') {
          expect(q.choices.length, `${name} choices`).toBe(4);
          expect(new Set(q.choices).size, `${name} distinct choices`).toBe(4);
          expect(q.choices.includes(String(q.answer)), `${name} answer in choices`).toBe(true);
        }
      }
    }
  });
});
