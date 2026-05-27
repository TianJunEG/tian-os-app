// MathPath placement engine. Estimates where a learner sits — NOT by raw score,
// but by reading the full signal of each attempt: correctness, response SPEED
// (vs the skill's fluency target), HESITATION (time to first input), repeated
// RETRIES, and which MISCONCEPTION a wrong answer revealed. From those it builds
// a mastery + fluency + confidence profile per skill, finds prerequisite gaps,
// and recommends where to start, what to remediate, and what to drill for fluency.
//
// Pure core: analysePlacement(attempts, skills) — no DB. attempts: [{
//   slug, correct, responseMs, hesitationMs, retries, misconceptionTag }].
// DB wrapper: runPlacement(studentId, attempts) loads the Math skill graph.
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';

const ACC_MASTER = 0.8;     // accuracy at/above → "knows it"
const ACC_LEARN = 0.5;      // accuracy at/above → "developing"
const HESITATION_MS = 4000; // time-to-first-input beyond this = hesitation
const median = (xs) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : null);

// Analyse one skill's attempts into a rich signal (not just correct/total).
function analyseSkill(attempts, skill) {
  const n = attempts.length;
  const accuracy = n ? attempts.filter((a) => a.correct).length / n : 0;
  const times = attempts.map((a) => a.responseMs).filter((x) => x > 0);
  const medSec = times.length ? median(times) / 1000 : null;
  const target = skill.metadata?.fluency?.targetSeconds ?? null;
  const retries = attempts.reduce((s, a) => s + (a.retries || 0), 0);
  const hesitations = attempts.filter((a) => (a.hesitationMs || 0) > HESITATION_MS).length;

  const misCounts = {};
  for (const a of attempts) if (!a.correct && a.misconceptionTag) misCounts[a.misconceptionTag] = (misCounts[a.misconceptionTag] || 0) + 1;
  const topMis = Object.entries(misCounts).sort((a, b) => b[1] - a[1])[0];

  // Fluency: fast + accurate = automatic; within ~1.8× target = developing; else effortful.
  let fluency = 'unknown';
  if (target && medSec != null) {
    if (medSec <= target && accuracy >= ACC_MASTER) fluency = 'automatic';
    else if (medSec <= target * 1.8) fluency = 'developing';
    else fluency = 'effortful';
  }
  // Mastery: separate "knows it" from "is fluent at it".
  let mastery;
  if (accuracy >= ACC_MASTER && (fluency === 'automatic' || fluency === 'unknown')) mastery = 'mastered';
  else if (accuracy >= ACC_MASTER) mastery = 'accurate-but-slow';   // a fluency gap, not a knowledge gap
  else if (accuracy >= ACC_LEARN) mastery = 'developing';
  else mastery = 'not-secure';

  // Confidence in this estimate: more attempts, consistent timing, few retries/hesitations.
  let confidence = Math.min(1, n / 5) * 0.6;
  if (retries === 0) confidence += 0.2;
  if (hesitations === 0) confidence += 0.1;
  if (times.length >= 3 && medSec) {
    const spread = (Math.max(...times) - Math.min(...times)) / (medSec * 1000);
    if (spread < 1) confidence += 0.1;
  }
  confidence = Math.round(Math.min(1, confidence) * 100) / 100;

  return {
    slug: skill.slug, name: skill.name, domain: skill.domain, level: skill.moeLevel,
    attempts: n, accuracy: Math.round(accuracy * 100) / 100, medianSeconds: medSec, targetSeconds: target,
    fluency, mastery, retries, hesitations, confidence,
    misconception: topMis ? { tag: topMis[0], count: topMis[1] } : null,
  };
}

