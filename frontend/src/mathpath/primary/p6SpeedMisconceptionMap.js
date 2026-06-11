const misconceptions = [
  {
    tag: 'averages_speeds_instead_of_total',
    label: 'Averages the two speeds instead of using total distance ÷ total time',
    description: 'Calculates average speed by adding the two speeds and dividing by 2, e.g. (60 + 40) ÷ 2 = 50 km/h, instead of using total distance ÷ total time.',
    remediationExplanation: 'Average speed is NOT the average of two speeds. You must find the total distance of the entire journey and the total time taken, then divide: Average speed = Total distance ÷ Total time.',
    visualScaffold: 'journey_timeline',
    recheckPattern: 'A car drove 120 km at 60 km/h and 120 km at 40 km/h. Find the average speed. (It is NOT 50 km/h.)',
    parentNote: 'This is the most common misconception in P6 speed problems. Help your child by asking: "What is the total distance? What is the total time?" before they calculate average speed.',
    relatedSkills: ['P6-SPD-02'],
  },
  {
    tag: 'confuses_speed_distance_time_formula',
    label: 'Mixes up which quantity to multiply or divide',
    description: 'Confuses the three formulas: Speed = Distance ÷ Time, Distance = Speed × Time, Time = Distance ÷ Speed. For example, multiplies distance by time instead of dividing.',
    remediationExplanation: 'Remember the triangle: Distance on top, Speed and Time on the bottom. Cover what you want to find. D = S × T, S = D ÷ T, T = D ÷ S.',
    visualScaffold: 'speed_triangle',
    recheckPattern: 'A bus travels 240 km in 4 hours. What is its speed?',
    parentNote: 'Draw the Speed-Distance-Time triangle with your child. Distance goes on top, Speed and Time on the bottom. Cover the letter you want to find to see the formula.',
    relatedSkills: ['P6-SPD-01', 'P6-SPD-02'],
  },
  {
    tag: 'forgets_time_unit_conversion',
    label: 'Forgets to convert minutes to hours or vice versa',
    description: 'Uses minutes as if they were decimal fractions of hours, e.g. treats 30 minutes as 0.30 hours instead of 0.5 hours, or forgets to convert altogether.',
    remediationExplanation: 'Always convert time to the same unit before calculating. 30 minutes = 0.5 hours (not 0.3). 15 minutes = 0.25 hours. 45 minutes = 0.75 hours. Divide the minutes by 60 to convert to hours.',
    visualScaffold: 'time_conversion_chart',
    recheckPattern: 'A cyclist travelled 45 km in 1 hour 30 minutes. What was his speed in km/h?',
    parentNote: 'Remind your child that 1 hour = 60 minutes, not 100. So 30 minutes = 30/60 = 1/2 hour = 0.5 hours. Practise converting common minute values: 15 min = 0.25 h, 30 min = 0.5 h, 45 min = 0.75 h.',
    relatedSkills: ['P6-SPD-01', 'P6-SPD-02', 'P6-SPD-03'],
  },
  {
    tag: 'uses_wrong_formula_arrangement',
    label: 'Uses the wrong rearrangement of the speed formula',
    description: 'Knows the basic formula but rearranges it incorrectly. For example, to find time, divides speed by distance instead of distance by speed.',
    remediationExplanation: 'Use the triangle method: write D on top, S and T on the bottom. To find Time, cover T and you see D ÷ S. To find Distance, cover D and you see S × T. To find Speed, cover S and you see D ÷ T.',
    visualScaffold: 'speed_triangle',
    recheckPattern: 'A van travels 200 km at 50 km/h. How long does the journey take?',
    parentNote: 'If your child keeps mixing up the formulas, practise the triangle: Distance on top, Speed and Time below. Cover what you need to find.',
    relatedSkills: ['P6-SPD-01', 'P6-SPD-03'],
  },
  {
    tag: 'ignores_rest_stops_in_time',
    label: 'Does not include rest stop time when calculating average speed',
    description: 'When a journey includes a rest stop, the student calculates average speed using only the driving time and ignores the time spent resting.',
    remediationExplanation: 'Average speed for a whole journey includes ALL time from start to finish, including any rest stops or breaks. Total time = driving time + rest time.',
    visualScaffold: 'journey_timeline',
    recheckPattern: 'Ali drove for 2 hours, rested for 30 minutes, then drove for 1 more hour. What was the total time for the journey?',
    parentNote: 'When the question says "average speed for the whole journey", the rest stop is part of the journey. Make sure your child adds up ALL the time, not just the driving time.',
    relatedSkills: ['P6-SPD-03'],
  },
  {
    tag: 'subtracts_speeds_for_same_direction',
    label: 'Subtracts speeds when objects move towards each other (or adds for same direction)',
    description: 'Confuses when to add and when to subtract speeds. Subtracts speeds for objects moving towards each other (should add), or adds speeds for same-direction catching-up problems (should subtract).',
    remediationExplanation: 'Moving towards each other (meeting): ADD the speeds — the gap closes at (speed A + speed B) per hour. Same direction (catching up): SUBTRACT the speeds — the gap closes at (faster speed − slower speed) per hour.',
    visualScaffold: 'direction_arrows',
    recheckPattern: 'Car A travels east at 60 km/h. Car B travels west towards Car A at 40 km/h. How fast is the gap between them closing?',
    parentNote: 'Draw arrows showing the direction of travel. If they are heading towards each other, the gap shrinks by the sum of their speeds. If one is chasing the other, the gap shrinks by the difference.',
    relatedSkills: ['P6-SPD-03'],
  },
  {
    tag: 'distance_not_additive_for_average',
    label: 'Fails to add distances for total distance in average speed',
    description: 'When computing average speed, uses only one leg distance or forgets that total distance is the sum of all parts.',
    remediationExplanation: 'For average speed, you need the TOTAL distance. If the journey has multiple parts, add all the distances together: Total distance = distance of part 1 + distance of part 2 + ...',
    visualScaffold: 'journey_bar_model',
    recheckPattern: 'Siti drove 80 km then 120 km. What was the total distance?',
    parentNote: 'Draw a bar model showing each part of the journey end-to-end. The total bar represents total distance. This helps your child see that distances add up.',
    relatedSkills: ['P6-SPD-02'],
  },
  {
    tag: 'time_in_hours_not_minutes',
    label: 'Gives time answer in hours when minutes are expected, or vice versa',
    description: 'Calculates the time correctly but gives it in the wrong unit. For example, gets 1.5 hours but writes "1.5 minutes" or "1 hour 5 minutes" instead of "1 hour 30 minutes".',
    remediationExplanation: 'After calculating time, check the unit the question asks for. To convert hours to minutes, multiply by 60. To convert a decimal hour: 0.5 h = 30 min, 0.25 h = 15 min, 0.75 h = 45 min. Do NOT treat the decimal as minutes.',
    visualScaffold: 'time_conversion_chart',
    recheckPattern: 'Convert 2.5 hours to hours and minutes.',
    parentNote: 'A very common slip: your child may write 1.5 hours as "1 hour 5 minutes" instead of "1 hour 30 minutes". Practise converting decimal hours: the part after the decimal point is NOT minutes — multiply it by 60.',
    relatedSkills: ['P6-SPD-01', 'P6-SPD-03'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) { return misconceptionByTag.get(tag) || null; }
export function getMisconceptionsForSkill(skillId) {
  return misconceptions.filter((m) => m.relatedSkills.includes(skillId));
}
export function getAllMisconceptions() { return [...misconceptions]; }
export function getRemediationForTag(tag) {
  const m = misconceptionByTag.get(tag);
  if (!m) return null;
  return { tag: m.tag, explanation: m.remediationExplanation, visualScaffold: m.visualScaffold, recheckPattern: m.recheckPattern, parentNote: m.parentNote };
}

export default { getMisconception, getMisconceptionsForSkill, getAllMisconceptions, getRemediationForTag };
