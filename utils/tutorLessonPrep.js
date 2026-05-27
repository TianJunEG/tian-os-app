// Rule-based, deterministic lesson-prep suggestion for a tutor (master spec:
// explainable, no AI planner yet). Pure function — the route supplies shaped
// data; this picks a focus skill, a reason, and a teaching sequence.
//
// records:         [{ skillId, skillName, topicName, score, status, attempts }]
// mistakesBySkill: [{ skillId, skillName, count }]
// overdueCount:    number

export function buildLessonPrep({ records = [], mistakesBySkill = [], overdueCount = 0 } = {}) {
  // Focus: lowest-scoring attempted skill below mastery; else most-mistaken; else first.
  const attemptedBelow = records.filter((r) => r.attempts > 0 && r.score < 70).sort((a, b) => a.score - b.score);
  const mostMistakes = [...mistakesBySkill].sort((a, b) => b.count - a.count)[0];

  let focus = null;
  let reason = '';
  if (attemptedBelow.length) {
    focus = attemptedBelow[0];
    reason = `${focus.skillName} is the lowest mastery (${focus.score}%) and is holding back ${focus.topicName}.`;
  } else if (mostMistakes) {
    focus = { skillId: mostMistakes.skillId, skillName: mostMistakes.skillName };
    reason = `${mostMistakes.skillName} has the most recent mistakes (${mostMistakes.count}).`;
  } else if (records[0]) {
    focus = records[0];
    reason = `Start with ${records[0].skillName} to establish a baseline.`;
  }

  const weakTopics = records
    .filter((r) => r.attempts > 0 && r.score < 70)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((r) => ({ skillId: r.skillId, skillName: r.skillName, topicName: r.topicName, score: r.score }));

  const teachingSequence = [
    'Worked example — model the method on one problem',
    'Guided practice — work through 2–3 together',
    'Independent practice — student solves alone',
    'Fluency drill — short timed set to build speed',
  ];

  const suggestedHomework = focus
    ? { skillId: focus.skillId, skillName: focus.skillName, questionCount: 10, type: 'Digital practice' }
    : null;

  const notes = [];
  if (overdueCount > 0) notes.push(`${overdueCount} assignment${overdueCount > 1 ? 's' : ''} overdue — review at the start.`);

  return { focus, reason, weakTopics, teachingSequence, suggestedHomework, notes };
}
