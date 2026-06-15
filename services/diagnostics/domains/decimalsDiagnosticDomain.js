import { DIAGNOSTIC_DECISIONS } from '../../mathpath/diagnosticDecisionEngine.js';
import { decimalsSkillGraph, getSkill } from '../../../shared/mathpath/decimals/decimalsSkillGraph.js';
import { getQuestionFamiliesBySkill } from '../../../shared/mathpath/decimals/decimalsQuestionFamilies.js';
import {
  generateDecimalQuestion,
  checkDecimalAnswer,
} from '../../../shared/mathpath/decimals/decimalsQuestionGenerator.js';

// Decimals diagnostic domain. Unlike the Fractions domain (which pulls authored
// questions from MongoDB), Decimals is DB-free: the skill graph comes from the
// shared decimals graph and the question bank is produced by the rule-based
// generator. It conforms to the same registry contract so the generic adaptive
// engine (decideNextDiagnosticStep / selectNextDiagnosticQuestion) drives it
// without any decimals-specific branching.

const DOMAIN_ID = 'decimals';
const DISPLAY_NAME = 'Decimals';

// ── Skill graph (generic shape the decision engine consumes) ────────────────
function genericSkill(skill) {
  return {
    skillId: skill.id,
    id: skill.id,
    subjectId: 'math',
    domainId: DOMAIN_ID,
    name: skill.name,
    difficulty: Number(skill.difficulty || 1),
    prerequisiteSkillIds: [...(skill.prerequisites || [])],
    relatedSkillIds: [],
    diagnosticTags: [],
    commonErrorTags: [...(skill.misconceptions || [])],
    masteryThreshold: 0.8,
    singaporeLevel: skill.singaporeLevel || [],
  };
}

// DB-free: ignores any passed-in docs and builds from the shared graph.
export function buildSkillGraph() {
  return decimalsSkillGraph.skills.map(genericSkill);
}

const skillsByFrameworkId = new Map(decimalsSkillGraph.skills.map((s) => [s.id, genericSkill(s)]));

// ── Question bank (generator-backed, round-trippable ids) ───────────────────
// A diagnostic question id encodes its (family, variant) so getQuestionById can
// regenerate the EXACT item deterministically — the runtime fetches the current
// question by id on each answer, and there is no DB to read it back from.
const QID_RE = /^(.+)__v(\d+)$/;

function rawQuestionFor(familyId, variant) {
  const q = generateDecimalQuestion({ questionFamilyId: familyId, variant, mode: 'diagnostic' });
  return { ...q, questionId: `${familyId}__v${variant}`, variant };
}

function genericQuestion(raw) {
  return {
    questionId: raw.questionId,
    id: raw.questionId,
    skillId: raw.skillId,
    domainId: DOMAIN_ID,
    difficulty: Number(raw.difficulty || 1),
    questionType: raw.type,
    responseType: raw.type === 'mcq' ? 'mcq' : 'short_answer',
    diagnosticPurpose: 'main_skill_probe',
    prerequisiteSkillIdsTested: [],
    errorTagsSupported: [raw.misconceptionTag].filter(Boolean),
    canRephrase: false,
    hasParallelItem: true,
    requiresWorking: Boolean(raw.workingRequired),
    questionFamilyId: raw.questionFamilyId,
    stem: raw.prompt,
    prompt: raw.prompt,
    answer: raw.answer,
    choices: raw.choices || [],
    raw,
  };
}

// Mirrors generateDecimalQuestionSet's family/variant cycling so the bank keeps
// `perSkill` items per skill but with deterministic, round-trippable ids.
function rawQuestionsForSkill(skillId, count) {
  const families = getQuestionFamiliesBySkill(skillId).map((f) => f.id);
  if (!families.length) return [];
  return Array.from({ length: count }, (_, i) => rawQuestionFor(families[i % families.length], Math.floor(i / families.length)));
}

// Returns the runtime-compatible bank shape. `perSkill` controls how many probe
// items each target skill contributes.
export function getQuestionBank({ targetSkillIds = [], perSkill = 3 } = {}) {
  const ids = (targetSkillIds.length ? targetSkillIds : decimalsSkillGraph.skillIds).filter((id) => getSkill(id));
  const bank = [];
  for (const skillId of ids) {
    for (const raw of rawQuestionsForSkill(skillId, perSkill)) bank.push(genericQuestion(raw));
  }
  const skillByDbId = new Map(ids.map((id) => [id, skillsByFrameworkId.get(id)]));
  return { docs: bank, bank, skillByDbId, skillsByFrameworkId };
}

// Regenerate a question from its id (deterministic; no DB lookup).
export function getQuestionById(questionId) {
  const m = QID_RE.exec(String(questionId || ''));
  if (!m) return null;
  const [, familyId, variant] = m;
  try {
    return rawQuestionFor(familyId, Number(variant));
  } catch {
    return null;
  }
}

export function toGenericQuestion(question = {}) {
  // Accept a raw generator question or an already-generic one.
  const raw = question.raw || question;
  return genericQuestion(raw.questionId ? raw : { ...raw, questionId: question.questionId });
}

// ── Runtime methods (DB-free) ───────────────────────────────────────────────
export function resolveDiagnosticCount(mode = 'core') {
  return String(mode).toLowerCase() === 'quick' ? 5 : 8;
}

// The runtime calls loadSkills then buildSkillGraph(skills); both DB-free here.
export function loadSkills() {
  const skills = buildSkillGraph();
  const byFrameworkId = new Map(skills.map((s) => [s.skillId, s]));
  return { skills, byFrameworkId };
}

