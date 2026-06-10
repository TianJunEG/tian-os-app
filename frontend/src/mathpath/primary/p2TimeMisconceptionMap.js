const misconceptions = [
  {
    tag: 'confuses_hour_minute_hands',
    label: 'Confuses the hour hand and the minute hand',
    description: 'Reads the minute hand as the hour and the hour hand as the minutes, swapping the two values.',
    remediationExplanation: 'The short hand shows the hour and the long hand shows the minutes. Remember: the long hand takes longer to go around, and it counts the minutes.',
    visualScaffold: 'clock_hand_labels',
    recheckPattern: 'Read a clock where the hour hand points to 4 and the minute hand points to 6.',
    parentNote: 'Use an analogue clock at home. Ask: "Which is the short hand? That tells us the hour. Which is the long hand? That tells us the minutes."',
    relatedSkills: ['P2-TM-01'],
  },
  {
    tag: 'reads_minutes_as_hours',
    label: 'Reads the minute-hand number as the minute value',
    description: 'Sees the minute hand pointing at 9 and writes 9 minutes instead of 45 minutes.',
    remediationExplanation: 'Each number on the clock stands for 5 minutes. The minute hand at 9 means 9 × 5 = 45 minutes, not 9 minutes. Count by fives: 5, 10, 15, 20, 25, 30, 35, 40, 45.',
    visualScaffold: 'clock_five_minute_markers',
    recheckPattern: 'The minute hand points to 7. How many minutes is that?',
    parentNote: 'Practise skip-counting by 5s around the clock face: 5, 10, 15 ... 55, 60. Ask: "The hand points to 3 -- how many minutes?"',
    relatedSkills: ['P2-TM-01'],
  },
  {
    tag: 'off_by_five_minutes',
    label: 'Off by 5 minutes when reading the clock',
    description: 'Reads 7:40 as 7:35 or 7:45 because of miscounting the five-minute intervals.',
    remediationExplanation: 'Start at 12 and count by fives: 12 = 0, 1 = 5, 2 = 10, 3 = 15 ... Go slowly and point to each number as you count.',
    visualScaffold: 'clock_five_minute_count',
    recheckPattern: 'The minute hand points to 8. What time does the clock show if the hour hand is past 3?',
    parentNote: 'Have your child touch each number on the clock and say the minutes aloud: 5, 10, 15, 20 ... until they reach the minute hand.',
    relatedSkills: ['P2-TM-01'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) { return misconceptionByTag.get(tag) || null; }
export function getMisconceptionsForSkill(skillId) { return misconceptions.filter((m) => m.relatedSkills.includes(skillId)); }
export function getAllMisconceptions() { return [...misconceptions]; }

export function getRemediationForTag(tag) {
  const m = misconceptionByTag.get(tag);
  if (!m) return null;
  return { tag: m.tag, explanation: m.remediationExplanation, visualScaffold: m.visualScaffold, recheckPattern: m.recheckPattern, parentNote: m.parentNote };
}

export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
