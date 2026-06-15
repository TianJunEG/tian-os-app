// Generic diagnostic adapter factory. Takes a slug-based skill graph
// (scripts/domains/*.js shape) + config and returns a fully-wired diagnostic
// domain object that satisfies the registry contract:
//   normaliseQuestion · scoreAnswer · detectErrorTags · buildResult · getSupportiveCopy
//   loadSkills · selectTargetSkills · selectInitialQuestions
//   getQuestionBank · getQuestionById · resolveDiagnosticCount
//
// The adapter is DB-free: skills come from the in-memory graph and questions
// are produced by genericQuestionGenerator. This mirrors the Decimals pattern
// so the same adaptive decision engine drives all slug-based domains.
//
// Usage:
//   import { createDiagnosticDomain } from './genericDiagnosticAdapterFactory.js';
//   import fooSkills from '../../scripts/domains/foo.js';
//   export default createDiagnosticDomain({
//     domainId: 'foo', displayName: 'Foo', subjectId: 'math',
//     skills: fooSkills.skills, fallbackSkillId: 'foo.first-skill',
//   });

import { isCorrectWithContext } from '../../utils/answerCheck.js';
import { DIAGNOSTIC_DECISIONS } from '../mathpath/diagnosticDecisionEngine.js';
import { generateQuestionsForSkill, generateQuestion, isGeneratable } from '../../shared/mathpath/genericQuestionGenerator.js';

// Mode → which Singapore Primary levels to include
const MODE_LEVELS = {
  basic: new Set(['Primary 1', 'Primary 2', 'Primary 3']),
  core:  new Set(['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5']),
  full:  null,   // null = all levels
};

const SUPPORTIVE_COPY = {
  [DIAGNOSTIC_DECISIONS.MOVE_UP]:                'Great — let\'s try something a little harder.',
  [DIAGNOSTIC_DECISIONS.SAME_LEVEL_CONFIRMATION]:'Nice. One more like that to be sure.',
  [DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE]:     'Let\'s check a skill this builds on.',
  [DIAGNOSTIC_DECISIONS.MISCONCEPTION_PROBE]:    'Let\'s look at that idea another way.',
  [DIAGNOSTIC_DECISIONS.STEP_DOWN]:              'Let\'s step back to something more familiar.',
  [DIAGNOSTIC_DECISIONS.MARK_SECURE]:            'You\'ve got this one solid.',
  [DIAGNOSTIC_DECISIONS.MARK_FRAGILE]:           'Good. Confirming this skill carefully.',
  [DIAGNOSTIC_DECISIONS.REPHRASE_ONCE]:          'Read this one in a different way.',
  [DIAGNOSTIC_DECISIONS.STOP_AND_ASSIGN_PRACTICE]: 'This tells us what to practise next.',
  [DIAGNOSTIC_DECISIONS.ASSIGN_REMEDIATION]:     'This tells us what to practise next.',
};

// ── Skill shaping ─────────────────────────────────────────────────────────────
// Convert a seed-file skill (slug-based) to the shape the decision engine needs.
function shapeSkill(skill, index, domainId, subjectId) {
  return {
    skillId:              skill.slug,
    id:                   skill.slug,
    slug:                 skill.slug,
    name:                 skill.name,
    subjectId,
    domainId,
    difficulty:           index + 1,      // 1-based ordinal from definition order
    singaporeLevel:       skill.level ? [skill.level] : [],
    prerequisiteSkillIds: Array.isArray(skill.prerequisites) ? [...skill.prerequisites] : [],
    relatedSkillIds:      [],
    diagnosticTags:       [],
    commonErrorTags:      (skill.misconceptions || []).map((m) => m.tag).filter(Boolean),
    masteryThreshold:     0.8,
    // Keep original for question generation
    _original:            skill,
  };
}

