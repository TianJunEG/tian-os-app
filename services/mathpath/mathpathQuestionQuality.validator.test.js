// P3 — cross-domain question-quality validator (see MATHPATH_QUESTION_QUALITY_
// AUDIT.md). A permanent CI backstop that re-derives nothing domain-specific but
// asserts the invariants every MathPath generator must hold, so a future
// regression (a stubbed generator, boilerplate solutions, an answer the checker
// rejects, a malformed MCQ) fails the build.
import { describe, it, expect } from 'vitest';

// 11 domains that share the canonical { generate*QuestionSet, check*Answer,
// *SkillGraph.skillIds } contract.
import { generateMoneyQuestionSet, checkMoneyAnswer } from '../../shared/mathpath/money/MoneyQuestionGenerator.js';
import { moneySkillGraph } from '../../shared/mathpath/money/MoneySkillGraph.js';
import { generateTimeQuestionSet, checkTimeAnswer } from '../../shared/mathpath/time/TimeQuestionGenerator.js';
import { timeSkillGraph } from '../../shared/mathpath/time/TimeSkillGraph.js';
import { generateOperationsQuestionSet, checkOperationsAnswer } from '../../shared/mathpath/operations/OperationsQuestionGenerator.js';
import { operationsSkillGraph } from '../../shared/mathpath/operations/OperationsSkillGraph.js';
import { generateNumberSenseQuestionSet, checkNumberSenseAnswer } from '../../shared/mathpath/numberSense/NumberSenseQuestionGenerator.js';
import { numberSenseSkillGraph } from '../../shared/mathpath/numberSense/NumberSenseSkillGraph.js';
import { generateMeasurementQuestionSet, checkMeasurementAnswer } from '../../shared/mathpath/measurement/MeasurementQuestionGenerator.js';
import { measurementSkillGraph } from '../../shared/mathpath/measurement/MeasurementSkillGraph.js';
import { generateGeometryQuestionSet, checkGeometryAnswer } from '../../shared/mathpath/geometry/GeometryQuestionGenerator.js';
import { geometrySkillGraph } from '../../shared/mathpath/geometry/GeometrySkillGraph.js';
import { generateVolumeQuestionSet, checkVolumeAnswer } from '../../shared/mathpath/volume/VolumeQuestionGenerator.js';
import { volumeSkillGraph } from '../../shared/mathpath/volume/VolumeSkillGraph.js';
import { generateCirclesQuestionSet, checkCirclesAnswer } from '../../shared/mathpath/circles/CirclesQuestionGenerator.js';
import { circlesSkillGraph } from '../../shared/mathpath/circles/CirclesSkillGraph.js';
import { generateAreaPerimeterQuestionSet, checkAreaPerimeterAnswer } from '../../shared/mathpath/areaPerimeter/AreaPerimeterQuestionGenerator.js';
import { areaPerimeterSkillGraph } from '../../shared/mathpath/areaPerimeter/AreaPerimeterSkillGraph.js';
import { generateStatisticsQuestionSet, checkStatisticsAnswer } from '../../shared/mathpath/statistics/StatisticsQuestionGenerator.js';
import { statisticsSkillGraph } from '../../shared/mathpath/statistics/StatisticsSkillGraph.js';
import { generateAlgebraQuestionSet, checkAlgebraAnswer } from '../../shared/mathpath/algebra/AlgebraQuestionGenerator.js';
import { algebraSkillGraph } from '../../shared/mathpath/algebra/AlgebraSkillGraph.js';

// The 4 sophisticated domains keep their own richer APIs and per-domain suites;
// here they get a lighter structural pass.
import { generateFractionQuestionSet } from '../../shared/mathpath/fractions/fractionQuestionGenerator.js';
import { fractionSkillGraph } from '../../shared/mathpath/fractions/fractionSkillGraph.js';
import { generateDecimalQuestionSet } from '../../shared/mathpath/decimals/decimalsQuestionGenerator.js';
import { decimalsSkillGraph } from '../../shared/mathpath/decimals/decimalsSkillGraph.js';
import { generatePercentageQuestionSet } from '../../shared/mathpath/percentages/percentageQuestionGenerator.js';
import { percentageSkillGraph } from '../../shared/mathpath/percentages/percentageSkillGraph.js';
import { generateRatioRateQuestionSet } from '../../shared/mathpath/ratioRate/ratioRateQuestionGenerator.js';
import { ratioRateSkillGraph } from '../../shared/mathpath/ratioRate/ratioRateSkillGraph.js';

