import Skill from '../../models/Skill.js';
import MasteryRecord from '../../models/MasteryRecord.js';
import FluencyRecord from '../../models/FluencyRecord.js';
import Mistake from '../../models/Mistake.js';

// ── Thresholds ───────────────────────────────────────────────────────────────
// Centralised so the flag rule is one place, auditable and tunable.
export const THRESHOLDS = Object.freeze({
  classReadyMastery: 55, // below this overall = needs support
  extensionMastery: 85, // at/above this = ready for extension
  stuckAttempts: 3, // attempts on a needs_review skill before it's a flag
  slowAccuracy: 70, // accurate-but-slow: accuracy >= this …
  slowTimeFactor: 1.4, // … and time >= target * this
  fastInaccurateAccuracy: 50, // fast-but-inaccurate: accuracy < this …
  fastTimeFactor: 0.9, // … and time <= target * this
  recurringMistakeFrequency: 3, // unresolved mistakes recurring this often = flag
  defaultFluencyTargetSeconds: 20,
});

function avg(values = []) {
  const nums = values.map(Number).filter(Number.isFinite);
  if (!nums.length) return 0;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

function skillTargetSeconds(skillDoc) {
  const t = Number(skillDoc?.metadata?.fluency?.targetSeconds);
  return Number.isFinite(t) && t > 0 ? t : THRESHOLDS.defaultFluencyTargetSeconds;
}

function skillDomain(skillDoc) {
  return skillDoc?.domain || skillDoc?.topicId?.name || 'General';
}

// Build the real, data-backed teacher class dashboard.
//   studentIds  — ObjectIds of the class roster
//   students    — [{ _id, name, level }] (already loaded by the route)
//   subjectKey  — 'Math' | 'Science' | … matches MasteryRecord.subject
export async function buildClassDashboard({ studentIds = [], students = [], subjectKey = 'Math' } = {}) {
  const nameById = new Map(students.map((s) => [String(s._id), s.name]));
  const ids = studentIds.map(String);

  // Pull all three signals for the roster in three queries, then group in memory.
  const [masteryRecords, fluencyRecords, mistakes] = await Promise.all([
    MasteryRecord.find({ studentId: { $in: studentIds }, subject: subjectKey })
      .populate({ path: 'skillId', model: Skill, populate: { path: 'topicId' } })
      .lean(),
    FluencyRecord.find({ studentId: { $in: studentIds } })
      .populate({ path: 'skillId', model: Skill })
      .lean(),
    Mistake.find({ studentId: { $in: studentIds }, status: { $ne: 'resolved' } })
      .populate({ path: 'skillId', model: Skill })
      .lean(),
  ]);

  const masteryByStudent = new Map(ids.map((id) => [id, []]));
  const fluencyByStudent = new Map(ids.map((id) => [id, []]));
  const mistakesByStudent = new Map(ids.map((id) => [id, []]));
  for (const r of masteryRecords) {
    if (!r.skillId) continue; // orphan-safe (see family.js note)
    masteryByStudent.get(String(r.studentId))?.push(r);
  }
  for (const r of fluencyRecords) fluencyByStudent.get(String(r.studentId))?.push(r);
  for (const m of mistakes) mistakesByStudent.get(String(m.studentId))?.push(m);

  // ── Per-student rollups + flags ────────────────────────────────────────────
  const perStudent = [];
  const flaggedStudents = [];

  for (const sid of ids) {
    const name = nameById.get(sid) || 'Student';
    const mRecs = masteryByStudent.get(sid) || [];
    const fRecs = fluencyByStudent.get(sid) || [];
    const misRecs = mistakesByStudent.get(sid) || [];
    const attempted = mRecs.filter((r) => r.attempts > 0);
    const overallMastery = attempted.length ? avg(attempted.map((r) => r.score)) : 0;
    const hasData = attempted.length > 0 || fRecs.length > 0;

    // Weakest attempted skill = the exact skill the teacher should target.
    const weakest = [...attempted].sort((a, b) => a.score - b.score)[0] || null;
    const focusSkill = weakest
      ? { skillId: weakest.skillId?._id, skillName: weakest.skillId?.name || '—', score: weakest.score, status: weakest.status }
      : null;

    const reasons = [];
    let severity = 'low';

    // (a) Overall below class-ready.
    if (hasData && overallMastery < THRESHOLDS.classReadyMastery) {
      reasons.push(`Overall mastery ${overallMastery}% — below class-ready level`);
      severity = overallMastery < 40 ? 'high' : 'medium';
    }

    // (b) Stuck: a skill in needs_review after repeated attempts.
    for (const r of mRecs) {
      if (r.status === 'needs_review' && r.attempts >= THRESHOLDS.stuckAttempts) {
        reasons.push(`Stuck on ${r.skillId?.name || 'a skill'} after ${r.attempts} attempts`);
        if (severity !== 'high') severity = 'medium';
      }
    }

    // (c) Fluency: accurate-but-slow or fast-but-inaccurate.
    for (const f of fRecs) {
      const target = skillTargetSeconds(f.skillId);
      const t = Number(f.averageTimeSeconds);
      const acc = Number(f.accuracy);
      const label = f.skillName || f.skillId?.name || 'a skill';
      if (Number.isFinite(t) && Number.isFinite(acc)) {
        if (acc >= THRESHOLDS.slowAccuracy && t >= target * THRESHOLDS.slowTimeFactor) {
          reasons.push(`Accurate but slow on ${label} (${Math.round(t)}s vs ${target}s target)`);
        } else if (acc < THRESHOLDS.fastInaccurateAccuracy && t <= target * THRESHOLDS.fastTimeFactor) {
          reasons.push(`Fast but inaccurate on ${label} (${Math.round(acc)}% correct)`);
          if (severity !== 'high') severity = 'medium';
        }
      }
    }

    // (d) Recurring, unresolved mistakes (critical/major or high frequency).
    const recurring = misRecs.filter(
      (m) => Number(m.frequency || 1) >= THRESHOLDS.recurringMistakeFrequency
        || ['major', 'critical'].includes(m.severity)
    );
    if (recurring.length) {
      const worst = recurring.sort((a, b) => Number(b.frequency || 1) - Number(a.frequency || 1))[0];
      const cat = (worst.mistakeCategory || worst.mistakeType || 'recurring').replace(/_/g, ' ');
      reasons.push(`Repeated ${cat} on ${worst.skillId?.name || 'recent work'}`);
      if (recurring.some((m) => m.severity === 'critical')) severity = 'high';
    }

    const onTrack = hasData && overallMastery >= THRESHOLDS.classReadyMastery && reasons.length === 0;
    const readyForExtension = hasData && overallMastery >= THRESHOLDS.extensionMastery && reasons.length === 0;

    // A single status label so the roster can be filtered with one control.
    let status;
    if (!hasData) status = 'no_data';
    else if (reasons.length) status = 'flagged';
    else if (readyForExtension) status = 'extension';
    else status = 'on_track';

    perStudent.push({
      studentId: sid,
      name,
      overallMastery,
      hasData,
      onTrack,
      readyForExtension,
      flagged: reasons.length > 0,
      status,
      severity: reasons.length ? severity : null,
      focusSkillName: focusSkill?.skillName || null,
    });

    if (reasons.length) {
      flaggedStudents.push({
        studentId: sid,
        name,
        overallMastery,
        focusSkill,
        reasons,
        severity,
        needsInPersonRemediation: severity === 'high',
      });
    }
  }

  // Sort flags so the people who need the teacher most are first.
  const sevRank = { high: 0, medium: 1, low: 2 };
  flaggedStudents.sort((a, b) => (sevRank[a.severity] - sevRank[b.severity]) || (a.overallMastery - b.overallMastery));

  // ── Class overview ─────────────────────────────────────────────────────────
  const withData = perStudent.filter((s) => s.hasData);
  const classOverview = {
    totalStudents: ids.length,
    studentsWithData: withData.length,
    studentsOnTrack: perStudent.filter((s) => s.onTrack).length,
    studentsNeedingSupport: flaggedStudents.length,
    studentsReadyForExtension: perStudent.filter((s) => s.readyForExtension).length,
    averageMastery: withData.length ? avg(withData.map((s) => s.overallMastery)) : 0,
    averageFluency: fluencyRecords.length ? avg(fluencyRecords.map((r) => r.fluencyScore)) : 0,
  };

  // ── Per-skill heatmap + per-domain summary (exact grasp of each domain/skill)
  const skillAgg = new Map(); // skillId -> bucket
  for (const r of masteryRecords) {
    if (!r.skillId) continue;
    const key = String(r.skillId._id);
    if (!skillAgg.has(key)) {
      skillAgg.set(key, {
        skillId: r.skillId._id,
        skillName: r.skillId.name,
        domain: skillDomain(r.skillId),
        masteredCount: 0, fluentCount: 0, retainedCount: 0, weakCount: 0, attemptedCount: 0, totalScore: 0, learners: 0,
      });
    }
    const b = skillAgg.get(key);
    b.learners += 1;
    b.totalScore += Number(r.score || 0);
    if (r.attempts > 0) b.attemptedCount += 1;
    if (r.status === 'mastered') b.masteredCount += 1;
    if (r.status === 'needs_review') b.weakCount += 1;
    if (r.fluencyStatus === 'automatic') b.fluentCount += 1;
    if (r.masteryState === 'retained') b.retainedCount += 1;
  }
  const skillHeatmap = [...skillAgg.values()].map((b) => ({
    skillId: b.skillId,
    skillName: b.skillName,
    domain: b.domain,
    masteredCount: b.masteredCount,
    fluentCount: b.fluentCount,
    retainedCount: b.retainedCount,
    weakCount: b.weakCount,
    classMasteryPercentage: b.learners ? Math.round(b.totalScore / b.learners) : 0,
  })).sort((a, b) => a.classMasteryPercentage - b.classMasteryPercentage);

  const domainAgg = new Map();
  for (const row of skillHeatmap) {
    if (!domainAgg.has(row.domain)) domainAgg.set(row.domain, { domain: row.domain, scores: [], weakCount: 0, skillCount: 0 });
    const d = domainAgg.get(row.domain);
    d.scores.push(row.classMasteryPercentage);
    d.weakCount += row.weakCount;
    d.skillCount += 1;
  }
  const domains = [...domainAgg.values()].map((d) => ({
    domain: d.domain,
    averageMastery: avg(d.scores),
    skillCount: d.skillCount,
    weakCount: d.weakCount,
  })).sort((a, b) => a.averageMastery - b.averageMastery);

  return {
    subject: subjectKey,
    generatedAt: new Date().toISOString(),
    classOverview,
    flaggedStudents,
    domains,
    skillHeatmap,
    students: perStudent.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export default { buildClassDashboard, THRESHOLDS };
