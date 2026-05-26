// recommend.js — adaptive recommendation engine (v2).
//
// Applied to the learner's current working skill (first non-mastered in order):
//   accuracy < 70%                 → remediation
//   accuracy 70–89%                → more independent practice
//   accuracy ≥ 90% but slow        → fluency drills
//   accuracy ≥ 90% and fast        → unlock the next skill
//   a repeated misconception       → prerequisite reinforcement
//   an unmastered prerequisite     → reinforce it first
// Returns: next recommended skill, reason, mode, confidence status, remediation suggestion(s),
// and any fluency drills.

import { collections } from './db.js';
import { SKILLS, SKILL_ORDER, getSkill, prerequisitesOf, REMEDIATION_ACCURACY, MASTERY_ACCURACY, SPACED_REVIEW_DAYS } from './graph.js';
import { getProfiles } from './mastery.js';

const masteryOf = (profiles, id) => profiles.find((p) => p.skill_id === id)?.mastery_status || 'not_started';
const profOf = (profiles, id) => profiles.find((p) => p.skill_id === id) || null;

function dominantMisconception(prof) {
  const m = prof?.misconceptions || {};
  let topTag = null, topN = 0, total = 0;
  for (const [tag, n] of Object.entries(m)) { total += n; if (n > topN) { topN = n; topTag = tag; } }
  return topN >= 2 && topN >= total * 0.5 ? { tag: topTag, count: topN } : null;
}

function confidenceFor(acc) {
  if (acc >= MASTERY_ACCURACY) return 'confident';
  if (acc >= REMEDIATION_ACCURACY) return 'steady';
  return 'building';
}

// A mastered skill that hasn't been practised within the review window — stalest first.
function dueForReview(profiles) {
  const cutoff = Date.now() - SPACED_REVIEW_DAYS * 86400000;
  const due = profiles
    .filter((p) => p.mastery_status === 'mastered' && p.last_practiced_at && Date.parse(p.last_practiced_at) < cutoff)
    .sort((a, b) => Date.parse(a.last_practiced_at) - Date.parse(b.last_practiced_at));
  return due[0] || null;
}

export function chooseRecommendation(profiles) {
  const base = baseRecommendation(profiles);
  // Spaced review: if the learner is progressing calmly, resurface a mastered skill that is
  // due for review before it decays. Urgent modes (remediate/fluency/reinforce) take priority.
  if (['advance', 'continue', 'start', 'maintain'].includes(base.mode)) {
    const stale = dueForReview(profiles);
    if (stale) {
      const s = getSkill(stale.skill_id);
      return {
        recommended_skill_id: stale.skill_id, kind: 'review', mode: 'review',
        reason: `Quick review of ${s.skill_name} to keep it sharp.`,
        confidence_status: 'confident', remediation_suggestions: [], fluency_drills: [],
        review_of: stale.skill_id, all_mastered: base.all_mastered,
      };
    }
  }
  return base;
}

