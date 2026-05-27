// Rule-based parent recommendations (master spec §13: keep it explainable,
// deterministic — no AI engine yet). Pure function so it is unit-testable; the
// route gathers the data and calls it.
//
// Input (all from the shared mastery/mistake/assignment data):
//   records:        [{ skillId, skillName, topicName, score, status, attempts }]
//   mistakesBySkill:[{ skillId, skillName, count }]
//   assignments:    [{ status, dueDate }]
//   lastPracticedAt: Date | null
// Output: [{ actionType, priority, reason, action, relatedSkillId?, relatedSkillName? }]

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export function buildRecommendations({
  records = [], mistakesBySkill = [], assignments = [], lastPracticedAt = null, now = new Date(),
} = {}) {
  const recs = [];

  // Overdue assignment → follow up (high).
  const overdue = assignments.filter(
    (a) => a.status === 'overdue' || (a.dueDate && a.status !== 'completed' && new Date(a.dueDate) < now)
  );
  if (overdue.length) {
    recs.push({ actionType: 'follow_up_assignment', priority: 'high',
      reason: `${overdue.length} assignment${overdue.length > 1 ? 's' : ''} past due.`,
      action: 'Follow up on overdue assignment' });
  }

  // 3+ recent mistakes in a named skill → review (high). A nameless skill (e.g.
  // a non-MathPath record whose ref doesn't resolve) would render blank text and
  // a mis-routed link, so skip it.
  for (const m of mistakesBySkill) {
    if (m.count >= 3 && m.skillName) {
      recs.push({ actionType: 'review_mistakes', priority: 'high',
        reason: `${m.count} recent mistakes in ${m.skillName}.`,
        action: 'Review recent mistakes', relatedSkillId: m.skillId, relatedSkillName: m.skillName });
    }
  }

  // Weak skill (attempted, mastery < 40) → assign practice (high). Require a name
  // for the same reason as the mistakes rule above.
  const weak = records.filter((r) => r.attempts > 0 && r.score < 40 && r.skillName).sort((a, b) => a.score - b.score);
  for (const w of weak.slice(0, 2)) {
    recs.push({ actionType: 'assign_practice', priority: 'high',
      reason: `${w.skillName} mastery is low (${w.score}%).`,
      action: 'Assign practice for this weak skill', relatedSkillId: w.skillId, relatedSkillName: w.skillName });
  }

  // Inactivity → restart practice (medium).
  if (lastPracticedAt) {
    const days = Math.floor((now - new Date(lastPracticedAt)) / 86400000);
    if (days >= 7) {
      recs.push({ actionType: 'restart_practice', priority: 'medium',
        reason: `No practice in ${days} days.`, action: 'Restart a 10-minute MathPath practice' });
    }
  } else if (records.length === 0) {
    recs.push({ actionType: 'restart_practice', priority: 'medium',
      reason: 'No practice yet.', action: 'Start a 10-minute MathPath practice' });
  }

  // Progress → celebrate + continue (low).
  const mastered = records.filter((r) => r.status === 'mastered');
  if (mastered.length) {
    recs.push({ actionType: 'celebrate', priority: 'low',
      reason: `${mastered.length} skill${mastered.length > 1 ? 's' : ''} mastered — nice momentum.`,
      action: 'Continue to the next skill' });
  }

  return recs.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}
