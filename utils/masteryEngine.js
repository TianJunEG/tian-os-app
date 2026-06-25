// Shared mastery engine — the ONE place mastery is computed/written. Every
// module (MathPath, Mistake-to-Mastery, Worksheet practice, Fluency) calls
// recordAttempt(); nothing else writes MasteryRecord. Keeps "one shared core".
import MasteryRecord from '../models/MasteryRecord.js';
import MathPathStudentSkillState from '../models/mathpath/MathPathStudentSkillState.js';
import Mistake from '../models/Mistake.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';

const MASTERED_AT = 80;   // score >= → mastered (with enough attempts)
const REVIEW_BELOW = 50;  // score < → needs_review
const MIN_ATTEMPTS_FOR_MASTERY = 5;

// Exponential moving average so recent performance moves the needle without
// erasing history. correct → 100, wrong → 0.
function nextScore(prev, correct, attempts) {
  const alpha = attempts < 3 ? 0.5 : 0.3;
  return Math.round(prev * (1 - alpha) + (correct ? 100 : 0) * alpha);
}

function deriveStatus(score, attempts) {
  if (attempts === 0) return 'not_started';
  if (score >= MASTERED_AT && attempts >= MIN_ATTEMPTS_FOR_MASTERY) return 'mastered';
  if (score < REVIEW_BELOW) return 'needs_review';
  return 'learning';
}

// ── Unified, user-facing vocabulary ──────────────────────────────────────────
// The numeric score/attempts/fluency are the single source of truth; the 5-state
// mastery ladder and the 3-state fluency label are DERIVED from them, so there's
// no enum migration of existing records and one place defines the words.
export const MASTERY_STATES = ['not_started', 'developing', 'practising', 'fluent', 'mastered'];
export const MASTERY_LABEL = { not_started: 'Not started', developing: 'Developing', practising: 'Practising', fluent: 'Fluent', mastered: 'Mastered' };
export const FLUENCY_LABEL = { unknown: '—', effortful: 'slow', developing: 'steady', automatic: 'fast' };
const DECAY_DAYS = 60;   // a top skill unpractised this long steps back for a gentle refresh

export const fluencyLabel = (fluencyStatus) => FLUENCY_LABEL[fluencyStatus] || 'steady';

// 5-state mastery ladder, derived (with decay) from a record-like object.
export function deriveMastery(rec = {}, now = Date.now()) {
  const { score = 0, attempts = 0, fluencyStatus = 'unknown', lastPracticedAt = null } = rec;
  if (attempts === 0) return 'not_started';
  let state;
  if (score < REVIEW_BELOW) state = 'developing';
  else if (score < MASTERED_AT || attempts < MIN_ATTEMPTS_FOR_MASTERY) state = 'practising';
  else state = fluencyStatus === 'automatic' ? 'mastered' : 'fluent';   // ≥80 = fluent; mastered once also fast
  if ((state === 'mastered' || state === 'fluent') && lastPracticedAt
    && (now - new Date(lastPracticedAt).getTime()) / 86400000 > DECAY_DAYS) state = 'practising';
  return state;
}
// True when a mastered skill has gone stale (overdue for a refresh).
export function isStale(rec = {}, now = Date.now()) {
  return rec.lastPracticedAt && rec.score >= MASTERED_AT
    && (now - new Date(rec.lastPracticedAt).getTime()) / 86400000 > DECAY_DAYS;
}