export function analysePlacement(attempts, skills) {
  const bySlug = new Map(skills.map((s) => [s.slug, s]));
  const idToSlug = new Map(skills.map((s) => [String(s._id), s.slug]));
  const order = new Map(skills.map((s) => [s.slug, s.metadata?.__order ?? s.order ?? 0]));
  const prereqSlugs = (s) => (s.prerequisiteSkillIds || []).map((id) => idToSlug.get(String(id))).filter(Boolean);

  // group attempts by skill, analyse each
  const grouped = new Map();
  for (const a of attempts) { if (!bySlug.has(a.slug)) continue; (grouped.get(a.slug) || grouped.set(a.slug, []).get(a.slug)).push(a); }
  const profile = [];
  for (const [slug, atts] of grouped) profile.push(analyseSkill(atts, bySlug.get(slug)));

  const masteredSlugs = new Set(profile.filter((p) => p.mastery === 'mastered').map((p) => p.slug));
  const isMastered = (slug) => masteredSlugs.has(slug);

  // Deepest un-mastered prerequisite for a weak skill (the root gap to fix first).
  const rootGap = (slug, seen = new Set()) => {
    if (seen.has(slug)) return slug; seen.add(slug);
    const s = bySlug.get(slug); if (!s) return slug;
    const unmet = prereqSlugs(s).filter((p) => !isMastered(p)).sort((a, b) => (order.get(a) - order.get(b)));
    return unmet.length ? rootGap(unmet[0], seen) : slug;
  };

  const prerequisiteGaps = profile
    .filter((p) => p.mastery === 'not-secure' || p.mastery === 'developing')
    .map((p) => ({ slug: p.slug, name: p.name, rootGap: rootGap(p.slug) }))
    .filter((g) => g.rootGap !== g.slug);

  const fluencyRecommendations = profile
    .filter((p) => p.mastery === 'accurate-but-slow' || (p.fluency === 'effortful' && p.accuracy >= ACC_LEARN))
    .map((p) => ({ slug: p.slug, name: p.name, medianSeconds: p.medianSeconds, targetSeconds: p.targetSeconds, mode: 'fluency_drill' }));

  const remediationPathways = profile
    .filter((p) => p.misconception || p.mastery === 'not-secure')
    .map((p) => ({
      slug: p.slug, name: p.name, misconception: p.misconception,
      reinforce: bySlug.get(p.slug).metadata?.remediation?.reinforce || prereqSlugs(bySlug.get(p.slug)),
      strategy: bySlug.get(p.slug).metadata?.remediation?.strategy || null,
    }));

  // Recommended start: the "ready frontier" — earliest un-mastered skills whose
  // prerequisites are all mastered (or have no prereqs). Falls back to the very
  // first skills if there's no evidence yet.
  const recommendedStartSkills = skills
    .filter((s) => !isMastered(s.slug) && prereqSlugs(s).every((p) => isMastered(p) || !bySlug.get(p)))
    .sort((a, b) => (order.get(a.slug) - order.get(b.slug)))
    .slice(0, 5)
    .map((s) => ({ slug: s.slug, name: s.name, domain: s.domain }));

  // Domain rollup
  const byDomain = {};
  for (const p of profile) {
    const d = (byDomain[p.domain] ||= { mastered: 0, developing: 0, notSecure: 0, fluencyGaps: 0 });
    if (p.mastery === 'mastered') d.mastered++;
    else if (p.mastery === 'developing') d.developing++;
    else if (p.mastery === 'not-secure') d.notSecure++;
    if (p.mastery === 'accurate-but-slow') d.fluencyGaps++;
  }

  const overallConfidence = profile.length
    ? Math.round((profile.reduce((s, p) => s + p.confidence, 0) / profile.length) * 100) / 100 : 0;

  return { masteryProfile: profile, byDomain, prerequisiteGaps, recommendedStartSkills, fluencyRecommendations, remediationPathways, overallConfidence };
}

// DB wrapper: load the Math skill graph (with curriculum order) and analyse.
export async function runPlacement(studentId, attempts) {
  const math = await Subject.findOne({ key: 'math' });
  if (!math) return null;
  const topics = await Topic.find({ subjectId: math._id });
  const torder = new Map(topics.map((t) => [String(t._id), t.order ?? 0]));
  const skills = await Skill.find({ topicId: { $in: topics.map((t) => t._id) } });
  // global curriculum order = topic order then skill order, stashed for the analyser
  for (const s of skills) s.metadata = { ...(s.metadata || {}), __order: (torder.get(String(s.topicId)) ?? 0) * 1000 + (s.order ?? 0) };
  return analysePlacement(attempts, skills);
}
