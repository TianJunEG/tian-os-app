import Question from '../../../models/Question.js';
import Skill from '../../../models/Skill.js';
import { isCorrectWithContext } from '../../../utils/answerCheck.js';
import { DIAGNOSTIC_DECISIONS } from '../../../utils/adaptiveDiagnosticDecisionEngine.js';

const DIAG_MODE_RANGES = {
  basic: ['F001', 'F005'],
  core: ['F001', 'F019'],
  full: ['F001', 'F026'],
};

const DIAG_COUNTS = {
  baseline: { basic: 10, core: 10, full: 12 },
  recheck: { basic: 12, core: 18, full: 24 },
  assigned: { basic: 12, core: 18, full: 24 },
};

const DIAG_PURPOSES = new Set(['baseline', 'recheck', 'assigned']);

export function normalizeLevelTag(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (/^P\d$/.test(upper)) return upper;
  const p = upper.match(/PRIMARY\s*(\d)/);
  if (p) return `P${p[1]}`;
  const s = upper.match(/SEC(ONDARY)?\s*(\d)/);
  if (s) return `Sec${s[2]}`;
  return raw;
}

function skillNum(id = '') {
  return Number(String(id).replace(/^F/i, '')) || 0;
}

function inSkillRange(id, [start, end]) {
  const n = skillNum(id);
  return n >= skillNum(start) && n <= skillNum(end);
}

function answerInputTypeFor(answer = '') {
  const raw = String(answer || '').trim();
  if (raw.includes(',') && /\d+\s*\/\s*\d+/.test(raw)) return 'ordering';
  if (/^-?\d+\s+\d+\s*\/\s*\d+$/.test(raw)) return 'mixed';
  if (/^-?\d+\s*\/\s*-?\d+$/.test(raw)) return 'fraction';
  if (/^-?\d+\.\d+$/.test(raw)) return 'decimal';
  if (/^-?\d+$/.test(raw)) return 'whole_number';
  return '';
}

