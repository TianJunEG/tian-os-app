// Shared core for every non-fractions MathPath domain practice session.
//
// Previously each domain (Circles, Geometry, Algebra, …) shipped its own
// ~198-line clone of an identical component. They now all render the single
// <DomainPracticeSession domain="…" /> component, configured from the registry
// below. Pure helpers are exported and unit-tested; the registry maps a domain
// slug to its API methods, friendly labels, and skill-name source.

import { mathpathAPI } from '../../../../services/api';
import { stripEmoji } from '../../../../utils/sound';

import { buildAlgebraLearningPathView } from '../../../../mathpath/algebra/AlgebraLearningPathModel';
import { buildAreaPerimeterLearningPathView } from '../../../../mathpath/areaPerimeter/AreaPerimeterLearningPathModel';
import { buildCirclesLearningPathView } from '../../../../mathpath/circles/CirclesLearningPathModel';
import { buildDecimalsLearningPathView } from '../../../../mathpath/decimals/decimalsLearningPathModel';
import { buildEarlyNumeracyLearningPathView } from '../../../../mathpath/earlyNumeracy/EarlyNumeracyLearningPathModel';
import { buildGeometryLearningPathView } from '../../../../mathpath/geometry/GeometryLearningPathModel';
import { buildMeasurementLearningPathView } from '../../../../mathpath/measurement/MeasurementLearningPathModel';
import { buildMoneyLearningPathView } from '../../../../mathpath/money/MoneyLearningPathModel';
import { buildNumberSenseLearningPathView } from '../../../../mathpath/numberSense/NumberSenseLearningPathModel';
import { buildOperationsLearningPathView } from '../../../../mathpath/operations/OperationsLearningPathModel';
import { buildPercentagesLearningPathView } from '../../../../mathpath/percentages/percentagesLearningPathModel';
import { buildRatioRateLearningPathView } from '../../../../mathpath/ratioRate/ratioRateLearningPathModel';
import { buildStatisticsLearningPathView } from '../../../../mathpath/statistics/StatisticsLearningPathModel';
import { buildTimeLearningPathView } from '../../../../mathpath/time/TimeLearningPathModel';
import { buildVolumeLearningPathView } from '../../../../mathpath/volume/VolumeLearningPathModel';

// ── Pure helpers (unit-tested) ──────────────────────────────────────────────
export function buildSubmitPayload(answers = []) {
  return {
    responses: answers
      .filter((a) => a && a.questionId != null && String(a.studentAnswer ?? '').trim() !== '')
      .map((a) => {
        const response = {
          questionId: a.questionId,
          studentAnswer: String(a.studentAnswer),
          timeTaken: Number(a.timeTaken || 0),
        };
        if (a.reflection) response.confidence = a.reflection;
        if (a.workingSubmitted) response.workingSubmitted = true;
        if (a.workingImage) response.workingImage = a.workingImage;
        if (Array.isArray(a.workingStrokes)) response.workingStrokes = a.workingStrokes;
        if (Array.isArray(a.workingMathObjects)) response.workingMathObjects = a.workingMathObjects;
        if (a.workingSessionId) response.workingSessionId = String(a.workingSessionId);
        if (a.fullscreenWorkingSubmitted) response.fullscreenWorkingSubmitted = true;
        return response;
      }),
  };
}

export function summarisePracticeResult(summary = {}) {
  const acc = summary.accuracySummary || {};
  const perSkill = summary.perSkill || {};
  return {
    total: acc.total || 0,
    correct: acc.correct || 0,
    accuracyPercentage: acc.accuracyPercentage || 0,
    skillRows: Object.entries(perSkill).map(([skillId, s]) => ({
      skillId,
      accuracy: s.accuracy || 0,
      status: s.status || 'learning',
    })),
  };
}

export function statusTone(status) {
  if (status === 'mastered') return 'gold';
  if (status === 'learning') return 'navy';
  return 'error';
}

// Child-facing encouragement keyed off accuracy. Same warmth for every domain
// so the tone no longer lurches between domains the way the old clones did.
export function mascotMessageFor(label, pct) {
  if (pct >= 80) return `${pct}% — amazing work on ${label}! 🎉`;
  if (pct >= 50) return `${pct}% — nice going! Check the skills below to level up.`;
  return `${pct}% this round — every try makes your ${label} stronger. You've got this!`;
}

