// EarlyNumeracy (K2) diagnostic adapter. Custom rather than generic-factory-built
// because EarlyNumeracy skills carry `questionFamilies` and have their own
// generator (generateEarlyNumeracyQuestionSet) rather than the
// metadata.questionStructures shape the generic factory consumes. The adapter
// satisfies the same contract every other domain meets (loadSkills,
// selectTargetSkills, selectInitialQuestions, getQuestionBank, getQuestionById,
// normaliseQuestion, scoreAnswer, detectErrorTags, buildResult,
// getSupportiveCopy, resolveDiagnosticCount, normalizeDiagnosticModeForLevel)
// so the same runtime (services/diagnostics/diagnosticRuntime.js) drives it.

import { earlyNumeracySkillGraph } from '../../../shared/mathpath/earlyNumeracy/EarlyNumeracySkillGraph.js';
import {
  generateEarlyNumeracyQuestionSet,
  checkEarlyNumeracyAnswer,
} from '../../../shared/mathpath/earlyNumeracy/EarlyNumeracyQuestionGenerator.js';
import { DIAGNOSTIC_DECISIONS } from '../../mathpath/diagnosticDecisionEngine.js';

const SUBJECT_ID = 'math';
const DOMAIN_ID = 'early_numeracy';
const DISPLAY_NAME = 'Numeracy';
const STATIC_SALT = 'en-diag';

const SUPPORTIVE_COPY = {
  [DIAGNOSTIC_DECISIONS.MOVE_UP]:                  "Nice — let's try one a bit harder.",
  [DIAGNOSTIC_DECISIONS.SAME_LEVEL_CONFIRMATION]:  'Good. One more like that to be sure.',
  [DIAGNOSTIC_DECISIONS.PREREQUISITE_PROBE]:       "Let's check a skill this builds on.",
  [DIAGNOSTIC_DECISIONS.MISCONCEPTION_PROBE]:      "Let's look at that idea another way.",
  [DIAGNOSTIC_DECISIONS.STEP_DOWN]:                "Let's go back to something more familiar.",
  [DIAGNOSTIC_DECISIONS.MARK_SECURE]:              "You've got this one!",
  [DIAGNOSTIC_DECISIONS.MARK_FRAGILE]:             'Good. Just checking this carefully.',
  [DIAGNOSTIC_DECISIONS.REPHRASE_ONCE]:            "Let's read it again.",
  [DIAGNOSTIC_DECISIONS.STOP_AND_ASSIGN_PRACTICE]: "Let's practise this next.",
  [DIAGNOSTIC_DECISIONS.ASSIGN_REMEDIATION]:       "Let's practise this next.",
};

const ALL_LEVELS = new Set(['K2', 'Primary 1', 'Primary 2']);
const MODE_LEVELS = {
  basic: new Set(['K2']),
  core: new Set(['K2', 'Primary 1']),
  full: null,
};

const rawSkills = earlyNumeracySkillGraph.skills || [];

// Build the lookups used by the runtime. Skills externally key by SLUG (matching
// every other diagnostic domain); the EN id (e.g. 'EN001') is kept on the shaped
// skill as `enId` because that's what the EarlyNumeracy generator needs.
function shapeSkill(skill, index) {
  return {
    skillId:              skill.slug,
    id:                   skill.slug,
    slug:                 skill.slug,
    enId:                 skill.id,
    name:                 skill.name,
    subjectId:            SUBJECT_ID,
    domainId:             DOMAIN_ID,
    difficulty:           index + 1,
    singaporeLevel:       Array.isArray(skill.singaporeLevel) ? skill.singaporeLevel : [],
    // Map prerequisites (EN ids) to slugs so the contract matches every other domain.
    prerequisiteSkillIds: (skill.prerequisites || []).map((preId) => {
      const found = rawSkills.find((s) => s.id === preId);
      return found ? found.slug : String(preId);
    }),
    relatedSkillIds:      [],
    diagnosticTags:       [],
    commonErrorTags:      Array.isArray(skill.misconceptions) ? [...skill.misconceptions] : [],
    masteryThreshold:     (skill.mastery?.minimumAccuracy ?? 70) / 100,
    _original:            skill,
  };
}

