import { describe, it, expect } from 'vitest';
import { generateStatisticsQuestionSet, checkStatisticsAnswer } from './StatisticsQuestionGenerator.js';
import { statisticsSkillGraph } from './StatisticsSkillGraph.js';

const SKILL_IDS = statisticsSkillGraph?.skillIds
  || Array.from({ length: 8 }, (_, i) => 'ST' + String(i + 1).padStart(3, '0'));

function sampleAll(perSkill = 50) {
  const out = [];
  for (const skillId of SKILL_IDS) for (let c = 0; c < perSkill; c++) out.push(...generateStatisticsQuestionSet({ skillId, count: 6 }));
  return out;
}

describe('StatisticsQuestionGenerator', () => {
  const questions = sampleAll();

  it('produces questions for all 8 skills', () => {
    for (const skillId of SKILL_IDS) expect(generateStatisticsQuestionSet({ skillId, count: 6 }).length).toBe(6);
  });

  it('gives whole, non-negative answers (no Math.floor truncation, no impossible data)', () => {
    for (const q of questions) {
      const n = Number(q.answer.display);
      expect(Number.isInteger(n), q.prompt + ' => ' + q.answer.display).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
    }
  });

  it('means are exact (a true mean question always divides evenly)', () => {
    for (let c = 0; c < 80; c++) {
      for (const q of generateStatisticsQuestionSet({ skillId: 'ST006', count: 6 })) {
        const mm = /mean \(average\) of these \d+ numbers: ([\d, ]+)\./.exec(q.prompt);
        if (mm) {
          const vals = mm[1].split(',').map(Number);
          expect(Number(q.answer.display)).toBe(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
      }
    }
  });

  it('pie-chart data sums to 100% and degrees ≤ 360', () => {
    for (let c = 0; c < 80; c++) {
      for (const q of generateStatisticsQuestionSet({ skillId: 'ST008', count: 6 })) {
        expect(q.diagram.sectors.reduce((a, s) => a + s[1], 0)).toBe(100);
        if (/How many degrees/.test(q.prompt)) expect(Number(q.answer.display)).toBeLessThanOrEqual(360);
      }
    }
  });

  it('emits a matching diagram for every data-reading skill', () => {
    for (const id of ['ST001', 'ST002', 'ST003', 'ST004', 'ST005', 'ST008']) {
      for (const q of generateStatisticsQuestionSet({ skillId: id, count: 4 })) expect(q.diagram).toBeTruthy();
    }
    const kinds = new Set(questions.filter((q) => q.diagram).map((q) => q.diagram.kind));
    for (const k of ['table', 'pictograph', 'bar', 'line', 'pie']) expect(kinds.has(k)).toBe(true);
  });

  it('is not boilerplate; MCQs have 4 distinct choices incl. the answer', () => {
    for (const q of questions) {
      expect(q.solutionSteps.join(' ')).not.toMatch(/Apply the correct method/);
      if (q.type === 'mcq') {
        expect(q.choices.length).toBe(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.choices).toContain(q.answer.display);
      }
    }
  });
});