function baseRecommendation(profiles) {
  const targetId = SKILL_ORDER.find((id) => masteryOf(profiles, id) !== 'mastered');

  if (!targetId) {
    const last = SKILLS[SKILLS.length - 1];
    return { recommended_skill_id: last.skill_id, kind: 'continue', mode: 'maintain', reason: 'Every skill here is mastered — keep them sharp.', confidence_status: 'confident', remediation_suggestions: [], fluency_drills: [], all_mastered: true };
  }

  // An unmastered prerequisite reroutes to it.
  const brokenPrereq = prerequisitesOf(targetId).find((id) => masteryOf(profiles, id) !== 'mastered');
  if (brokenPrereq) {
    return {
      recommended_skill_id: brokenPrereq, kind: 'remediate', mode: 'prerequisite',
      reason: `${getSkill(targetId).skill_name} needs ${getSkill(brokenPrereq).skill_name} first.`,
      confidence_status: 'building',
      remediation_suggestions: [{ skill_id: brokenPrereq, skill_name: getSkill(brokenPrereq).skill_name, why: 'Foundational skill not yet secure.' }],
      fluency_drills: [], all_mastered: false,
    };
  }

  const prof = profOf(profiles, targetId);
  const skill = getSkill(targetId);
  const target = skill.expected_time_seconds * skill.mastery_threshold.speed_grace;
  const acc = prof?.accuracy ?? 0;
  const slow = prof?.median_first_try_seconds != null && prof.median_first_try_seconds > target;
  const tried = (prof?.first_try_attempts ?? 0) >= 4;
  const dom = dominantMisconception(prof);

  // Repeated misconception → prerequisite reinforcement.
  if (dom) {
    const reinforce = prerequisitesOf(targetId)[0] || targetId;
    return {
      recommended_skill_id: targetId, kind: 'reinforce', mode: 'misconception',
      reason: `A repeating slip (${dom.tag}) — a quick reinforcement will clear it.`,
      confidence_status: 'building',
      remediation_suggestions: [{ skill_id: reinforce, skill_name: getSkill(reinforce).skill_name, why: `Repeated misconception: ${dom.tag}.` }],
      fluency_drills: [], dominant_misconception: dom.tag, all_mastered: false,
    };
  }

  // accuracy < 70% → remediation
  if (tried && acc < REMEDIATION_ACCURACY) {
    return {
      recommended_skill_id: targetId, kind: 'remediate', mode: 'remediate',
      reason: `Accuracy is ${Math.round(acc * 100)}% — let's reteach before pushing on.`,
      confidence_status: 'building',
      remediation_suggestions: [{ skill_id: targetId, skill_name: skill.skill_name, why: 'Accuracy below 70%.' }],
      fluency_drills: [], all_mastered: false,
    };
  }

  // accuracy 70–89% → more independent practice
  if (tried && acc >= REMEDIATION_ACCURACY && acc < MASTERY_ACCURACY) {
    return {
      recommended_skill_id: targetId, kind: 'continue', mode: 'independent',
      reason: `Solid at ${Math.round(acc * 100)}% — a little more independent practice to lock it in.`,
      confidence_status: 'steady', remediation_suggestions: [], fluency_drills: [], all_mastered: false,
    };
  }

  // accuracy ≥ 90% but slow → fluency drills
  if (acc >= MASTERY_ACCURACY && slow) {
    return {
      recommended_skill_id: targetId, kind: 'fluency', mode: 'fluency',
      reason: "Accurate but a touch slow — short fluency drills to build speed.",
      confidence_status: 'steady', remediation_suggestions: [],
      fluency_drills: [{ skill_id: targetId, skill_name: skill.skill_name, target_seconds: skill.expected_time_seconds }],
      all_mastered: false,
    };
  }

  // accuracy ≥ 90% and fast → unlock next skill
  if (acc >= MASTERY_ACCURACY && !slow && tried) {
    const nextId = SKILL_ORDER.find((id) => masteryOf(profiles, id) !== 'mastered' && id !== targetId
      && prerequisitesOf(id).every((p) => p === targetId || masteryOf(profiles, p) === 'mastered')) || targetId;
    return {
      recommended_skill_id: nextId, kind: nextId === targetId ? 'continue' : 'advance', mode: 'advance',
      reason: nextId === targetId ? 'Strong work — finish mastering this.' : `Fast and accurate — unlocking ${getSkill(nextId).skill_name}.`,
      confidence_status: 'confident', remediation_suggestions: [], fluency_drills: [], all_mastered: false,
    };
  }

  // Not enough data yet — start or continue.
  const started = masteryOf(profiles, targetId) !== 'not_started';
  return {
    recommended_skill_id: targetId, kind: started ? 'continue' : 'start_new', mode: started ? 'continue' : 'start',
    reason: started ? 'In progress — keep building accuracy and speed.' : 'Prerequisites met. Time to start this skill.',
    confidence_status: confidenceFor(acc), remediation_suggestions: [], fluency_drills: [], all_mastered: false,
  };
}

export async function refreshRecommendation(studentId) {
  const profiles = await getProfiles(studentId);
  const rec = chooseRecommendation(profiles);
  const { recommendations } = await collections();
  await recommendations.updateOne({ student_id: studentId, is_active: true }, { $set: { is_active: false } });
  await recommendations.insertOne({ student_id: studentId, ...rec, is_active: true, generated_at: new Date().toISOString() });
  return { ...rec, skill: getSkill(rec.recommended_skill_id) };
}
