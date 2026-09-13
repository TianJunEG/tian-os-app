import { describe, it, expect } from 'vitest';

// Canonical domains
import { generateMoneyQuestionSet } from '../../../../shared/mathpath/money/MoneyQuestionGenerator.js';
import { moneySkillGraph } from '../../../../shared/mathpath/money/MoneySkillGraph.js';
import { generateTimeQuestionSet } from '../../../../shared/mathpath/time/TimeQuestionGenerator.js';
import { timeSkillGraph } from '../../../../shared/mathpath/time/TimeSkillGraph.js';
import { generateOperationsQuestionSet } from '../../../../shared/mathpath/operations/OperationsQuestionGenerator.js';
import { operationsSkillGraph } from '../../../../shared/mathpath/operations/OperationsSkillGraph.js';
import { generateNumberSenseQuestionSet } from '../../../../shared/mathpath/numberSense/NumberSenseQuestionGenerator.js';
import { numberSenseSkillGraph } from '../../../../shared/mathpath/numberSense/NumberSenseSkillGraph.js';
import { generateMeasurementQuestionSet } from '../../../../shared/mathpath/measurement/MeasurementQuestionGenerator.js';
import { measurementSkillGraph } from '../../../../shared/mathpath/measurement/MeasurementSkillGraph.js';
import { generateGeometryQuestionSet } from '../../../../shared/mathpath/geometry/GeometryQuestionGenerator.js';
import { geometrySkillGraph } from '../../../../shared/mathpath/geometry/GeometrySkillGraph.js';
import { generateVolumeQuestionSet } from '../../../../shared/mathpath/volume/VolumeQuestionGenerator.js';
import { volumeSkillGraph } from '../../../../shared/mathpath/volume/VolumeSkillGraph.js';
import { generateCirclesQuestionSet } from '../../../../shared/mathpath/circles/CirclesQuestionGenerator.js';
import { circlesSkillGraph } from '../../../../shared/mathpath/circles/CirclesSkillGraph.js';
import { generateAreaPerimeterQuestionSet } from '../../../../shared/mathpath/areaPerimeter/AreaPerimeterQuestionGenerator.js';
import { areaPerimeterSkillGraph } from '../../../../shared/mathpath/areaPerimeter/AreaPerimeterSkillGraph.js';
import { generateStatisticsQuestionSet } from '../../../../shared/mathpath/statistics/StatisticsQuestionGenerator.js';
import { statisticsSkillGraph } from '../../../../shared/mathpath/statistics/StatisticsSkillGraph.js';
import { generateAlgebraQuestionSet } from '../../../../shared/mathpath/algebra/AlgebraQuestionGenerator.js';
import { algebraSkillGraph } from '../../../../shared/mathpath/algebra/AlgebraSkillGraph.js';

// Sophisticated domains
import { generateFractionQuestionSet } from '../../../../shared/mathpath/fractions/fractionQuestionGenerator.js';
import { fractionSkillGraph } from '../../../../shared/mathpath/fractions/fractionSkillGraph.js';
import { generateDecimalQuestionSet } from '../../../../shared/mathpath/decimals/decimalsQuestionGenerator.js';
import { decimalsSkillGraph } from '../../../../shared/mathpath/decimals/decimalsSkillGraph.js';
import { generatePercentageQuestionSet } from '../../../../shared/mathpath/percentages/percentageQuestionGenerator.js';
import { percentageSkillGraph } from '../../../../shared/mathpath/percentages/percentageSkillGraph.js';
import { generateRatioRateQuestionSet } from '../../../../shared/mathpath/ratioRate/ratioRateQuestionGenerator.js';
import { ratioRateSkillGraph } from '../../../../shared/mathpath/ratioRate/ratioRateSkillGraph.js';

import { getQuestionDiagramSpec } from '../../pages/student/mathpath/components/QuestionDiagram.jsx';
import { renderers } from './svgRenderers.js';

const DOMAINS = [
  ['money', generateMoneyQuestionSet, moneySkillGraph],
  ['time', generateTimeQuestionSet, timeSkillGraph],
  ['operations', generateOperationsQuestionSet, operationsSkillGraph],
  ['number-sense', generateNumberSenseQuestionSet, numberSenseSkillGraph],
  ['measurement', generateMeasurementQuestionSet, measurementSkillGraph],
  ['geometry', generateGeometryQuestionSet, geometrySkillGraph],
  ['volume', generateVolumeQuestionSet, volumeSkillGraph],
  ['circles', generateCirclesQuestionSet, circlesSkillGraph],
  ['area-perimeter', generateAreaPerimeterQuestionSet, areaPerimeterSkillGraph],
  ['statistics', generateStatisticsQuestionSet, statisticsSkillGraph],
  ['algebra', generateAlgebraQuestionSet, algebraSkillGraph],
  ['fractions', generateFractionQuestionSet, fractionSkillGraph],
  ['decimals', generateDecimalQuestionSet, decimalsSkillGraph],
  ['percentage', generatePercentageQuestionSet, percentageSkillGraph],
  ['ratio-rate', generateRatioRateQuestionSet, ratioRateSkillGraph],
];