const STUB = /^compute:\s*\d+\s*\+\s*\d+\s*=\s*\?$/i;     // the old "Compute: a + b = ?" stub
const BOILERPLATE = /Apply the correct method/;

const CANONICAL = [
  ['money', generateMoneyQuestionSet, checkMoneyAnswer, moneySkillGraph],
  ['time', generateTimeQuestionSet, checkTimeAnswer, timeSkillGraph],
  ['operations', generateOperationsQuestionSet, checkOperationsAnswer, operationsSkillGraph],
  ['number-sense', generateNumberSenseQuestionSet, checkNumberSenseAnswer, numberSenseSkillGraph],
  ['measurement', generateMeasurementQuestionSet, checkMeasurementAnswer, measurementSkillGraph],
  ['geometry', generateGeometryQuestionSet, checkGeometryAnswer, geometrySkillGraph],
  ['volume', generateVolumeQuestionSet, checkVolumeAnswer, volumeSkillGraph],
  ['circles', generateCirclesQuestionSet, checkCirclesAnswer, circlesSkillGraph],
  ['area-perimeter', generateAreaPerimeterQuestionSet, checkAreaPerimeterAnswer, areaPerimeterSkillGraph],
  ['statistics', generateStatisticsQuestionSet, checkStatisticsAnswer, statisticsSkillGraph],
  ['algebra', generateAlgebraQuestionSet, checkAlgebraAnswer, algebraSkillGraph],
];

const SOPHISTICATED = [
  ['fractions', generateFractionQuestionSet, fractionSkillGraph],
  ['decimals', generateDecimalQuestionSet, decimalsSkillGraph],
  ['percentage', generatePercentageQuestionSet, percentageSkillGraph],
  ['ratio-rate', generateRatioRateQuestionSet, ratioRateSkillGraph],
];

describe('MathPath question-quality validator [P3]', () => {
  describe.each(CANONICAL)('%s', (name, generate, check, graph) => {
    const skills = graph.skillIds;

    it('every skill produces questions', () => {
      for (const skillId of skills) {
        expect(generate({ skillId, count: 6 }).length, `${name}/${skillId}`).toBeGreaterThan(0);
      }
    });

    it('no stub prompts and no boilerplate worked solutions', () => {
      for (const skillId of skills) {
        for (let c = 0; c < 6; c++) {
          for (const q of generate({ skillId, count: 6 })) {
            const where = `${name}/${skillId}: ${q.prompt}`;
            expect(STUB.test(q.prompt), where).toBe(false);
            expect(q.prompt.trim().length, where).toBeGreaterThan(0);
            expect((q.solutionSteps || []).join(' '), where).not.toMatch(BOILERPLATE);
            expect((q.solutionSteps || []).length, where).toBeGreaterThanOrEqual(1);
          }
        }
      }
    });

    it("each generator's own answer passes its own checker", () => {
      for (const skillId of skills) {
        for (let c = 0; c < 6; c++) {
          for (const q of generate({ skillId, count: 6 })) {
            const verdict = check({ question: q, studentResponse: q.answer?.display ?? q.answer });
            expect(verdict.correct, `${name}/${skillId}: ${q.prompt} => ${q.answer?.display}`).toBe(true);
          }
        }
      }
    });

    it('MCQs are well-formed: ≥2 distinct choices that include the answer', () => {
      for (const skillId of skills) {
        for (let c = 0; c < 6; c++) {
          for (const q of generate({ skillId, count: 6 }).filter((x) => x.type === 'mcq')) {
            const where = `${name}/${skillId}: ${q.choices?.join('|')}`;
            expect(q.choices.length, where).toBeGreaterThanOrEqual(2);
            expect(new Set(q.choices).size, where).toBe(q.choices.length);
            expect(q.choices, where).toContain(String(q.answer.display));
          }
        }
      }
    });
  });

  describe.each(SOPHISTICATED)('%s (structural)', (name, generate, graph) => {
    const skills = graph.skillIds;

    it('no "Compute: a + b = ?" stub prompts and no boilerplate solutions', () => {
      for (const skillId of skills) {
        const set = generate({ skillId, count: 6 }) || [];
        for (const q of set) {
          if (!q || !q.prompt) continue;
          const where = `${name}/${skillId}: ${q.prompt}`;
          expect(STUB.test(q.prompt), where).toBe(false);
          const steps = q.solutionSteps || q.workedSolution || [];
          expect((Array.isArray(steps) ? steps.join(' ') : String(steps)), where).not.toMatch(BOILERPLATE);
        }
      }
    });
  });
});