const shapedSkills = rawSkills.map(shapeSkill);
const bySlug = new Map(shapedSkills.map((s) => [s.skillId, s]));
const enIdToSlug = new Map(shapedSkills.map((s) => [s.enId, s.skillId]));
const slugToEnId = new Map(shapedSkills.map((s) => [s.skillId, s.enId]));
const FALLBACK = rawSkills[0]?.slug || '';

// Pre-build a question bank so getQuestionBank is synchronous. Static salt
// guarantees the same (slug, variant) yields the same question — needed for
// getQuestionById deterministic replay.
const PER_SKILL = 3;
const bankBySlug = new Map();
for (const s of shapedSkills) {
  try {
    const generated = generateEarlyNumeracyQuestionSet({
      skillId: s.enId,
      count: PER_SKILL,
      sessionSalt: STATIC_SALT,
    });
    const withIds = generated.map((q, variant) => normaliseGenerated(q, s.skillId, variant));
    if (withIds.length) bankBySlug.set(s.skillId, withIds);
  } catch { /* skill has no generator yet → simply not surfaceable in diagnostic */ }
}

function normaliseGenerated(q, slug, variant) {
  return {
    ...q,
    questionId: `${slug}__q${variant}`,
    id:         `${slug}__q${variant}`,
    skillId:    slug,
  };
}

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
    default:      return 8; // core
  }
}

function normalizeDiagnosticModeForLevel(level = '', requested = '') {
  const explicit = String(requested || '').toLowerCase();
  if (['basic', 'core', 'full'].includes(explicit)) return explicit;
  const l = String(level || '').toUpperCase().trim();
  if (l === 'K2' || l === 'K1' || l.includes('KINDER') || l.includes('PRESCHOOL')) return 'basic';
  if (l === 'P1' || l === 'PRIMARY 1') return 'core';
  return 'full';
}

function selectTargetSkills({ skills = [], mode = 'core' } = {}) {
  const allowed = MODE_LEVELS[mode] ?? null;
  return skills.filter((s) => {
    if (!allowed) return true;
    const levels = s._original?.singaporeLevel || s.singaporeLevel || [];
    if (!levels.length) return true;
    return levels.some((lvl) => allowed.has(lvl) || ALL_LEVELS.has(lvl));
  });
}

function selectInitialQuestions({ targetSkills = [], count = 6 } = {}) {
  const pool = targetSkills.filter((s) => bankBySlug.has(s.skillId));
  if (!pool.length) return [];
  const n = Math.min(count, pool.length);
  const step = pool.length / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    const skill = pool[Math.floor(i * step)];
    const qs = bankBySlug.get(skill.skillId) || [];
    if (qs[0]) out.push(qs[0]);
  }
  return out;
}

function getQuestionBank({ targetSkillIds = [], perSkill = PER_SKILL } = {}) {
  const slugs = targetSkillIds.length ? targetSkillIds : [...bySlug.keys()];
  const bank = [];
  for (const slug of slugs) {
    const enId = slugToEnId.get(slug);
    if (!enId) continue;
    try {
      const generated = generateEarlyNumeracyQuestionSet({ skillId: enId, count: perSkill, sessionSalt: STATIC_SALT });
      bank.push(...generated.map((q, variant) => normaliseGenerated(q, slug, variant)));
    } catch { /* skill not generatable */ }
  }
  const skillByDbId = new Map(slugs.map((id) => [id, bySlug.get(id)]).filter(([, v]) => v));
  return { docs: bank, bank, skillByDbId, skillsByFrameworkId: bySlug };
}

function getQuestionById(questionId) {
  const m = /^(.+)__q(\d+)$/.exec(String(questionId || ''));
  if (!m) return null;
  const [, slug, variantStr] = m;
  const enId = slugToEnId.get(slug);
  if (!enId) return null;
  const variant = parseInt(variantStr, 10);
  // Regenerate enough to reach the requested variant deterministically.
  try {
    const generated = generateEarlyNumeracyQuestionSet({
      skillId: enId,
      count: Math.max(PER_SKILL, variant + 1),
      sessionSalt: STATIC_SALT,
    });
    const q = generated[variant];
    return q ? normaliseGenerated(q, slug, variant) : null;
  } catch {
    return null;
  }
}