// ── Domain registry ─────────────────────────────────────────────────────────
// slug must match the route segment in App.jsx (also used to build backRoute).
// skillStates + pattern + subtitle drive the shared learning-path (skill map).
export const DOMAIN_PRACTICE_CONFIG = {
  decimals: {
    label: 'Decimals', start: mathpathAPI.startDecimalsPractice, submit: mathpathAPI.submitDecimalsPractice, buildView: buildDecimalsLearningPathView,
    skillStates: mathpathAPI.decimalsSkillStates, pattern: /^D0\d\d$/, subtitle: 'Place value through operations, conversion and measurement (P4–P6).',
  },
  percentages: {
    label: 'Percentage', start: mathpathAPI.startPercentagesPractice, submit: mathpathAPI.submitPercentagesPractice, buildView: buildPercentagesLearningPathView,
    skillStates: mathpathAPI.percentagesSkillStates, pattern: /^P0\d\d$/, subtitle: 'Per hundred, conversions, discount, GST and interest (P5–P6).',
    startFluency: mathpathAPI.startPercentagesFluency, submitFluency: mathpathAPI.submitPercentagesFluency,
    startRetention: mathpathAPI.startPercentagesRetention, submitRetention: mathpathAPI.submitPercentagesRetention,
  },
  'ratio-rate': {
    label: 'Ratio & Rate', start: mathpathAPI.startRatioRatePractice, submit: mathpathAPI.submitRatioRatePractice, buildView: buildRatioRateLearningPathView,
    skillStates: mathpathAPI.ratioRateSkillStates, pattern: /^R0\d\d$/, subtitle: 'Equivalent ratios, dividing in a ratio, speed and direct proportion (P5–P6).',
    startFluency: mathpathAPI.startRatioRateFluency, submitFluency: mathpathAPI.submitRatioRateFluency,
    startRetention: mathpathAPI.startRatioRateRetention, submitRetention: mathpathAPI.submitRatioRateRetention,
  },
  algebra: {
    label: 'Algebra', start: mathpathAPI.startAlgebraPractice, submit: mathpathAPI.submitAlgebraPractice, buildView: buildAlgebraLearningPathView,
    skillStates: mathpathAPI.algebraSkillStates, pattern: /AL0\d\d/, subtitle: 'Patterns, unknowns, linear equations and algebraic manipulation (P4–P6).',
    startFluency: mathpathAPI.startAlgebraFluency, submitFluency: mathpathAPI.submitAlgebraFluency,
    startRetention: mathpathAPI.startAlgebraRetention, submitRetention: mathpathAPI.submitAlgebraRetention,
  },
  'area-perimeter': {
    label: 'Area & Perimeter', start: mathpathAPI.startAreaPerimeterPractice, submit: mathpathAPI.submitAreaPerimeterPractice, buildView: buildAreaPerimeterLearningPathView,
    skillStates: mathpathAPI.areaPerimeterSkillStates, pattern: /AP0\d\d/, subtitle: 'Rectilinear figures, composite shapes and circles (P3–P6).',
  },
  circles: {
    label: 'Circles', start: mathpathAPI.startCirclesPractice, submit: mathpathAPI.submitCirclesPractice, buildView: buildCirclesLearningPathView,
    skillStates: mathpathAPI.circlesSkillStates, pattern: /CI0\d\d/, subtitle: 'Circumference, area, arc and sector (P5–P6).',
  },
  geometry: {
    label: 'Geometry', start: mathpathAPI.startGeometryPractice, submit: mathpathAPI.submitGeometryPractice, buildView: buildGeometryLearningPathView,
    skillStates: mathpathAPI.geometrySkillStates, pattern: /GE0\d\d/, subtitle: 'Angles, triangles, quadrilaterals, symmetry and nets (P3–P6).',
    startFluency: mathpathAPI.startGeometryFluency, submitFluency: mathpathAPI.submitGeometryFluency,
    startRetention: mathpathAPI.startGeometryRetention, submitRetention: mathpathAPI.submitGeometryRetention,
  },
  measurement: {
    label: 'Measurement', start: mathpathAPI.startMeasurementPractice, submit: mathpathAPI.submitMeasurementPractice, buildView: buildMeasurementLearningPathView,
    skillStates: mathpathAPI.measurementSkillStates, pattern: /ME0\d\d/, subtitle: 'Length, mass, volume and converting between units (P1–P5).',
  },
  money: {
    label: 'Money', start: mathpathAPI.startMoneyPractice, submit: mathpathAPI.submitMoneyPractice, buildView: buildMoneyLearningPathView,
    skillStates: mathpathAPI.moneySkillStates, pattern: /MN0\d\d/, subtitle: 'Notes, coins, addition, subtraction and change (P1–P3).',
  },
  'early-numeracy': {
    label: 'Numeracy', start: mathpathAPI.startEarlyNumeracyPractice, submit: mathpathAPI.submitEarlyNumeracyPractice, buildView: buildEarlyNumeracyLearningPathView,
    skillStates: mathpathAPI.earlyNumeracySkillStates, pattern: /EN0\d\d/, subtitle: 'Counting, comparing and number bonds — for K2/P1.',
    // Gentle K2 "Explore" mode: no high-stakes diagnostic check-in.
    gentle: true,
  },
  'number-sense': {
    label: 'Whole Numbers', start: mathpathAPI.startNumberSensePractice, submit: mathpathAPI.submitNumberSensePractice, buildView: buildNumberSenseLearningPathView,
    skillStates: mathpathAPI.numberSenseSkillStates, pattern: /NS0\d\d/, subtitle: 'Whole numbers, place value, estimation and rounding (P1–P5).',
  },
  operations: {
    label: 'Four Operations', start: mathpathAPI.startOperationsPractice, submit: mathpathAPI.submitOperationsPractice, buildView: buildOperationsLearningPathView,
    skillStates: mathpathAPI.operationsSkillStates, pattern: /OP0\d\d/, subtitle: 'Addition, subtraction, multiplication and division (P1–P4).',
  },
  statistics: {
    label: 'Statistics', start: mathpathAPI.startStatisticsPractice, submit: mathpathAPI.submitStatisticsPractice, buildView: buildStatisticsLearningPathView,
    skillStates: mathpathAPI.statisticsSkillStates, pattern: /ST0\d\d/, subtitle: 'Pictograms, bar charts, line graphs and averages (P2–P6).',
  },
  time: {
    label: 'Time', start: mathpathAPI.startTimePractice, submit: mathpathAPI.submitTimePractice, buildView: buildTimeLearningPathView,
    skillStates: mathpathAPI.timeSkillStates, pattern: /TM0\d\d/, subtitle: 'Reading clocks, duration, 24-hour format and timetables (P1–P5).',
  },
  volume: {
    label: 'Volume', start: mathpathAPI.startVolumePractice, submit: mathpathAPI.submitVolumePractice, buildView: buildVolumeLearningPathView,
    skillStates: mathpathAPI.volumeSkillStates, pattern: /VL0\d\d/, subtitle: 'Cubes, cuboids, liquid volume and displacement (P4–P6).',
    startFluency: mathpathAPI.startVolumeFluency, submitFluency: mathpathAPI.submitVolumeFluency,
    startRetention: mathpathAPI.startVolumeRetention, submitRetention: mathpathAPI.submitVolumeRetention,
  },
};