function difficultyNumber(value = '') {
  const raw = String(value || '').toLowerCase();
  if (raw === 'easy') return 1;
  if (raw === 'medium') return 2;
  if (raw === 'hard') return 3;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function frameworkIdForSkill(skill = {}) {
  return String(skill.metadata?.mathPathSkillId || skill.metadata?.frameworkCode || skill.frameworkSkillId || '').toUpperCase();
}

function hasPrimaryLevelNegativeFractionQuestion(question = {}) {
  const text = `${question.stem || ''} ${question.answer || ''}`;
  return /\(\s*-\d+\s*\/\s*\d+\s*\)|-\d+\s*\/\s*\d+/.test(text);
}

function resolveDiagnosticCount(mode = 'core', purpose = 'baseline') {
  const p = DIAG_PURPOSES.has(String(purpose || '').toLowerCase())
    ? String(purpose || '').toLowerCase()
    : 'baseline';
  return DIAG_COUNTS[p]?.[mode] || DIAG_COUNTS.baseline[mode] || 10;
}

function normalizeDiagnosticModeForLevel(level = '', requested = '') {
  const explicit = String(requested || '').toLowerCase();
  if (['basic', 'core', 'full'].includes(explicit)) return explicit;
  const l = String(level || '').toUpperCase();
  if (l === 'P3' || l === 'P1' || l === 'P2') return 'basic';
  if (l === 'P4') return 'core';
  return 'full';
}

function genericSkillFromDoc(skill = {}) {
  const skillId = frameworkIdForSkill(skill) || String(skill._id || skill.skillId || '');
  return {
    skillId,
    id: skillId,
    dbSkillId: String(skill._id || ''),
    subjectId: 'math',
    domainId: 'fractions',
    name: skill.name || skillId,
    difficulty: Number(skill.metadata?.difficulty || skill.difficulty || skill.order || 1),
    prerequisiteSkillIds: (skill.prerequisiteSkillIds || skill.metadata?.prerequisiteSkillIds || [])
      .map((id) => String(id))
      .filter(Boolean),
    relatedSkillIds: (skill.relatedSkillIds || skill.metadata?.relatedSkillIds || []).map(String),
    diagnosticTags: skill.metadata?.diagnosticTags || [],
    commonErrorTags: skill.metadata?.commonErrorTags || skill.metadata?.misconceptions?.map((m) => m.tag).filter(Boolean) || [],
    masteryThreshold: Number(skill.metadata?.masteryThreshold || 0.8),
  };
}

function buildGenericSkillGraph(skills = []) {
  const objectIdToFramework = new Map(skills.map((skill) => [String(skill._id), frameworkIdForSkill(skill)]).filter(([, fid]) => fid));
  return skills.map((skill) => {
    const shaped = genericSkillFromDoc(skill);
    shaped.prerequisiteSkillIds = (skill.prerequisiteSkillIds || [])
      .map((id) => objectIdToFramework.get(String(id)) || String(id))
      .filter(Boolean);
    return shaped;
  });
}

function genericQuestionFromDoc(question = {}, skill = null) {
  const skillDoc = skill || question.skillId || {};
  const skillId = frameworkIdForSkill(skillDoc) || question.frameworkSkillId || question.officialSkillCode || '';
  return {
    questionId: String(question._id || question.questionId || ''),
    id: String(question._id || question.questionId || ''),
    skillId,
    domainId: 'fractions',
    difficulty: difficultyNumber(question.difficulty),
    questionType: question.type || question.questionType || '',
    responseType: answerInputTypeFor(question.answer),
    diagnosticPurpose: question.diagnosticPurpose || question.metadata?.diagnosticPurpose || question.questionCategory || 'main_skill_probe',
    prerequisiteSkillIdsTested: question.prerequisiteSkillIdsTested || question.metadata?.prerequisiteSkillIdsTested || [],
    errorTagsSupported: question.errorTagsSupported || question.commonMistakes || [question.misconceptionTag].filter(Boolean),
    canRephrase: Boolean(question.canRephrase || question.metadata?.canRephrase),
    hasParallelItem: question.hasParallelItem !== false,
    requiresWorking: question.requiresWorking !== false,
    questionFamilyId: question.questionFamilyId || `QF_${skillId || 'UNK'}_${String(question._id || '').slice(-4).toUpperCase()}`,
    stem: question.stem,
    prompt: question.stem,
    answer: question.answer,
    choices: question.choices || [],
    visual: question.visual || null,
    hasFigure: Boolean(question.hasFigure),
    figureUrl: question.figureUrl || '',
    figureAlt: question.figureAlt || '',
    raw: question,
  };
}

function normaliseQuestion(question = {}, skill = null, overrides = {}) {
  const generic = genericQuestionFromDoc(question, skill);
  return {
    questionId: generic.questionId,
    skillId: generic.skillId,
    questionFamilyId: generic.questionFamilyId,
    prompt: overrides.prompt || question.stem || question.prompt || '',
    type: question.type,
    choices: question.choices || [],
    visual: question.visual || null,
    hasFigure: Boolean(question.hasFigure),
    figureUrl: question.figureUrl || '',
    figureAlt: question.figureAlt || '',
    answerInputType: answerInputTypeFor(question.answer),
    workingRequired: question.requiresWorking !== false,
    isRephrase: Boolean(overrides.isRephrase),
  };
}

function supportiveCopyForDecision(decisionType = '') {
  const map = {
    [DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE]: 'Try a simpler step.',
    [DIAGNOSTIC_DECISIONS.SAME_LEVEL_CONFIRMATION]: 'Try one more similar question.',
    [DIAGNOSTIC_DECISIONS.MISCONCEPTION_PROBE]: 'Try a different approach.',
    [DIAGNOSTIC_DECISIONS.STOP_AND_ASSIGN_PRACTICE]: 'This tells us what to practise next.',
    [DIAGNOSTIC_DECISIONS.MARK_SECURE]: 'Good, this skill looks secure.',
    [DIAGNOSTIC_DECISIONS.MARK_FRAGILE]: 'Good. Confirming this skill carefully.',
    [DIAGNOSTIC_DECISIONS.MOVE_UP]: 'Good. Move to the next step.',
    [DIAGNOSTIC_DECISIONS.STEP_DOWN]: 'This helps us find the right starting point.',
    [DIAGNOSTIC_DECISIONS.REPHRASE_ONCE]: 'Read this one in a different way.',
    [DIAGNOSTIC_DECISIONS.ASSIGN_REMEDIATION]: 'This tells us what to practise next.',
  };
  return map[decisionType] || 'This helps us find what to practise next.';
}

async function loadSkills() {
  const skills = await Skill.find({ slug: /^fr\./i }).sort({ order: 1 });
  const byFrameworkId = new Map();
  const byObjectId = new Map();
  for (const skill of skills) {
    const fid = frameworkIdForSkill(skill);
    if (fid) byFrameworkId.set(fid, skill);
    byObjectId.set(String(skill._id), skill);
  }
  return { skills, byFrameworkId, byObjectId };
}

function selectTargetSkills({ skills = [], mode = 'core' }) {
  const [rangeStart, rangeEnd] = DIAG_MODE_RANGES[mode] || DIAG_MODE_RANGES.core;
  return skills
    .filter((skill) => {
      const fid = frameworkIdForSkill(skill);
      return fid && inSkillRange(fid, [rangeStart, rangeEnd]);
    })
    .sort((a, b) => skillNum(frameworkIdForSkill(a)) - skillNum(frameworkIdForSkill(b)));
}

async function selectInitialQuestions({ targetSkills = [], count = 10, studentLevel = '' }) {
  const sampleSize = Math.max(count * 3, Math.min(count + 16, 48));
  let questions = await Question.aggregate([
    {
      $match: {
        skillId: { $in: targetSkills.map((skill) => skill._id) },
        $or: [
          { questionCategory: { $exists: false } },
          { questionCategory: null },
          { questionCategory: '' },
          { questionCategory: 'diagnostic' },
        ],
      },
    },
    { $sample: { size: sampleSize } },
  ]);
  if (/^P[1-6]$/i.test(studentLevel || '')) {
    questions = questions.filter((q) => !hasPrimaryLevelNegativeFractionQuestion(q));
  }
  const selected = [];
  const seenFamilies = new Set();
  const seenStems = new Set();
  for (const q of questions) {
    const familyKey = String(q.questionFamilyId || q.stem || q._id);
    const stemKey = String(q.stem || '').trim().toLowerCase();
    if (seenFamilies.has(familyKey) || seenStems.has(stemKey)) continue;
    seenFamilies.add(familyKey);
    seenStems.add(stemKey);
    selected.push(q);
    if (selected.length >= count) break;
  }
  if (selected.length < count) {
    for (const q of questions) {
      if (selected.some((picked) => String(picked._id) === String(q._id))) continue;
      selected.push(q);
      if (selected.length >= count) break;
    }
  }
  return selected.slice(0, count);
}

async function getQuestionById(questionId) {
  return Question.findById(questionId).populate('skillId');
}

async function getQuestionBank({ targetSkillIds = [] }) {
  const { byFrameworkId } = await loadSkills();
  const targetSkills = targetSkillIds.map((id) => byFrameworkId.get(String(id).toUpperCase())).filter(Boolean);
  const docs = await Question.find({
    skillId: { $in: targetSkills.map((skill) => skill._id) },
    $or: [
      { questionCategory: { $exists: false } },
      { questionCategory: null },
      { questionCategory: '' },
      { questionCategory: 'diagnostic' },
    ],
  });
  const skillByDbId = new Map(targetSkills.map((skill) => [String(skill._id), skill]));
  return {
    docs,
    skillsByFrameworkId: byFrameworkId,
    skillByDbId,
    bank: docs.map((doc) => genericQuestionFromDoc(doc, skillByDbId.get(String(doc.skillId)))),
  };
}

function scoreAnswer(question, response = {}) {
  if (response.skipped || response.blankAnswer) return false;
  return isCorrectWithContext(String(response.answer ?? response.studentAnswer ?? ''), question.answer, question.stem);
}

function detectErrorTags(question, response = {}, correct = false) {
  if (correct) return [];
  return [
    ...(Array.isArray(response.detectedErrorTags) ? response.detectedErrorTags : []),
    question.misconceptionTag,
    ...(question.commonMistakes || []),
  ].filter(Boolean);
}

function buildResult({ session, responses, decisionHistory, readinessScore, assignedPracticeSkillIds, skillsByFrameworkId }) {
  const correctCount = responses.filter((r) => r.correct).length;
  const answered = responses.filter((r) => !r.skipped && !r.blankAnswer).length;
  const weakSkillIds = [...new Set(responses.filter((r) => !r.correct).map((r) => r.skillId).filter(Boolean))];
  const secureSkillIds = [...new Set(decisionHistory
    .filter((d) => d.decisionType === DIAGNOSTIC_DECISIONS.MARK_SECURE || d.decisionType === DIAGNOSTIC_DECISIONS.MOVE_UP)
    .map((d) => d.currentSkillId)
    .filter(Boolean))];
  const recommendedSkillId = assignedPracticeSkillIds[0] || weakSkillIds[0] || session.currentSkillId || session.targetSkillIds?.[0] || '';
  const recommendedSkill = skillsByFrameworkId?.get(String(recommendedSkillId).toUpperCase());
  return {
    ...(session.result || {}),
    adaptive: true,
    readinessBand: readinessScore >= 80 ? 'ready' : readinessScore >= 55 ? 'progressing' : 'developing',
    readinessScore,
    overallFractionReadinessScore: readinessScore,
    questionsCorrect: correctCount,
    questionsAnswered: answered,
    totalQuestions: responses.length,
    masteredSkills: secureSkillIds.map((id) => ({ skillId: id, name: skillsByFrameworkId?.get(String(id).toUpperCase())?.name || id })),
    weakSkills: weakSkillIds.map((id) => ({ skillId: id, name: skillsByFrameworkId?.get(String(id).toUpperCase())?.name || id })),
    recommendedStartingSkill: {
      skillId: recommendedSkillId,
      name: recommendedSkill?.name || recommendedSkillId,
      slug: recommendedSkill?.slug || '',
    },
    recommendedStartingSkillName: recommendedSkill?.name || recommendedSkillId,
    recommendedStartingTopic: 'Fractions',
    assignedPracticeSkillIds,
    decisionHistory,
    diagnosticCompleted: true,
    diagnosticCompletedAt: new Date().toISOString(),
    nextPracticePayload: {
      skillId: recommendedSkillId,
      source: 'adaptive-diagnostic',
      mode: session.mode,
      questionCount: 8,
    },
  };
}

const fractionsDiagnosticDomain = {
  subjectId: 'math',
  domainId: 'fractions',
  domainVersion: 'v1',
  displayName: 'Fractions',
  defaultStartSkillIds: ['F001'],
  fallbackSkillId: 'F001',
  scoringConfig: {
    readinessScoreField: 'overallFractionReadinessScore',
  },
  normalizeLevelTag,
  normalizeDiagnosticModeForLevel,
  resolveDiagnosticCount,
  loadSkills,
  buildSkillGraph: buildGenericSkillGraph,
  selectTargetSkills,
  selectInitialQuestions,
  getQuestionById,
  getQuestionBank,
  normaliseQuestion,
  normalizeQuestion: normaliseQuestion,
  toGenericQuestion: genericQuestionFromDoc,
  scoreAnswer,
  detectErrorTags,
  buildResult,
  getSupportiveCopy: supportiveCopyForDecision,
};

export default fractionsDiagnosticDomain;