function toGenericQuestion(q = {}) {
  return q.skillId ? q : { ...q, skillId: q.slug || '' };
}

function normaliseQuestion(question = {}) {
  return {
    questionId:       question.questionId || question.id,
    skillId:          question.skillId,
    questionFamilyId: question.questionFamilyId,
    prompt:           question.prompt || question.stem || '',
    type:             question.type === 'mcq' ? 'mcq' : 'short_answer',
    choices:          question.choices || [],
    answer:           question.answer,
    // K2 questions render a count-the-objects emoji block. Forward it so the
    // diagnostic UI can show it (renderer already added to DomainDiagnosticSession).
    diagram:          question.diagram || null,
  };
}

function scoreAnswer(question, response = {}) {
  if (response.skipped || response.blankAnswer) return false;
  const studentResponse = response.answer ?? response.studentAnswer ?? '';
  try {
    const result = checkEarlyNumeracyAnswer({ question, studentResponse });
    return Boolean(result?.correct);
  } catch {
    return false;
  }
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
  const correctCount  = responses.filter((r) => r.correct).length;
  const answered      = responses.filter((r) => !r.skipped && !r.blankAnswer).length;
  const weakSkillIds  = [...new Set(responses.filter((r) => !r.correct).map((r) => r.skillId).filter(Boolean))];
  const secureSkillIds = [...new Set(
    decisionHistory
      .filter((d) => d.decisionType === DIAGNOSTIC_DECISIONS.MARK_SECURE || d.decisionType === DIAGNOSTIC_DECISIONS.MOVE_UP)
      .map((d) => d.currentSkillId)
      .filter(Boolean),
  )];
  const recommendedSkillId = assignedPracticeSkillIds[0] || weakSkillIds[0] || session.currentSkillId || FALLBACK;
  const nameFor = (id) => bySlug.get(id)?.name || id;

  const skillResponseMap = new Map();
  for (const r of responses) {
    if (!r.skillId) continue;
    const entry = skillResponseMap.get(r.skillId) || { correct: 0, wrong: 0, total: 0 };
    entry.total += 1;
    if (r.correct) entry.correct += 1; else entry.wrong += 1;
    skillResponseMap.set(r.skillId, entry);
  }
  const perSkillSnapshot = [...skillResponseMap.entries()].map(([skillId, counts]) => ({
    skillId,
    questionsAnswered: counts.total,
    questionsCorrect:  counts.correct,
    score: counts.total > 0 ? Math.round((counts.correct / counts.total) * 100) : 0,
    isSecure: secureSkillIds.includes(skillId),
    isWeak:   weakSkillIds.includes(skillId),
  }));

  return {
    adaptive: true,
    domainId: DOMAIN_ID,
    readinessBand: readinessScore >= 80 ? 'ready' : readinessScore >= 55 ? 'progressing' : 'developing',
    readinessScore,
    questionsCorrect:  correctCount,
    questionsAnswered: answered,
    totalQuestions:    responses.length,
    masteredSkills:    secureSkillIds.map((id) => ({ skillId: id, name: nameFor(id) })),
    weakSkills:        weakSkillIds.map((id) => ({ skillId: id, name: nameFor(id) })),
    perSkillSnapshot,
    recommendedStartingSkill:   { skillId: recommendedSkillId, name: nameFor(recommendedSkillId) },
    recommendedStartingSkillId: recommendedSkillId,
    recommendedStartingTopic:   DISPLAY_NAME,
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
  return SUPPORTIVE_COPY[decision.decisionType] || "Keep going — you're doing great!";
}

export default {
  subjectId:            SUBJECT_ID,
  domainId:             DOMAIN_ID,
  domainVersion:        'v0.1',
  displayName:          DISPLAY_NAME,
  defaultStartSkillIds: [FALLBACK].filter(Boolean),
  fallbackSkillId:      FALLBACK,
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
