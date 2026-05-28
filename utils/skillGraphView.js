// Pure builder for the student Skill Graph view (/api/mastery/graph). Decorates a
// math skill set with prerequisite-aware lock/ready state, a per-topic roll-up, a
// summary, and a "ready to learn next" list. Kept pure (no DB) so it is
// unit-testable; the route gathers the data and calls it.
//
// Input:
//   topics:          [{ topicId, name, moeLevel, skills: [Skill] }] in display order,
//                    skills in display order; each Skill has _id, name, moeLevel,
//                    prerequisiteSkillIds.
//   recordsBySkill:  Map<skillIdString, MasteryRecord>
//   masteredIds:     Set<skillIdString> — fresh-mastered only (stale mastery excluded
//                    by the caller, so it doesn't count as a met prerequisite).
import { deriveMastery, fluencyLabel } from './masteryEngine.js';

const sid = (s) => String(s?._id ?? s?.skillId ?? s);

export function buildSkillGraphView({ topics = [], recordsBySkill = new Map(), masteredIds = new Set() } = {}) {
  const skillById = new Map();
  for (const t of topics) for (const s of t.skills || []) skillById.set(sid(s), s);

  const decorate = (s) => {
    const r = recordsBySkill.get(sid(s));
    const status = r?.status || 'not_started';
    const prerequisites = (s.prerequisiteSkillIds || [])
      .map((id) => skillById.get(String(id)))
      .filter(Boolean)
      .map((p) => ({ skillId: p._id ?? p.skillId, name: p.name, mastered: masteredIds.has(sid(p)) }));
    const missing = prerequisites.filter((p) => !p.mastered);
    const ready = missing.length === 0;
    return {
      skillId: s._id ?? s.skillId, name: s.name, moeLevel: s.moeLevel,
      score: r?.score || 0, attempts: r?.attempts || 0,
      status, masteryState: deriveMastery(r || {}), fluency: fluencyLabel(r?.fluencyStatus), streak: r?.streak || 0,
      ready, locked: !ready && status === 'not_started',
      prerequisites, missingPrereqs: missing.map((p) => p.name),
    };
  };

  const topicList = topics.map((t) => {
    const ts = (t.skills || []).map(decorate);
    return {
      topicId: t.topicId ?? t._id, name: t.name, moeLevel: t.moeLevel, skills: ts, total: ts.length,
      masteredCount: ts.filter((s) => s.status === 'mastered').length,
    };
  });

  // Already in curriculum order (topics, then skills within topic).
  const flat = topicList.flatMap((t) => t.skills.map((s) => ({ ...s, topicName: t.name })));
  const attempted = flat.filter((s) => s.attempts > 0);
  const summary = {
    total: flat.length,
    mastered: flat.filter((s) => s.status === 'mastered').length,
    inProgress: flat.filter((s) => s.status === 'learning' || s.status === 'needs_review').length,
    notStarted: flat.filter((s) => s.status === 'not_started').length,
    locked: flat.filter((s) => s.locked).length,
    ready: flat.filter((s) => s.ready && s.status === 'not_started').length,
    avgScore: attempted.length ? Math.round(attempted.reduce((a, s) => a + s.score, 0) / attempted.length) : 0,
  };

  // What to do next: un-mastered with all prerequisites met. In-progress first
  // (weakest score), then freshly-unlocked not-started skills in curriculum order.
  const eligible = flat.filter((s) => s.ready && s.status !== 'mastered');
  const inProgress = eligible.filter((s) => s.status === 'learning' || s.status === 'needs_review').sort((a, b) => a.score - b.score);
  const notStarted = eligible.filter((s) => s.status === 'not_started');
  const readyNext = [...inProgress, ...notStarted].slice(0, 6);

  return { summary, readyNext, topics: topicList };
}
