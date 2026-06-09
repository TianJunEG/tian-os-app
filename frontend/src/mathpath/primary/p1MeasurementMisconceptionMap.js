const misconceptions = [
  {
    tag: 'length_by_position',
    label: 'Compares length by position instead of endpoints',
    description: 'Judged which object is longer based on where it starts or ends rather than measuring the full length.',
    remediationExplanation: 'Line up both objects at one end. The one that sticks out further at the other end is longer.',
    visualScaffold: 'aligned_comparison',
    recheckPattern: 'New pair of objects with staggered starting positions.',
    parentNote: 'Place both objects side by side starting from the same line to compare.',
    relatedSkills: ['P1-MEA-01'],
  },
  {
    tag: 'length_by_thickness',
    label: 'Confuses thickness with length',
    description: 'Chose the thicker object as longer, ignoring actual length.',
    remediationExplanation: 'Length is how far something stretches from one end to the other, not how thick it is.',
    visualScaffold: 'aligned_comparison',
    recheckPattern: 'Compare a thin long object with a thick short object.',
    parentNote: 'Use a string or ruler alongside each object to show that length is the distance from end to end.',
    relatedSkills: ['P1-MEA-01'],
  },
  {
    tag: 'mass_by_size',
    label: 'Thinks bigger means heavier',
    description: 'Assumed the larger object is always heavier without considering material or density.',
    remediationExplanation: 'A big balloon is lighter than a small stone. Size does not always tell us the mass.',
    visualScaffold: 'balance_scale',
    recheckPattern: 'Compare a large light object with a small heavy object.',
    parentNote: 'Let the child hold different objects to feel the difference between size and mass.',
    relatedSkills: ['P1-MEA-02'],
  },
  {
    tag: 'mass_ignores_material',
    label: 'Ignores material when comparing mass',
    description: 'Did not consider that different materials have different masses even at the same size.',
    remediationExplanation: 'A metal spoon is heavier than a plastic spoon of the same size. What something is made of matters.',
    visualScaffold: 'balance_scale',
    recheckPattern: 'Compare two same-sized objects made of different materials.',
    parentNote: 'Discuss real-life examples: a wooden block vs a metal block of the same size.',
    relatedSkills: ['P1-MEA-02'],
  },
  {
    tag: 'capacity_by_height',
    label: 'Chooses taller container as holding more',
    description: 'Selected the taller container without considering that a wider, shorter container may hold more.',
    remediationExplanation: 'A tall, thin glass may hold less water than a short, wide bowl. We must think about width too.',
    visualScaffold: 'container_comparison',
    recheckPattern: 'Compare a tall narrow container with a short wide container.',
    parentNote: 'Pour water from one container to the other to show which holds more.',
    relatedSkills: ['P1-MEA-03'],
  },
  {
    tag: 'capacity_ignores_width',
    label: 'Ignores width when comparing capacity',
    description: 'Only looked at height and ignored how wide the container is.',
    remediationExplanation: 'Both height and width matter. A short but very wide container can hold a lot of water.',
    visualScaffold: 'container_comparison',
    recheckPattern: 'New pair with different shapes.',
    parentNote: 'Use real containers and water at home to explore how shape affects capacity.',
    relatedSkills: ['P1-MEA-03'],
  },
  {
    tag: 'sequence_by_preference',
    label: 'Orders events by preference instead of time',
    description: 'Put favourite activities first rather than ordering events by when they happen during the day.',
    remediationExplanation: 'Think about your day: what do you do when you wake up? What do you do before bed? Put events in that order.',
    visualScaffold: 'timeline',
    recheckPattern: 'New set of daily events to sequence.',
    parentNote: 'Walk through a typical day together: morning, afternoon, evening. Which event fits where?',
    relatedSkills: ['P1-MEA-04'],
  },
  {
    tag: 'sequence_reverses_order',
    label: 'Reverses the time order of events',
    description: 'Put events in reverse order (last event first).',
    remediationExplanation: 'The event that happens earliest in the day comes first. Morning events come before evening events.',
    visualScaffold: 'timeline',
    recheckPattern: 'New set of events including morning and evening activities.',
    parentNote: 'Use words like "first", "then", "last" when talking about daily routines.',
    relatedSkills: ['P1-MEA-04'],
  },
  {
    tag: 'clock_reads_minute_as_hour',
    label: 'Reads the minute hand as the hour',
    description: 'Looked at where the long (minute) hand is pointing and used that number as the hour.',
    remediationExplanation: 'The short hand tells the hour. The long hand pointing to 12 means o\'clock.',
    visualScaffold: 'labelled_clock',
    recheckPattern: 'New o\'clock time to read.',
    parentNote: 'Point out the two hands on a real clock. The short hand is the hour hand.',
    relatedSkills: ['P1-MEA-05'],
  },
  {
    tag: 'clock_confuses_hands',
    label: 'Confuses the hour and minute hands',
    description: 'Mixed up which hand is the hour hand and which is the minute hand.',
    remediationExplanation: 'The short hand shows the hour. The long hand shows the minutes. At o\'clock, the long hand points to 12.',
    visualScaffold: 'labelled_clock',
    recheckPattern: 'New clock reading question.',
    parentNote: 'Remind the child: short hand = hour, long hand = minutes.',
    relatedSkills: ['P1-MEA-05', 'P1-MEA-06'],
  },
  {
    tag: 'half_past_reads_wrong_hour',
    label: 'Reads the wrong hour at half past',
    description: 'At half past, the hour hand is between two numbers. The child read the next number instead of the previous one.',
    remediationExplanation: 'At half past, the hour hand is between two numbers. Read the number it has just passed, not the one it is moving towards.',
    visualScaffold: 'labelled_clock',
    recheckPattern: 'New half-past time to read.',
    parentNote: 'Show on a clock how the hour hand moves slowly. At half past 3, it is between 3 and 4 but we say half past 3.',
    relatedSkills: ['P1-MEA-06'],
  },
  {
    tag: 'half_past_writes_06',
    label: 'Writes half past as :06 instead of :30',
    description: 'Wrote the digital time as 4:06 instead of 4:30, confusing the minute hand pointing at 6 with 6 minutes.',
    remediationExplanation: 'When the long hand points to 6, it means 30 minutes, not 6 minutes. Half past 4 is 4:30.',
    visualScaffold: 'digital_clock',
    recheckPattern: 'New half-past digital time.',
    parentNote: 'Explain that each number on the clock face represents 5 minutes. The 6 means 30 minutes.',
    relatedSkills: ['P1-MEA-06'],
  },
  {
    tag: 'units_gaps_overlaps',
    label: 'Leaves gaps or overlaps when measuring',
    description: 'Did not place the non-standard units end to end, leaving gaps between them or overlapping them.',
    remediationExplanation: 'Place each unit right next to the previous one with no gaps and no overlaps. Start from one end of the object.',
    visualScaffold: 'measurement_line',
    recheckPattern: 'New object to measure with non-standard units.',
    parentNote: 'Practise lining up paper clips or cubes along a pencil, making sure they touch without overlapping.',
    relatedSkills: ['P1-MEA-07'],
  },
  {
    tag: 'units_mixed_sizes',
    label: 'Uses units of different sizes',
    description: 'Mixed different-sized units when measuring (e.g. some big paper clips and some small ones).',
    remediationExplanation: 'Use units that are all the same size. If you use paper clips, they must all be the same length.',
    visualScaffold: 'measurement_line',
    recheckPattern: 'New measurement with emphasis on equal units.',
    parentNote: 'Provide identical units for practice. Discuss why mixing sizes gives the wrong answer.',
    relatedSkills: ['P1-MEA-07'],
  },
];

const misconceptionByTag = new Map(misconceptions.map((m) => [m.tag, m]));

export function getMisconception(tag) {
  return misconceptionByTag.get(tag) || null;
}

export function getMisconceptionsForSkill(skillId) {
  return misconceptions.filter((m) => m.relatedSkills.includes(skillId));
}

export function getAllMisconceptions() {
  return [...misconceptions];
}

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