// ── Factory ───────────────────────────────────────────────────────────────────
export function createDiagnosticDomain(config = {}) {
  const {
    domainId,
    displayName,
    subjectId = 'math',
    skills: rawSkills = [],
    fallbackSkillId,
    defaultStartSkillIds,
    domainVersion = 'v0.1',
  } = config;

  if (!domainId) throw new Error('createDiagnosticDomain: domainId is required');

  // Build in-memory skill maps once at module load time
  const shapedSkills = rawSkills.map((s, i) => shapeSkill(s, i, domainId, subjectId));
  const bySlug = new Map(shapedSkills.map((s) => [s.skillId, s]));
  // Also index by original (for lookup via prerequisite slug chains)
  const originalBySlug = new Map(rawSkills.map((s) => [s.slug, s]));

  const _defaultStart = defaultStartSkillIds ?? (rawSkills[0] ? [rawSkills[0].slug] : []);
  const _fallback = fallbackSkillId ?? _defaultStart[0] ?? '';

  // Pre-generate a question bank (3 per generatable skill) at create time
  // so getQuestionBank() is synchronous and fast.
  const bankMap = new Map();  // slug → question[]
  for (const orig of rawSkills) {
    const questions = generateQuestionsForSkill({ ...orig, domainId }, 3);
    if (questions.length) bankMap.set(orig.slug, questions);
  }

  // ── Public methods ──────────────────────────────────────────────────────────

  function buildSkillGraph() {
    return shapedSkills;
  }

  function loadSkills() {
    return { skills: shapedSkills, byFrameworkId: bySlug };
  }

  function resolveDiagnosticCount(mode = 'core') {
    switch (String(mode).toLowerCase()) {
      case 'basic': return 6;
      case 'full':  return 12;
      default:      return 8;   // core
    }
  }

  function normalizeDiagnosticModeForLevel(level = '', requested = '') {
    const explicit = String(requested || '').toLowerCase();
    if (['basic', 'core', 'full'].includes(explicit)) return explicit;
    const l = String(level || '').toUpperCase();
    if (l === 'P1' || l === 'P2' || l === 'P3') return 'basic';
    if (l === 'P4') return 'core';
    return 'full';
  }

  function selectTargetSkills({ skills = [], mode = 'core' } = {}) {
    const allowed = MODE_LEVELS[mode] ?? null;
    return skills.filter((s) => {
      if (!allowed) return true;
      return (s._original?.level ? allowed.has(s._original.level) : true);
    });
  }

  function selectInitialQuestions({ targetSkills = [], count = 8 } = {}) {
    const pool = targetSkills.filter((s) => bankMap.has(s.skillId));
    if (!pool.length) return [];
    const n = Math.min(count, pool.length);
    const step = pool.length / n;
    const out = [];
    for (let i = 0; i < n; i++) {
      const skill = pool[Math.floor(i * step)];
      const qs = bankMap.get(skill.skillId) || [];
      if (qs[0]) out.push(qs[0]);
    }
    return out;
  }

  function getQuestionBank({ targetSkillIds = [], perSkill = 3 } = {}) {
    const ids = targetSkillIds.length ? targetSkillIds : [...bySlug.keys()];
    const bank = [];
    for (const slug of ids) {
      const orig = originalBySlug.get(slug);
      if (!orig) continue;
      const qs = generateQuestionsForSkill({ ...orig, domainId }, perSkill);
      bank.push(...qs);
    }
    const skillByDbId = new Map(ids.map((id) => [id, bySlug.get(id)]).filter(([, v]) => v));
    return { docs: bank, bank, skillByDbId, skillsByFrameworkId: bySlug };
  }

  function getQuestionById(questionId) {
    // Question IDs are `{slug}__q{variant}`
    const m = /^(.+)__q(\d+)$/.exec(String(questionId || ''));
    if (!m) return null;
    const [, slug, variantStr] = m;
    const orig = originalBySlug.get(slug);
    if (!orig) return null;
    const variant = parseInt(variantStr, 10);
    const templates = (orig.questionStructures || []).filter(isGeneratable);
    if (!templates.length) return null;
    const tmpl = templates[variant % templates.length];
    return generateQuestion(tmpl, { ...orig, domainId }, variant);
  }

  function toGenericQuestion(q = {}) {
    return q.skillId ? q : { ...q, skillId: q.slug || '' };
  }

  function normaliseQuestion(question = {}) {
    return {
      questionId:      question.questionId || question.id,
      skillId:         question.skillId,
      questionFamilyId:question.questionFamilyId,
      prompt:          question.prompt || question.stem || '',
      type:            question.questionType || question.type || 'short_answer',
      choices:         question.choices || [],
      answer:          question.answer,
    };
  }

  function scoreAnswer(question, response = {}) {
    if (response.skipped || response.blankAnswer) return false;
    const student = String(response.answer ?? response.studentAnswer ?? '').trim();
    const correct = String(question.answer ?? '').trim();
    return isCorrectWithContext(student, correct, question.stem || question.prompt || '');
  }

  function detectErrorTags(question, response = {}, correct = false) {
    if (correct) return [];
    return [
      ...(Array.isArray(response.detectedErrorTags) ? response.detectedErrorTags : []),
      question.misconceptionTag,
      ...(question.errorTagsSupported || []),
    ].filter(Boolean);
  }

  function buildResult({ session = {}, responses = [], decisionHistory = [], readinessScore = 0, assignedPracticeSkillIds = [] }) {
    const correctCount = responses.filter((r) => r.correct).length;
    const answered = responses.filter((r) => !r.skipped && !r.blankAnswer).length;
    const weakSkillIds = [...new Set(responses.filter((r) => !r.correct).map((r) => r.skillId).filter(Boolean))];
    const secureSkillIds = [...new Set(
      decisionHistory
        .filter((d) => d.decisionType === DIAGNOSTIC_DECISIONS.MARK_SECURE || d.decisionType === DIAGNOSTIC_DECISIONS.MOVE_UP)
        .map((d) => d.currentSkillId)
        .filter(Boolean),
    )];
    const recommendedSkillId = assignedPracticeSkillIds[0] || weakSkillIds[0] || session.currentSkillId || _defaultStart[0] || _fallback;
    const nameFor = (id) => bySlug.get(id)?.name || id;
    return {
      adaptive: true,
      domainId,
      readinessBand: readinessScore >= 80 ? 'ready' : readinessScore >= 55 ? 'progressing' : 'developing',
      readinessScore,
      questionsCorrect:  correctCount,
      questionsAnswered: answered,
      totalQuestions:    responses.length,
      masteredSkills:    secureSkillIds.map((id) => ({ skillId: id, name: nameFor(id) })),
      weakSkills:        weakSkillIds.map((id) => ({ skillId: id, name: nameFor(id) })),
      recommendedStartingSkill:   { skillId: recommendedSkillId, name: nameFor(recommendedSkillId) },
      recommendedStartingSkillId: recommendedSkillId,
      recommendedStartingTopic:   displayName,
      assignedPracticeSkillIds,
      decisionHistory,
      diagnosticCompleted: true,
      nextPracticePayload: {
        skillId:       recommendedSkillId,
        source:        'adaptive-diagnostic',
        mode:          session.mode || 'baseline',
        questionCount: 6,
      },
    };
  }

  function getSupportiveCopy(decision = {}) {
    return SUPPORTIVE_COPY[decision.decisionType] || 'Keep going — you\'re doing well.';
  }

  // ── Domain object ───────────────────────────────────────────────────────────
  return {
    subjectId,
    domainId,
    domainVersion,
    displayName,
    defaultStartSkillIds: _defaultStart,
    fallbackSkillId: _fallback,
    // Runtime methods
    buildSkillGraph,
    loadSkills,
    resolveDiagnosticCount,
    normalizeDiagnosticModeForLevel,
    selectTargetSkills,
    selectInitialQuestions,
    getQuestionBank,
    getQuestionById,
    toGenericQuestion,
    normaliseQuestion,
    normalizeQuestion: normaliseQuestion,
    scoreAnswer,
    detectErrorTags,
    buildResult,
    getSupportiveCopy,
  };
}