// Update mastery for one (student, skill) from a single graded attempt.
// Returns { before, after, masteredNow }.
export async function recordAttempt({ studentId, skillId, workspaceId, correct, timeMs = null, module = 'MathPath', subject = 'Math' }) {
  let rec = await MasteryRecord.findOne({ studentId, skillId });
  if (!rec) {
    rec = new MasteryRecord({ studentId, skillId, workspaceId, module, subject, score: 0, attempts: 0, status: 'not_started' });
  }
  const before = { score: rec.score, status: rec.status };
  rec.attempts += 1;
  rec.score = nextScore(rec.score, correct, rec.attempts);
  rec.status = deriveStatus(rec.score, rec.attempts);
  rec.lastPracticedAt = new Date();

  // streak (consecutive correct)
  rec.streak = correct ? (rec.streak || 0) + 1 : 0;
  rec.bestStreak = Math.max(rec.bestStreak || 0, rec.streak);

  // consistency: rolling window of recent outcomes — fewer correct/wrong flips
  // means steadier performance (and a more trustworthy estimate).
  const outcomes = [...(rec.recentOutcomes || []), !!correct].slice(-10);
  rec.recentOutcomes = outcomes;
  let flips = 0; for (let i = 1; i < outcomes.length; i++) if (outcomes[i] !== outcomes[i - 1]) flips++;
  rec.consistency = outcomes.length >= 2 ? Math.round((1 - flips / (outcomes.length - 1)) * 100) / 100 : 1;
  // confidence in the estimate: grows with evidence (attempts) and consistency.
  rec.confidence = Math.round(Math.min(1, Math.min(1, rec.attempts / 8) * 0.6 + rec.consistency * 0.4) * 100) / 100;

  // fluency: track speed of CORRECT attempts (a wrong-but-fast guess isn't fluent)
  if (correct && typeof timeMs === 'number' && timeMs > 0) {
    const times = [...(rec.recentTimesMs || []), timeMs].slice(-10);
    rec.recentTimesMs = times;
    const sorted = [...times].sort((a, b) => a - b);
    rec.medianTimeMs = sorted[Math.floor(sorted.length / 2)];
  }
  const target = (await Skill.findById(skillId))?.metadata?.fluency?.targetSeconds;
  if (target && rec.medianTimeMs != null) {
    const sec = rec.medianTimeMs / 1000;
    rec.fluencyStatus = (sec <= target && rec.score >= MASTERED_AT) ? 'automatic'
      : (sec <= target * 1.8 ? 'developing' : 'effortful');
  }
  await rec.save();

  const masteredNow = before.status !== 'mastered' && rec.status === 'mastered';
  if (rec.status === 'mastered') {
    // Resolution is mastery-derived (not "did a worksheet"): clear open mistakes.
    await Mistake.updateMany(
      { studentId, skillId, status: { $ne: 'resolved' } },
      { $set: { status: 'resolved' } }
    );
  }
  return { before, after: { score: rec.score, status: rec.status }, masteredNow };
}

// Fractions practice data lives in MathPathStudentSkillState (skill-state store).
// These helpers translate those records into MasteryRecord-compatible shapes so
// weakSkills() and recommendNextSkill() can merge them without changing callers.

const SKILL_STATE_MASTERED = new Set(['accurate', 'fluent', 'retained', 'mastered']);

function skillStateToStatus(s) {
  const v = String(s || '');
  if (v === 'needsReview') return 'needs_review';
  if (v === 'notStarted') return 'not_started';
  if (SKILL_STATE_MASTERED.has(v)) return 'mastered';
  return v; // 'learning', 'weak', etc. pass through
}

function fluencyStatusFromLevel(level) {
  if (level === 'gold' || level === 'platinum') return 'automatic';
  if (level === 'silver' || level === 'bronze') return 'developing';
  return 'unknown';
}

// Returns { masteryLike } where each element has the same fields weakSkills()
// and recommendNextSkill() expect from MasteryRecord documents:
//   .skillId  — populated Skill doc    (for weakSkills callers)
//   .score    — number
//   .status   — MasteryRecord vocab string
//   .fluencyStatus, .lastPracticedAt
async function loadFractionsAsMasteryLike(studentId) {
  const states = await MathPathStudentSkillState.find({ studentId: String(studentId), domainId: 'fractions' }).lean();
  if (!states.length) return { masteryLike: [] };

  const fCodes = [...new Set(states.map((s) => s.skillId).filter(Boolean))];
  const skills = await Skill.find({
    $or: [
      { 'metadata.mathPathSkillId': { $in: fCodes } },
      { 'metadata.frameworkCode': { $in: fCodes } },
    ],
  }).populate('topicId');

  const skillByCode = new Map();
  for (const skill of skills) {
    const code = skill.metadata?.mathPathSkillId || skill.metadata?.frameworkCode;
    if (code) skillByCode.set(String(code).toUpperCase(), skill);
  }

  const masteryLike = states
    .map((state) => {
      const skill = skillByCode.get(String(state.skillId).toUpperCase());
      if (!skill) return null;
      return {
        skillId: skill,                           // populated Skill doc
        score: state.accuracy || 0,
        attempts: state.attemptCount || 0,
        status: skillStateToStatus(state.status),
        fluencyStatus: fluencyStatusFromLevel(state.fluencyLevel),
        lastPracticedAt: state.lastPractisedAt || null,
        _fromSkillState: true,
      };
    })
    .filter(Boolean);

  return { masteryLike };
}

