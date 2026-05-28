// /api/skills?subject=science returns a flat list of skills (one per topic with
// the legacy-bank import). The assign-practice flows want the same nested
// { topicId, name, skills: [{ skillId, name }] } shape mathpathAPI.map produces
// so the topic/skill drop-downs can be rendered with one component.
//
// Topic name is suffixed with the MOE level (P3 / P4 / P5 / P6) because the
// same topic name recurs across levels (e.g. "Digestive System" at P4 and P5).
// Previously duplicated in pages/teacher/AssignPractice and pages/tutor/
// AssignHomework; extracted here so the parent AssignPractice can use it too.
export function shapeScienceAsTopics(skills) {
  const byTopic = new Map();
  for (const s of skills) {
    const id = String(s.topicId);
    if (!byTopic.has(id)) byTopic.set(id, {
      topicId: s.topicId,
      name: `${s.topicName}${s.moeLevel ? ' · ' + s.moeLevel.replace('Primary ', 'P') : ''}`,
      skills: [],
    });
    byTopic.get(id).skills.push({ skillId: s.skillId, name: s.name });
  }
  return [...byTopic.values()];
}