// Pick a breadth-spanning set of skills (sorted by difficulty) for the probe.
export function selectTargetSkills({ skills = [], startSkillId = '' } = {}) {
  const ordered = [...skills].sort((a, b) => (a.difficulty - b.difficulty) || a.skillId.localeCompare(b.skillId));
  if (startSkillId) {
    const start = ordered.find((s) => s.skillId === startSkillId);
    if (start) return [start, ...ordered.filter((s) => s.skillId !== startSkillId)];
  }
  return ordered;
}

// One question per evenly-sampled target skill, up to `count`.
export function selectInitialQuestions({ targetSkills = [], count = 8 } = {}) {
  const pool = targetSkills.filter((s) => getQuestionFamiliesBySkill(s.skillId).length);
  if (!pool.length) return [];
  const n = Math.min(count, pool.length);
  const step = pool.length / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    const skill = pool[Math.floor(i * step)];
    const familyId = getQuestionFamiliesBySkill(skill.skillId)[0].id;
    out.push(rawQuestionFor(familyId, 0));
  }
  return out;
}

export function normaliseQuestion(question = {}) {
  return {
    questionId: question.questionId,
    skillId: question.skillId,
    questionFamilyId: question.questionFamilyId,
    prompt: question.prompt || question.stem || '',
    type: question.questionType || question.type,
    choices: question.choices || [],
    answer: question.answer,
  };
}

// ── Scoring / error detection ───────────────────────────────────────────────
export function scoreAnswer(question, response = {}) {
  if (response.skipped || response.blankAnswer) return false;
  const q = question.raw || question;
  return checkDecimalAnswer({ question: q, studentResponse: response.answer ?? response.studentAnswer ?? '' }).correct;
}

export function detectErrorTags(question, response = {}, correct = false) {
  if (correct) return [];
  return [
    ...(Array.isArray(response.detectedErrorTags) ? response.detectedErrorTags : []),
    ...((question.errorTagsSupported) || []),
    question.raw?.misconceptionTag,
  ].filter(Boolean);
}

// ── Result ──────────────────────────────────────────────────────────────────
export function buildResult({ session = {}, responses = [], decisionHistory = [], readinessScore = 0, assignedPracticeSkillIds = [] }) {
  const correctCount = responses.filter((r) => r.correct).length;
  const answered = responses.filter((r) => !r.skipped && !r.blankAnswer).length;
  const weakSkillIds = [...new Set(responses.filter((r) => !r.correct).map((r) => r.skillId).filter(Boolean))];
  const secureSkillIds = [...new Set(decisionHistory
    .filter((d) => d.decisionType === DIAGNOSTIC_DECISIONS.MARK_SECURE || d.decisionType === DIAGNOSTIC_DECISIONS.MOVE_UP)
    .map((d) => d.currentSkillId)
    .filter(Boolean))];
  const recommendedSkillId = assignedPracticeSkillIds[0] || weakSkillIds[0] || session.currentSkillId || session.targetSkillIds?.[0] || 'D001';
  const nameFor = (id) => skillsByFrameworkId.get(id)?.name || id;
  return {
    adaptive: true,
    domainId: DOMAIN_ID,
    readinessBand: readinessScore >= 80 ? 'ready' : readinessScore >= 55 ? 'progressing' : 'developing',
    readinessScore,
    questionsCorrect: correctCount,
    questionsAnswered: answered,
    totalQuestions: responses.length,
    masteredSkills: secureSkillIds.map((id) => ({ skillId: id, name: nameFor(id) })),
    weakSkills: weakSkillIds.map((id) => ({ skillId: id, name: nameFor(id) })),
    recommendedStartingSkill: { skillId: recommendedSkillId, name: nameFor(recommendedSkillId) },
    recommendedStartingSkillId: recommendedSkillId,
    recommendedStartingTopic: DISPLAY_NAME,
    assignedPracticeSkillIds,
    decisionHistory,
    diagnosticCompleted: true,
    nextPracticePayload: { skillId: recommendedSkillId, source: 'adaptive-diagnostic', mode: session.mode || 'baseline', questionCount: 6 },
  };
}

const SUPPORTIVE_COPY = {
  [DIAGNOSTIC_DECISIONS.MOVE_UP]: 'Great — let\'s try something a little harder.',
  [DIAGNOSTIC_DECISIONS.SAME_LEVEL_CONFIRMATION]: 'Nice. One more like that to be sure.',
  [DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE]: 'Let\'s check a skill this builds on.',
  [DIAGNOSTIC_DECISIONS.MISCONCEPTION_PROBE]: 'Let\'s look at that idea another way.',
  [DIAGNOSTIC_DECISIONS.STEP_DOWN]: 'Let\'s step back to something more familiar.',
  [DIAGNOSTIC_DECISIONS.MARK_SECURE]: 'You\'ve got this one solid.',
};

export function getSupportiveCopy(decision = {}) {
  return SUPPORTIVE_COPY[decision.decisionType] || 'Keep going — you\'re doing well.';
}

const decimalsDiagnosticDomain = {
  subjectId: 'math',
  domainId: DOMAIN_ID,
  domainVersion: 'v1',
  displayName: DISPLAY_NAME,
  defaultStartSkillIds: ['D001'],
  fallbackSkillId: 'D001',
  buildSkillGraph,
  loadSkills,
  selectTargetSkills,
  selectInitialQuestions,
  resolveDiagnosticCount,
  getQuestionBank,
  getQuestionById,
  normaliseQuestion,
  normalizeQuestion: normaliseQuestion,
  toGenericQuestion,
  scoreAnswer,
  detectErrorTags,
  buildResult,
  getSupportiveCopy,
};

export default decimalsDiagnosticDomain;