// Weak skills for a student: lowest score / needs_review first. Optionally only
// those with recent unresolved mistakes.
export async function weakSkills(studentId, { limit = 10, withMistakesOnly = false } = {}) {
  // Fractions data from skill-state store — merged in before MasteryRecord results
  // so seeded and production fractions students both show correct weak skills.
  const { masteryLike: fractionsAll } = await loadFractionsAsMasteryLike(studentId);
  const fractionsWeak = fractionsAll.filter((r) => r.status !== 'mastered').sort((a, b) => a.score - b.score);
  const coveredIds = new Set(fractionsWeak.map((r) => String(r.skillId._id)));

  // MathPath surfaces only — spelling/other-module records are excluded.
  const q = { studentId, module: 'MathPath', status: { $in: ['needs_review', 'learning', 'not_started'] } };
  let records = await MasteryRecord.find(q).populate({ path: 'skillId', populate: { path: 'topicId' } }).sort({ score: 1 }).limit(limit * 2);
  // Drop any MasteryRecord entries already covered by skill state (fractions dual-writes).
  records = records.filter((r) => !coveredIds.has(String(r.skillId?._id)));

  let merged = [...fractionsWeak, ...records];
  if (withMistakesOnly) {
    const skillIds = merged.map((r) => r.skillId?._id).filter(Boolean);
    const withMistakes = await Mistake.distinct('skillId', { studentId, skillId: { $in: skillIds }, status: { $ne: 'resolved' } });
    const set = new Set(withMistakes.map(String));
    merged = merged.filter((r) => set.has(String(r.skillId?._id)));
  }
  return merged.slice(0, limit);
}

