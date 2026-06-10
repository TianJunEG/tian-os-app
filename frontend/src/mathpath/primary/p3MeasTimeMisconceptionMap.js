const misconceptions = [
  {
    tag: 'wrong_conversion_factor',
    label: 'Uses the wrong conversion factor between units',
    description: 'Converts metres to centimetres by multiplying by 10 instead of 100, or kilograms to grams by multiplying by 100 instead of 1000.',
    remediationExplanation: 'Key facts: 1 m = 100 cm, 1 km = 1000 m, 1 kg = 1000 g, 1 L = 1000 mL. Memorise these four conversions.',
    visualScaffold: 'conversion_chart',
    recheckPattern: 'Convert 3 m 45 cm to cm.',
    parentNote: 'Make a poster: 1 m = 100 cm, 1 km = 1000 m, 1 kg = 1000 g, 1 L = 1000 mL. Quiz your child regularly.',
    relatedSkills: ['P3-MT-01'],
  },
  {
    tag: 'adds_without_converting',
    label: 'Adds the two parts without converting the big unit',
    description: 'Writes 2 m 30 cm = 2 + 30 = 32 cm instead of 200 + 30 = 230 cm.',
    remediationExplanation: 'First convert the big unit: 2 m = 200 cm. Then add the small unit: 200 + 30 = 230 cm.',
    visualScaffold: 'compound_unit_breakdown',
    recheckPattern: 'Convert 4 kg 250 g to g.',
    parentNote: 'Ask: "How many small units are in one big unit?" Then multiply and add.',
    relatedSkills: ['P3-MT-01'],
  },
  {
    tag: 'unit_label_swap',
    label: 'Writes the answer with the wrong unit label',
    description: 'Converts 2 m 30 cm and writes the answer as 230 m instead of 230 cm.',
    remediationExplanation: 'When converting to the smaller unit, the answer is in the smaller unit. 2 m 30 cm = 230 cm (not metres).',
    visualScaffold: 'unit_label_highlight',
    recheckPattern: 'Convert to the smaller unit and write the correct label.',
    parentNote: 'Circle the unit label in every answer. Ask: "Are we measuring in cm or m?"',
    relatedSkills: ['P3-MT-01'],
  },
  {
    tag: 'reads_minute_hand_as_hour',
    label: 'Reads the minute hand as the hour',
    description: 'Sees minute hand pointing at 6 and reads the time as 6 o\'clock instead of reading 30 minutes.',
    remediationExplanation: 'The short hand shows the hour and the long hand shows the minutes. The long hand pointing at 6 means 30 minutes, not 6 o\'clock.',
    visualScaffold: 'clock_hand_labels',
    recheckPattern: 'Read the time on a clock where the minute hand is not at 12.',
    parentNote: 'Use an analogue clock at home. Ask: "Which is the short hand? Which is the long hand?" The short hand = hour, long hand = minutes.',
    relatedSkills: ['P3-MT-02'],
  },
  {
    tag: 'off_by_one_hour',
    label: 'Reads the hour wrong when minute hand is past the hour',
    description: 'At 3:45, reads the hour as 4 because the hour hand is close to 4.',
    remediationExplanation: 'The hour hand moves slowly. At 3:45 the hour hand is between 3 and 4, but it has not reached 4 yet — so the hour is still 3.',
    visualScaffold: 'hour_hand_between_numbers',
    recheckPattern: 'Read the time when the minute hand is past 30.',
    parentNote: 'Point out that the hour hand moves slowly. "Has it passed the 4? No — so it is still 3 something."',
    relatedSkills: ['P3-MT-02'],
  },
  {
    tag: 'counts_minutes_by_fives_only',
    label: 'Only counts minutes in fives, ignoring extra minutes',
    description: 'Reads 10:37 as 10:35 because they only count by fives and ignore the extra 2 minutes.',
    remediationExplanation: 'Each number on the clock face is 5 minutes. After counting by fives, count on by ones for the extra tick marks. 7 × 5 = 35, plus 2 more = 37 minutes.',
    visualScaffold: 'clock_with_minute_marks',
    recheckPattern: 'Read a time where the minute hand is not exactly on a number.',
    parentNote: 'Practise reading times like 2:17 or 8:43. Count by fives to the nearest number, then count the extra tick marks by ones.',
    relatedSkills: ['P3-MT-02'],
  },
  {
    tag: 'forgets_add_12_for_pm',
    label: 'Forgets to add 12 when converting p.m. to 24-hour time',
    description: 'Writes 3:45 p.m. as 03:45 instead of 15:45.',
    remediationExplanation: 'For p.m. times (after noon), add 12 to the hour. 3:45 p.m. → 3 + 12 = 15 → 15:45. Exception: 12:00 p.m. (noon) stays as 12:00.',
    visualScaffold: '24h_clock_circle',
    recheckPattern: 'Convert 4:30 p.m. to 24-hour time.',
    parentNote: 'For afternoon times: add 12 to the hour. 1 p.m. = 13:00, 2 p.m. = 14:00, etc. Practise with daily routines: lunch at 12:30, school ends at 14:00.',
    relatedSkills: ['P3-MT-03'],
  },
  {
    tag: 'confuses_midnight_noon',
    label: 'Mixes up midnight (00:00) and noon (12:00)',
    description: 'Writes midnight as 12:00 and noon as 00:00, reversing the two.',
    remediationExplanation: 'Midnight = 00:00 (start of a new day). Noon = 12:00 (middle of the day). 12 a.m. = midnight = 00:00. 12 p.m. = noon = 12:00.',
    visualScaffold: 'midnight_noon_timeline',
    recheckPattern: 'What is midnight in 24-hour time? What is noon?',
    parentNote: 'Draw a timeline: midnight (00:00) on the left, noon (12:00) in the middle, next midnight (00:00 / 24:00) on the right.',
    relatedSkills: ['P3-MT-03'],
  },
  {
    tag: 'drops_leading_zero_24h',
    label: 'Drops the leading zero in 24-hour times before 10:00',
    description: 'Writes 9:15 instead of 09:15 for morning times in 24-hour notation.',
    remediationExplanation: '24-hour time always uses two digits for the hour: 01:00, 02:30, 09:15. Write the leading zero for hours 00-09.',
    visualScaffold: '24h_format_example',
    recheckPattern: 'Write 7:05 a.m. in 24-hour notation.',
    parentNote: 'Remind your child: 24-hour time always has four digits (HH:MM). Morning hours before 10 need a zero in front.',
    relatedSkills: ['P3-MT-03'],
  },
  {
    tag: 'subtracts_minutes_across_hour_wrong',
    label: 'Subtracts minutes across an hour boundary incorrectly',
    description: 'Finds the duration from 9:45 to 10:20 as 10:20 - 9:45 = 1:75 = 75 minutes instead of correctly finding 35 minutes.',
    remediationExplanation: 'Break it into two parts: from 9:45 to 10:00 is 15 minutes, from 10:00 to 10:20 is 20 minutes. Total = 15 + 20 = 35 minutes.',
    visualScaffold: 'duration_number_line',
    recheckPattern: 'Find the duration from 8:50 to 9:30.',
    parentNote: 'Use a "count on" strategy: jump to the next hour first, then add the remaining minutes. Draw a number line with the two times.',
    relatedSkills: ['P3-MT-04'],
  },
  {
    tag: 'treats_60min_as_100',
    label: 'Treats 60 minutes as 100 when calculating time',
    description: 'Adds 45 minutes to 2:30 and gets 2:75 instead of 3:15.',
    remediationExplanation: 'There are 60 minutes in an hour, not 100. When minutes go past 59, subtract 60 and add 1 hour. 30 + 45 = 75 minutes = 1 hour 15 minutes → 3:15.',
    visualScaffold: 'clock_60_minutes',
    recheckPattern: 'What time is 50 minutes after 1:40?',
    parentNote: 'Remind your child: "When the minutes pass 59, a new hour starts." Practise with real clock movements.',
    relatedSkills: ['P3-MT-04'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) { return misconceptionByTag.get(tag) || null; }
export function getMisconceptionsForSkill(skillId) { return misconceptions.filter((m) => m.relatedSkills.includes(skillId)); }
export function getAllMisconceptions() { return [...misconceptions]; }

export function getRemediationForTag(tag) {
  const m = misconceptionByTag.get(tag);
  if (!m) return null;
  return {
    tag: m.tag,
    explanation: m.remediationExplanation,
    visualScaffold: m.visualScaffold,
    recheckPattern: m.recheckPattern,
    parentNote: m.parentNote,
  };
}

export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
