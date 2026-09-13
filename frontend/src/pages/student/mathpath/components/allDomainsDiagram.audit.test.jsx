import { describe, it, expect } from 'vitest';
import { validateQuestionDiagram } from './QuestionDiagram';

// Every domain generator (shared — the SAME source the backend serves questions
// from) paired with the real diagram validator. A question that "requires" a
// diagram but has no renderable spec is what shows the student "This question
// could not load" — so this audit reproduces that exact condition across every
// skill of every domain.
import { generateOperationsQuestionSet } from '../../../../../../shared/mathpath/operations/OperationsQuestionGenerator.js';
import operationsSG from '../../../../../../shared/mathpath/operations/OperationsSkillGraph.js';
import { generateNumberSenseQuestionSet } from '../../../../../../shared/mathpath/numberSense/NumberSenseQuestionGenerator.js';
import numberSenseSG from '../../../../../../shared/mathpath/numberSense/NumberSenseSkillGraph.js';
import { generateAlgebraQuestionSet } from '../../../../../../shared/mathpath/algebra/AlgebraQuestionGenerator.js';
import algebraSG from '../../../../../../shared/mathpath/algebra/AlgebraSkillGraph.js';
import { generateAreaPerimeterQuestionSet } from '../../../../../../shared/mathpath/areaPerimeter/AreaPerimeterQuestionGenerator.js';
import areaPerimeterSG from '../../../../../../shared/mathpath/areaPerimeter/AreaPerimeterSkillGraph.js';
import { generateCirclesQuestionSet } from '../../../../../../shared/mathpath/circles/CirclesQuestionGenerator.js';
import circlesSG from '../../../../../../shared/mathpath/circles/CirclesSkillGraph.js';
import { generateDecimalQuestionSet } from '../../../../../../shared/mathpath/decimals/decimalsQuestionGenerator.js';
import decimalsSG from '../../../../../../shared/mathpath/decimals/decimalsSkillGraph.js';
import { generateEarlyNumeracyQuestionSet } from '../../../../../../shared/mathpath/earlyNumeracy/EarlyNumeracyQuestionGenerator.js';
import earlyNumeracySG from '../../../../../../shared/mathpath/earlyNumeracy/EarlyNumeracySkillGraph.js';
import { generateFractionQuestionSet } from '../../../../../../shared/mathpath/fractions/fractionQuestionGenerator.js';
import fractionSG from '../../../../../../shared/mathpath/fractions/fractionSkillGraph.js';
import { generateGeometryQuestionSet } from '../../../../../../shared/mathpath/geometry/GeometryQuestionGenerator.js';
import geometrySG from '../../../../../../shared/mathpath/geometry/GeometrySkillGraph.js';
import { generateMeasurementQuestionSet } from '../../../../../../shared/mathpath/measurement/MeasurementQuestionGenerator.js';
import measurementSG from '../../../../../../shared/mathpath/measurement/MeasurementSkillGraph.js';
import { generateMoneyQuestionSet } from '../../../../../../shared/mathpath/money/MoneyQuestionGenerator.js';
import moneySG from '../../../../../../shared/mathpath/money/MoneySkillGraph.js';
import { generatePercentageQuestionSet } from '../../../../../../shared/mathpath/percentages/percentageQuestionGenerator.js';
import percentageSG from '../../../../../../shared/mathpath/percentages/percentageSkillGraph.js';
import { generateRatioRateQuestionSet } from '../../../../../../shared/mathpath/ratioRate/ratioRateQuestionGenerator.js';
import ratioRateSG from '../../../../../../shared/mathpath/ratioRate/ratioRateSkillGraph.js';
import { generateStatisticsQuestionSet } from '../../../../../../shared/mathpath/statistics/StatisticsQuestionGenerator.js';
import statisticsSG from '../../../../../../shared/mathpath/statistics/StatisticsSkillGraph.js';
import { generateTimeQuestionSet } from '../../../../../../shared/mathpath/time/TimeQuestionGenerator.js';
import timeSG from '../../../../../../shared/mathpath/time/TimeSkillGraph.js';
import { generateVolumeQuestionSet } from '../../../../../../shared/mathpath/volume/VolumeQuestionGenerator.js';
import volumeSG from '../../../../../../shared/mathpath/volume/VolumeSkillGraph.js';

const skillsOf = (sg) => sg?.skillIds || (sg?.skills || []).map((s) => s.id) || [];

const DOMAINS = [
  ['operations', generateOperationsQuestionSet, operationsSG],
  ['numberSense', generateNumberSenseQuestionSet, numberSenseSG],
  ['algebra', generateAlgebraQuestionSet, algebraSG],
  ['areaPerimeter', generateAreaPerimeterQuestionSet, areaPerimeterSG],
  ['circles', generateCirclesQuestionSet, circlesSG],
  ['decimals', generateDecimalQuestionSet, decimalsSG],
  ['earlyNumeracy', generateEarlyNumeracyQuestionSet, earlyNumeracySG],
  ['fractions', generateFractionQuestionSet, fractionSG],
  ['geometry', generateGeometryQuestionSet, geometrySG],
  ['measurement', generateMeasurementQuestionSet, measurementSG],
  ['money', generateMoneyQuestionSet, moneySG],
  ['percentages', generatePercentageQuestionSet, percentageSG],
  ['ratioRate', generateRatioRateQuestionSet, ratioRateSG],
  ['statistics', generateStatisticsQuestionSet, statisticsSG],
  ['time', generateTimeQuestionSet, timeSG],
  ['volume', generateVolumeQuestionSet, volumeSG],
];

describe('MathPath domains — no generated question shows "could not load"', () => {
  it.each(DOMAINS)('%s: every skill produces renderable questions', (name, gen, sg) => {
    const skills = skillsOf(sg);
    expect(skills.length).toBeGreaterThan(0);
    const failures = [];
    for (const skillId of skills) {
      for (let round = 0; round < 4; round++) {
        let qs = [];
        try { qs = gen({ skillId, count: 8 }) || []; } catch (e) { failures.push(`${skillId}: THROWS ${e.message}`); break; }
        for (const q of qs) {
          const v = validateQuestionDiagram(q);
          if (!v.ok) {
            failures.push(`${skillId} [${q.type}] "${String(q.prompt).slice(0, 70)}" — requiresDiagram=${v.requiresDiagram}, spec=${v.spec?.type || (q.diagram && q.diagram.kind) || 'none'}`);
          }
        }
      }
    }
    // Print a compact, de-duplicated report so the failing questions are visible.
    const uniq = [...new Set(failures)];
    if (uniq.length) {
      // eslint-disable-next-line no-console
      console.log(`\n[${name}] ${uniq.length} "could not load" question shapes:\n  ${uniq.slice(0, 30).join('\n  ')}`);
    }
    expect(uniq).toEqual([]);
  });
});
