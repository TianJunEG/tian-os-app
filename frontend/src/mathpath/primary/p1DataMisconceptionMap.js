const misconceptions = [
  {
    tag: 'graph_counts_all',
    label: 'Counts all pictures instead of one category',
    description: 'Counted every picture in the graph rather than only the pictures in the asked category.',
    remediationExplanation: 'Look at the label. Find the row or column that matches. Count only those pictures.',
    visualScaffold: 'highlighted_category',
    recheckPattern: 'New picture graph with a different category highlighted.',
    parentNote: 'Point to each row label and ask "Which row are we looking at?" before counting.',
    relatedSkills: ['P1-DAT-01', 'P1-DAT-02'],
  },
  {
    tag: 'graph_counts_across_rows',
    label: 'Counts across different categories',
    description: 'Counted pictures from multiple rows or columns instead of staying within one category.',
    remediationExplanation: 'Stay in one row. Read the label on the left, then count only the pictures next to it.',
    visualScaffold: 'highlighted_category',
    recheckPattern: 'New picture graph where categories have different counts.',
    parentNote: 'Use a finger or ruler to track along one row at a time.',
    relatedSkills: ['P1-DAT-02'],
  },
  {
    tag: 'graph_skips_picture',
    label: 'Skips a picture when counting',
    description: 'Missed one or more pictures when counting within a category.',
    remediationExplanation: 'Touch each picture as you count. Count slowly: 1, 2, 3... Do not skip any.',
    visualScaffold: 'touch_count_overlay',
    recheckPattern: 'New picture graph with a medium-sized category (4-6 items).',
    parentNote: 'Encourage the child to point to each picture and say the number aloud.',
    relatedSkills: ['P1-DAT-02'],
  },
  {
    tag: 'graph_by_preference',
    label: 'Chooses favourite item instead of reading data',
    description: 'Selected an answer based on personal preference rather than what the graph shows.',
    remediationExplanation: 'The graph shows what other people chose. Count the pictures to find the answer, not what you like.',
    visualScaffold: 'comparison_highlight',
    recheckPattern: 'New comparison question with a clearly different "most" category.',
    parentNote: 'Ask "What does the graph say?" not "What do you like?" to redirect attention.',
    relatedSkills: ['P1-DAT-03'],
  },
  {
    tag: 'graph_by_label_length',
    label: 'Picks category with the longest label',
    description: 'Chose the category with the longest word as having the most, ignoring picture counts.',
    remediationExplanation: 'The number of pictures tells us how many, not the length of the word. Count the pictures.',
    visualScaffold: 'comparison_highlight',
    recheckPattern: 'New graph where the shortest label has the most pictures.',
    parentNote: 'Cover the labels and just count pictures first, then check which label matches.',
    relatedSkills: ['P1-DAT-03'],
  },
  {
    tag: 'graph_adds_instead_of_diff',
    label: 'Adds instead of finding difference',
    description: 'Added the two category counts together when the question asked "how many more" or "how many fewer".',
    remediationExplanation: '"How many more" means find the difference. Subtract the smaller from the larger.',
    visualScaffold: 'comparison_model',
    recheckPattern: 'New "how many more/fewer" question with different categories.',
    parentNote: 'Use concrete objects: line up two rows and see how many extra one row has.',
    relatedSkills: ['P1-DAT-05'],
  },
  {
    tag: 'graph_largest_not_total',
    label: 'Gives largest category as total',
    description: 'Gave the count of the largest category instead of adding all categories together.',
    remediationExplanation: '"Altogether" means add every category. Count each row and add them all up.',
    visualScaffold: 'sum_all_categories',
    recheckPattern: 'New total question with a different number of categories.',
    parentNote: 'Write the count next to each category, then add them step by step.',
    relatedSkills: ['P1-DAT-04'],
  },
  {
    tag: 'graph_ignores_question',
    label: 'Answers a different question than asked',
    description: 'Gave an answer to a different question than what was asked (e.g. gave total when asked for difference).',
    remediationExplanation: 'Read the question again carefully. What exactly is it asking? Underline the key words.',
    visualScaffold: 'highlighted_keywords',
    recheckPattern: 'New data question with a clear keyword.',
    parentNote: 'Before solving, ask the child to tell you in their own words what the question is asking.',
    relatedSkills: ['P1-DAT-05'],
  },
  {
    tag: 'graph_draw_mismatch',
    label: 'Draws wrong number of pictures',
    description: 'Drew a different number of pictures than the data requires.',
    remediationExplanation: 'Check the number given. Draw one picture at a time and count as you go.',
    visualScaffold: 'count_and_draw',
    recheckPattern: 'New "complete the graph" question with a different count.',
    parentNote: 'Have the child say the number aloud, then draw and count each picture.',
    relatedSkills: ['P1-DAT-06'],
  },
  {
    tag: 'graph_row_column_confusion',
    label: 'Reads wrong axis of the graph',
    description: 'Read from the wrong row or column, confusing categories with counts or reading the wrong category.',
    remediationExplanation: 'Check which side has the category names. Read across from the correct label.',
    visualScaffold: 'axis_labels_highlight',
    recheckPattern: 'New picture graph with clearly labelled axes.',
    parentNote: 'Point to the labels first and ask "What does this side tell us?" before reading data.',
    relatedSkills: ['P1-DAT-06'],
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
