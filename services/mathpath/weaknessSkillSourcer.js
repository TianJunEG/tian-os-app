// Weakness skill sourcing for data-driven test modes (weakness_drill, remediation).
//
// Pulls a ranked set of "weak" skills for a student from three independent
// signals and normalizes everything to PUBLIC skill ids (mathPathSkillId /
// frameworkCode / slug) — the same id space the spec generator selects against.
//
//   1. MathPathStudentSkillState — status weak/needsReview/forgotten, low accuracy.
//        skillId is already a public id; studentId is a string.
//   2. MathPathMistakeRecord — every open mistake is weakness evidence; the
//        record's skillId + remediationSkillIds are public ids; studentId string.
//   3. MasteryRecord — status needs_review/learning, or a low score. skillId is a
//        Skill ObjectId, so we resolve it to a public id via Skill metadata.
//
// Each signal contributes to a weakness score; the top `limit` public ids are
// returned, ranked, so the generator can narrow a paper to a student's weak spots.

import mongoose from 'mongoose';
import MasteryRecord from '../../models/MasteryRecord.js';
import MathPathStudentSkillState from '../../models/mathpath/MathPathStudentSkillState.js';
import MathPathMistakeRecord from '../../models/mathpath/MathPathMistakeRecord.js';
import Skill from '../../models/Skill.js';

const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null);

const SEVERITY_WEIGHT = { high: 3, medium: 2, low: 1 };
const SKILL_STATE_WEAK_STATUSES = new Set(['weak', 'needsReview', 'forgotten']);
const MASTERY_WEAK_STATUSES = new Set(['needs_review', 'learning']);

const publicSkillId = (doc) =>
  String(doc?.metadata?.mathPathSkillId || doc?.metadata?.frameworkCode || doc?.slug || doc?._id || '');

// Returns { skillIds: [...rankedPublicIds], details: [{ skillId, score, signals }] }.
// Pass domainIds to scope the string-keyed signals to the topics in play.
export async function sourceWeakSkills({
  studentId,
  domainIds = [],
  limit = 8,
  masteryScoreThreshold = 70,
  lowAccuracyThreshold = 0.6,
  module = 'MathPath',
} = {}) {
  const sid = String(studentId || '').trim();
  if (!sid) return { skillIds: [], details: [] };

  const domainScope = (Array.isArray(domainIds) ? domainIds : [])
    .map((d) => String(d || '').toLowerCase())
    .filter(Boolean);
  const domainFilter = domainScope.length ? { domainId: { $in: domainScope } } : {};

  // Accumulate a weakness score per public skill id.
  const scores = new Map();
  const signalsBySkill = new Map();
  const domainBySkill = new Map();
  const bump = (skillId, amount, signal, domainId) => {
    const key = String(skillId || '').trim();
    if (!key) return;
    scores.set(key, (scores.get(key) || 0) + amount);
    if (!signalsBySkill.has(key)) signalsBySkill.set(key, new Set());
    signalsBySkill.get(key).add(signal);
    // Remember the first domain a skill is seen under (string-keyed signals only).
    const dom = String(domainId || '').toLowerCase();
    if (dom && !domainBySkill.has(key)) domainBySkill.set(key, dom);
  };

  // 1. Per-skill state (public ids, string studentId).
  const states = await MathPathStudentSkillState.find({ studentId: sid, ...domainFilter })
    .select('skillId status accuracy domainId attemptCount')
    .lean();
  for (const s of states) {
    if (SKILL_STATE_WEAK_STATUSES.has(s.status)) {
      bump(s.skillId, s.status === 'forgotten' ? 3 : s.status === 'weak' ? 3 : 2, 'skillState', s.domainId);
    }
    // accuracy is stored as a 0–1 fraction; tolerate 0–100 just in case. Gate on
    // attemptCount (not acc > 0) so a genuine 0% — the weakest student — still
    // counts, while the default 0 accuracy of an unattempted skill is skipped.
    const acc = s.accuracy > 1 ? s.accuracy / 100 : s.accuracy;
    if (Number(s.attemptCount || 0) > 0 && Number.isFinite(acc) && acc < lowAccuracyThreshold) {
      bump(s.skillId, 2, 'lowAccuracy', s.domainId);
    }
  }

  // 2. Open mistakes (public ids, string studentId). Each mistake is direct
  //    weakness evidence; remediation targets are weak-adjacent.
  const mistakes = await MathPathMistakeRecord.find({ studentId: sid, ...domainFilter })
    .select('skillId remediationSkillIds severity frequency domainId')
    .lean();
  for (const m of mistakes) {
    const sev = SEVERITY_WEIGHT[m.severity] || 1;
    const freq = Math.max(1, Number(m.frequency || 1));
    bump(m.skillId, sev * Math.min(freq, 5), 'mistake', m.domainId);
    (m.remediationSkillIds || []).forEach((rid) => bump(rid, 1, 'remediation', m.domainId));
  }

  // 3. Generic mastery records (Skill ObjectId, ObjectId studentId) → map to public ids.
  const sidObj = toObjectId(sid);
  if (sidObj) {
    // Scope to the module so a student's Spelling/other-module weak records don't
    // leak into a math paper (their skillIds aren't Skill docs and would otherwise
    // just be silently dropped — wasteful and fragile).
    const records = await MasteryRecord.find({ studentId: sidObj, ...(module ? { module } : {}) })
      .select('skillId status score')
      .lean();
    const weakRecords = records.filter(
      (r) => MASTERY_WEAK_STATUSES.has(r.status) || (Number.isFinite(r.score) && r.score < masteryScoreThreshold)
    );
    if (weakRecords.length) {
      const skillObjIds = weakRecords.map((r) => r.skillId).filter(Boolean);
      const skillDocs = await Skill.find({ _id: { $in: skillObjIds } }).select('_id slug metadata').lean();
      const idToPublic = new Map(skillDocs.map((d) => [String(d._id), publicSkillId(d)]));
      for (const r of weakRecords) {
        const pub = idToPublic.get(String(r.skillId));
        if (!pub) continue;
        const statusWeight = MASTERY_WEAK_STATUSES.has(r.status) ? (r.status === 'needs_review' ? 2 : 1) : 0;
        const scoreWeight = Number.isFinite(r.score) && r.score < masteryScoreThreshold
          ? Math.min(3, (masteryScoreThreshold - r.score) / 20)
          : 0;
        bump(pub, statusWeight + scoreWeight, 'mastery');
      }
    }
  }

  const details = [...scores.entries()]
    .map(([skillId, score]) => ({
      skillId,
      score,
      domainId: domainBySkill.get(skillId) || '',
      signals: [...(signalsBySkill.get(skillId) || [])],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));

  const domainMap = {};
  details.forEach((d) => { if (d.domainId) domainMap[d.skillId] = d.domainId; });

  return { skillIds: details.map((d) => d.skillId), details, domainBySkill: domainMap };
}