// The recommended next MathPath skill, prerequisite-aware. Pick a target — the
// weakest in-progress skill, else the next un-mastered skill in curriculum order
// (topic order → skill order) — then descend its prerequisite chain to the
// earliest un-mastered prerequisite the student is actually ready for (one whose
// own prerequisites are all mastered). This stops us recommending a skill whose
// foundations aren't in place. Returns { skill (populated topicId), record|null }
// or null. Cycle-guarded against malformed prerequisite loops.
export async function recommendNextSkill(studentId) {
  const math = await Subject.findOne({ key: 'math' });
  if (!math) return null;
  const topics = await Topic.find({ subjectId: math._id });
  const allSkills = await Skill.find({ topicId: { $in: topics.map((t) => t._id) } }).populate('topicId');
  if (!allSkills.length) return null;
  const skillById = new Map(allSkills.map((s) => [String(s._id), s]));
  const topicOrder = (s) => s.topicId?.order ?? 0;
  const byCurriculum = (a, b) => (topicOrder(a) - topicOrder(b)) || ((a.order ?? 0) - (b.order ?? 0));

  const records = await MasteryRecord.find({ studentId, module: 'MathPath' });

  // Supplement MasteryRecord with fractions data from skill-state store.
  // Fractions seed scripts write only to MathPathStudentSkillState, so real
  // students and seeded students alike need this source for correct recommendations.
  const { masteryLike: fractionsAll } = await loadFractionsAsMasteryLike(studentId);
  const masteryRecordSkillIds = new Set(records.map((r) => String(r.skillId)));
  const fractionsExtra = fractionsAll
    .filter((r) => !masteryRecordSkillIds.has(String(r.skillId._id)))
    .map((r) => ({ skillId: r.skillId._id, score: r.score, status: r.status, fluencyStatus: r.fluencyStatus, lastPracticedAt: r.lastPracticedAt }));
  const allRecords = [...records, ...fractionsExtra];

  const recBySkill = new Map(allRecords.map((r) => [String(r.skillId), r]));
  // Stale-mastered skills are treated as un-mastered so they resurface for a refresh.
  const masteredIds = new Set(allRecords.filter((r) => r.status === 'mastered' && !isStale(r)).map((r) => String(r.skillId)));

  const resolveReadyGap = (startId) => {
    const seen = new Set();
    let cur = String(startId);
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const s = skillById.get(cur);
      if (!s) break;
      const unmet = (s.prerequisiteSkillIds || [])
        .map((id) => skillById.get(String(id)))
        .filter((p) => p && !masteredIds.has(String(p._id)))
        .sort(byCurriculum);
      if (!unmet.length) break;        // all prerequisites mastered → ready
      cur = String(unmet[0]._id);      // shore up the earliest gap first
    }
    return cur;
  };

  // Practiceability: legacy ad-hoc skill records (created before the
  // canonical domain seeds) have slug='' and no questionStructures, so they
  // dead-end the practice route with "No questions available." Prefer skills
  // with a slug (every canonical domain skill, including fractions, has one).
  // We only PREFER — not strictly filter — so we still pick a non-practiceable
  // skill if it's the only thing left, matching the previous behaviour.
  const isPracticeable = (skill) => Boolean(skill?.slug);

  // Target: weakest in-progress skill, else next un-mastered in curriculum order.
  // Within each group, prefer a practiceable skill so brand-new students don't
  // get pointed at a dead-end legacy record (see scripts/reconcileDomains.js).
  const weak = allRecords
    .filter((r) => ['needs_review', 'learning', 'not_started'].includes(r.status))
    .sort((a, b) => a.score - b.score);
  const weakPick = weak.find((r) => isPracticeable(skillById.get(String(r.skillId)))) || weak[0];
  let targetId = weakPick ? String(weakPick.skillId) : null;
  if (!targetId) {
    const candidates = [...allSkills].sort(byCurriculum).filter((s) => !masteredIds.has(String(s._id)));
    const next = candidates.find(isPracticeable) || candidates[0];
    targetId = next ? String(next._id) : null;
  }
  if (!targetId) return null;          // everything mastered

  const gapId = resolveReadyGap(targetId);
  const skill = skillById.get(gapId);
  if (!skill) return null;
  const record = recBySkill.get(String(skill._id)) || null;
  const target = skillById.get(targetId);

  // A plain-language reason so the recommendation is explainable to the learner,
  // plus the recommended MODE the UI should open in.
  let reason, mode;
  if (gapId !== targetId) {
    reason = `Strengthen the prerequisite “${skill.name}” first — it unlocks “${target?.name}”.`; mode = 'remediation';
  } else if (isStale(record || {})) {
    reason = `Time to refresh “${skill.name}” — it’s been a while, so let’s keep it sharp.`; mode = 'fluency';
  } else if (record?.status === 'needs_review') {
    reason = `Review “${skill.name}” — accuracy here has slipped, so let’s shore it up.`; mode = 'remediation';
  } else if (record?.status === 'learning') {
    reason = `Keep building “${skill.name}” — you’re partway to mastering it.`; mode = 'independent';
  } else if (record?.status === 'mastered' && record?.fluencyStatus && record.fluencyStatus !== 'automatic') {
    reason = `Speed up “${skill.name}” — you’re accurate, now let’s make it automatic.`; mode = 'fluency';
  } else {
    reason = `You’re ready to start “${skill.name}”.`; mode = 'independent';
  }
  const masteryState = deriveMastery(record || {});
  const confidence = record?.confidence ?? (record ? 0.3 : 0);
  return {
    skill, record, target: target ? { slug: target.slug, name: target.name } : null,
    reason, mode, masteryState, confidence,
  };
}
