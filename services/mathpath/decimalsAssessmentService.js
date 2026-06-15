import { decimalsSkillGraph, getSkill } from '../../shared/mathpath/decimals/decimalsSkillGraph.js';
import { getQuestionFamiliesBySkill } from '../../shared/mathpath/decimals/decimalsQuestionFamilies.js';
import {
  generateDecimalQuestion,
  checkDecimalAnswer,
} from '../../shared/mathpath/decimals/decimalsQuestionGenerator.js';

// Pure Decimals assessment service: a readiness gate (an assessment only unlocks
// once enough of the domain is mastered), a transparent readiness score
// (knowledge/fluency/retention, no black box), and build + score for a mixed
// assessment paper across mastered skills.

const DOMAIN_ID = 'decimals';
const TOTAL_SKILLS = decimalsSkillGraph.skillIds.length; // 14
const MIN_MASTERED_TO_UNLOCK = 8; // enough coverage for a meaningful check

const MASTERED_STATUSES = new Set(['mastered', 'accurate', 'fluent', 'retained']);
const FLUENT_BANDS = new Set(['gold', 'platinum']);

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
}

// knowledge 50% / fluency 30% / retention 20% → transparent readiness score.
export function calculateDecimalsExamReadiness({ knowledge = 0, fluency = 0, retention = 0 } = {}) {
  const dimensions = { knowledge: clamp(knowledge), fluency: clamp(fluency), retention: clamp(retention) };
  const score = Math.round(dimensions.knowledge * 0.5 + dimensions.fluency * 0.3 + dimensions.retention * 0.2);
  const band = score >= 80 ? 'exam_ready' : score >= 65 ? 'approaching_exam_ready' : 'exam_risk';
  return { score, band, dimensions };
}

// Gate + readiness from persisted skill states ([{ skillId, status, fluencyLevel }]).
export function getDecimalsAssessmentReadiness({ skillStates = [] } = {}) {
  const masteredSkillIds = [];
  let fluentCount = 0;
  let retainedCount = 0;
  for (const s of skillStates) {
    if (MASTERED_STATUSES.has(s.status)) masteredSkillIds.push(s.skillId);
    if (FLUENT_BANDS.has(s.fluencyLevel) || s.status === 'fluent' || s.status === 'retained') fluentCount += 1;
    if (s.status === 'retained') retainedCount += 1;
  }
  const mastered = masteredSkillIds.length;
  const knowledge = clamp((mastered / TOTAL_SKILLS) * 100);
  const fluency = clamp((fluentCount / TOTAL_SKILLS) * 100);
  const retention = clamp((retainedCount / TOTAL_SKILLS) * 100);
  const readiness = calculateDecimalsExamReadiness({ knowledge, fluency, retention });
  const ready = mastered >= MIN_MASTERED_TO_UNLOCK;

  return {
    domainId: DOMAIN_ID,
    ready,
    masteredSkillIds,
    coverage: { mastered, total: TOTAL_SKILLS, required: MIN_MASTERED_TO_UNLOCK },
    knowledge,
    fluency,
    retention,
    readinessScore: readiness.score,
    readinessBand: readiness.band,
    message: ready
      ? 'Assessment unlocked — you have mastered enough skills.'
      : `Master ${MIN_MASTERED_TO_UNLOCK - mastered} more skill${MIN_MASTERED_TO_UNLOCK - mastered === 1 ? '' : 's'} to unlock the assessment.`,
  };
}

// Hardest-available family per skill, for assessment-grade items.
function hardestFamily(skillId) {
  const families = getQuestionFamiliesBySkill(skillId);
  return families.slice().sort((a, b) => (b.difficulty - a.difficulty))[0] || families[0] || null;
}

// Build a mixed assessment paper across mastered skills. Returns full questions
// (answers included) for the route to persist; the route strips answers.
export function buildDecimalsAssessment({ masteredSkillIds = [], count = 10 } = {}) {
  const pool = masteredSkillIds.filter((id) => getSkill(id) && getQuestionFamiliesBySkill(id).length);
  if (!pool.length) {
    const err = new Error('No mastered decimals skills to assess yet.');
    err.status = 400;
    throw err;
  }
  const questions = Array.from({ length: count }, (_, i) => {
    const skillId = pool[i % pool.length];
    const family = hardestFamily(skillId);
    const variant = Math.floor(i / pool.length);
    const q = generateDecimalQuestion({ questionFamilyId: family.id, variant, mode: 'assessment' });
    return {
      questionId: `${family.id}_a${i}`,
      skillId: q.skillId,
      questionFamilyId: q.questionFamilyId,
      type: q.type,
      prompt: q.prompt,
      choices: q.choices || [],
      answer: q.answer,
      acceptedAnswers: q.acceptedAnswers || [],
      misconceptionTag: q.misconceptionTag || '',
      difficulty: q.difficulty,
    };
  });
  return { domainId: DOMAIN_ID, skillIds: [...new Set(questions.map((q) => q.skillId))], questions };
}

export function toClientAssessmentQuestions(questions = []) {
  return questions.map(({ answer, acceptedAnswers, ...rest }) => rest);
}

// Grade the paper: per-skill + overall, with a readiness interpretation.
export function scoreDecimalsAssessment({ questions = [], responses = [] } = {}) {
  const byId = new Map(questions.map((q) => [String(q.questionId), q]));
  const graded = responses
    .filter((r) => r && r.questionId != null && byId.has(String(r.questionId)))
    .map((r) => {
      const q = byId.get(String(r.questionId));
      const correct = checkDecimalAnswer({ question: q, studentResponse: r.studentAnswer ?? r.answer }).correct;
      return { questionId: q.questionId, skillId: q.skillId, correct, misconceptionTag: correct ? '' : (q.misconceptionTag || '') };
    });

  const perSkill = {};
  for (const r of graded) {
    if (!r.skillId) continue;
    if (!perSkill[r.skillId]) perSkill[r.skillId] = { total: 0, correct: 0 };
    perSkill[r.skillId].total += 1;
    if (r.correct) perSkill[r.skillId].correct += 1;
  }
  for (const skillId of Object.keys(perSkill)) {
    const s = perSkill[skillId];
    s.accuracy = s.total ? Math.round((s.correct / s.total) * 100) : 0;
  }

  const total = graded.length;
  const correct = graded.filter((r) => r.correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const band = accuracy >= 80 ? 'exam_ready' : accuracy >= 65 ? 'approaching_exam_ready' : 'exam_risk';
  const weakSkillIds = Object.entries(perSkill).filter(([, s]) => s.accuracy < 65).map(([id]) => id);

  return {
    domainId: DOMAIN_ID,
    total,
    correct,
    accuracy,
    band,
    perSkill,
    weakSkillIds,
    mistakes: graded.filter((r) => !r.correct),
  };
}

export default {
  DOMAIN_ID,
  calculateDecimalsExamReadiness,
  getDecimalsAssessmentReadiness,
  buildDecimalsAssessment,
  toClientAssessmentQuestions,
  scoreDecimalsAssessment,
};
