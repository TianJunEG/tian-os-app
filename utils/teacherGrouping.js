// Rule-based remediation grouping (master spec §13: deterministic, no AI). Pure
// function — the route supplies each student's weak skills; this buckets students
// who share a weakest skill below the support threshold into suggested groups.
//
// students: [{ studentId, name, weakSkills: [{ skillId, skillName, score }] }]
// Output:   [{ name, basis, targetSkillId, targetSkillName, students: [{studentId,name}] }]

const SUPPORT_BELOW = 40;
const MAX_GROUP = 8;

export function buildSuggestedGroups({ students = [] } = {}) {
  const buckets = new Map(); // skillId -> { skillName, students: [] }

  for (const s of students) {
    const weakest = (s.weakSkills || [])
      .filter((w) => w.score < SUPPORT_BELOW)
      .sort((a, b) => a.score - b.score)[0];
    if (!weakest) continue;
    const key = String(weakest.skillId);
    if (!buckets.has(key)) buckets.set(key, { skillId: weakest.skillId, skillName: weakest.skillName, students: [] });
    const b = buckets.get(key);
    if (b.students.length < MAX_GROUP) b.students.push({ studentId: s.studentId, name: s.name });
  }

  return [...buckets.values()]
    .filter((b) => b.students.length >= 1)
    .sort((a, b) => b.students.length - a.students.length)
    .map((b) => ({
      name: `${b.skillName} Support Group`,
      basis: 'weak_topic',
      targetSkillId: b.skillId,
      targetSkillName: b.skillName,
      students: b.students,
    }));
}