export function getDomainConfig(domain) {
  return DOMAIN_PRACTICE_CONFIG[domain] || null;
}

// Math symbols offered on free-text answers per domain, so questions whose
// answers need π / ° / ∠ / exponents / roots are actually answerable. Domains
// that only need plain numerals (decimals, money, time, whole numbers) get no
// bar. Keys reference SYMBOL_DEFS in MathSymbolBar.
export const DOMAIN_ANSWER_SYMBOLS = {
  circles: ['pi', 'root', 'square', 'divide', 'fraction'],
  geometry: ['degree', 'angle', 'root', 'square'],
  algebra: ['x', 'power', 'times', 'divide', 'lparen', 'rparen', 'fraction'],
  'area-perimeter': ['square', 'root', 'times', 'fraction'],
  volume: ['cube', 'square', 'times', 'fraction'],
  measurement: ['times', 'divide', 'fraction'],
  'ratio-rate': ['colon', 'fraction', 'divide', 'times'],
  percentages: ['fraction', 'divide', 'times'],
};

export function getDomainSymbols(domain) {
  return DOMAIN_ANSWER_SYMBOLS[domain] || [];
}

// Build a skillId → friendly-name map from the domain's learning-path view so
// the result screen can show "Add decimals to 2 places" instead of "D4-NF-02".
// Memoised per domain; failures degrade gracefully to an empty map.
const skillNameCache = new Map();
export function getSkillNameMap(domain) {
  if (skillNameCache.has(domain)) return skillNameCache.get(domain);
  const map = new Map();
  const config = DOMAIN_PRACTICE_CONFIG[domain];
  try {
    const view = config?.buildView?.({ masteryRecords: [] });
    for (const strand of view?.strands || []) {
      for (const skill of strand.skills || []) {
        if (skill?.id) map.set(String(skill.id), skill.name || String(skill.id));
      }
    }
  } catch {
    // Skill graph unavailable — fall back to raw ids.
  }
  skillNameCache.set(domain, map);
  return map;
}

export function friendlySkillName(domain, skillId, fallback = '') {
  const name = getSkillNameMap(domain).get(String(skillId));
  return name || fallback || String(skillId || '');
}

// Turn a question prompt (which renders through <MathText>: KaTeX commands,
// $…$, a/b fractions, math symbols) into something a TTS engine reads naturally
// — and strip emoji so they aren't spoken literally. Used by the read-aloud
// button on the practice question screen.
export function toSpeakable(text = '') {
  return stripEmoji(
    String(text ?? '')
      // KaTeX / LaTeX noise → spoken words.
      .replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, ' $1 over $2 ')
      .replace(/\\times/g, ' times ')
      .replace(/\\div/g, ' divided by ')
      .replace(/\\cdot/g, ' times ')
      .replace(/\\square/g, ' square ')
      .replace(/\\%/g, ' percent ')
      .replace(/\\,/g, ' ')
      .replace(/\$/g, ' ')
      // a/b fraction notation → "a over b".
      .replace(/(\d+|\?)\s*\/\s*(\d+|\?)/g, '$1 over $2')
      // Bare math symbols → words.
      .replace(/[×]/g, ' times ')
      .replace(/[÷]/g, ' divided by ')
      .replace(/[−–]/g, ' minus ')
      .replace(/=/g, ' equals ')
      .replace(/%/g, ' percent ')
      .replace(/[²]/g, ' squared ')
      .replace(/[³]/g, ' cubed ')
      .replace(/\?/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}