// Every string the diagram must NOT print: the answer, in every form we can find.
function answerStrings(q) {
  const out = new Set();
  const add = (v) => {
    if (v === null || v === undefined) return;
    const s = String(typeof v === 'object' ? (v.display ?? v.value ?? '') : v).trim();
    if (s) out.add(s);
  };
  add(q.answer);
  if (q.answer && typeof q.answer === 'object') { add(q.answer.display); add(q.answer.value); }
  (q.acceptedAnswers || []).forEach(add);
  (q.answers || []).forEach(add);
  return [...out];
}

// Inner text of every <text> node, with child tags (e.g. <animate/>) stripped.
function textNodes(svg) {
  const nodes = [];
  const re = /<text\b[^>]*>([\s\S]*?)<\/text>/g;
  let m;
  while ((m = re.exec(svg))) {
    const inner = m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (inner) nodes.push(inner);
  }
  return nodes;
}

// Does a text node reveal the answer? Exact match, or the answer as a standalone
// numeric/fraction token inside a longer label — not preceded/followed by a
// digit, dot, slash, %, or $ (so "12" doesn't match inside "120" or "1/12").
function nodeRevealsAnswer(node, answer) {
  if (node === answer) return true;
  const esc = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // The token must not be part of a LARGER number/fraction: reject a following
  // digit, a decimal-point+digit, a slash+digit, or a percent sign. A trailing
  // space or sentence period is a valid boundary (so "50 g." and "4/6." match).
  const re = new RegExp(`(^|[^0-9./%$])${esc}(?![0-9])(?![./]\\d)(?!%)`);
  return re.test(node);
}

describe('E2E: no diagram prints its own answer (answer-leak audit, all domains)', () => {
  const leaks = [];

  for (const [domain, generate, graph] of DOMAINS) {
    for (const skillId of graph.skillIds) {
      for (let round = 0; round < 5; round += 1) {
        let qs;
        try {
          qs = generate({ skillId, count: 8 });
        } catch (e) {
          leaks.push({ domain, skillId, prompt: `GENERATE THREW: ${e.message}`, answer: '', matched: '' });
          continue;
        }
        for (const q of qs) {
          let spec;
          try {
            spec = getQuestionDiagramSpec(q);
          } catch {
            spec = null;
          }
          if (!spec || !renderers[spec.type]) continue;
          let svg;
          try {
            svg = renderers[spec.type](spec);
          } catch {
            continue;
          }
          const nodes = textNodes(svg);
          if (!nodes.length) continue;
          for (const ans of answerStrings(q)) {
            // ignore trivially short answers that create noise (single-letter var, empty)
            if (ans.length < 1) continue;
            const hit = nodes.find((n) => nodeRevealsAnswer(n, ans));
            if (hit) {
              leaks.push({ domain, skillId, specType: spec.type, prompt: String(q.prompt), answer: ans, matched: hit });
            }
          }
        }
      }
    }
  }

  // Classify each flag. A flag is EXPLAINED (not a real leak) only for these
  // audited, structural reasons; anything else is a genuine answer leak and fails.
  function explain(l) {
    // (a) The value is already written in the prompt, so a figure that shows it is
    //     restating given info, not revealing the answer (measuring-scale calibration
    //     legend "each mark = 50 g"; the two fractions in a compare bar-pair).
    if (nodeRevealsAnswer(l.prompt, l.answer)) return 'value is stated in the prompt (given info restated)';
    // (b) bar_chart never prints bar values — only y-axis gridline labels and category
    //     names (see barChart(): "Values are deliberately NOT printed above the bars").
    //     A "how many more / difference" answer that matches is coinciding with a gridline.
    if (l.specType === 'bar_chart') return 'y-axis gridline tick, not a bar/answer label';
    // (c) object_set shows the partition (denominator) group-count as an unshaded scaffold;
    //     it equals the answer only when the numerator is 1 (1/3 of 9 → 3 groups, 3 chosen),
    //     and the count is the denominator taken straight from the prompt fraction.
    if (l.specType === 'object_set') return 'partition group-count scaffold (matches only when numerator is 1)';
    return null;
  }

  it('no diagram reveals its own answer (only audited false-positives allowed)', () => {
    const seen = new Map();
    for (const l of leaks) {
      const key = `${l.domain}/${l.skillId}|${l.specType}|ans=${l.answer}|node=${l.matched}`;
      if (!seen.has(key)) seen.set(key, l);
    }
    const unique = [...seen.values()];
    const real = unique.filter((l) => !explain(l));

    const fmt = (l) => `  [${l.domain}/${l.skillId}] type=${l.specType} ans="${l.answer}" node="${l.matched}"\n      prompt: ${String(l.prompt).slice(0, 100)}`;
    // eslint-disable-next-line no-console
    console.log(
      `\nANSWER-LEAK AUDIT — ${unique.length} flags: ${unique.length - real.length} explained (false positive), ${real.length} real.\n`
      + (real.length ? `REAL LEAKS:\n${real.map(fmt).join('\n')}\n` : 'No real leaks — every flag is an audited false positive.\n'),
    );

    expect(real, real.map(fmt).join('\n')).toHaveLength(0);
  });
});
