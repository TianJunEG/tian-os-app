const misconceptions = [
  {
    tag: 'counts_from_one',
    label: 'Counts from 1 instead of counting on',
    description: 'Counts from 1 instead of counting on from the larger number, e.g. for 3 + 4 counts 1, 2, 3, 4, 5, 6, 7 instead of starting at 4 and counting on 3 more.',
    remediationExplanation: 'Start from the bigger number and count on. For 3 + 4, start at 4 and count: 5, 6, 7. You do not need to start at 1 every time.',
    visualScaffold: 'number_line_count_on',
    recheckPattern: 'Show a new addition within 10 and check whether the child counts on from the larger number.',
    parentNote: 'Practise counting on using fingers. Say the larger number first, then put up fingers for the smaller number and count on.',
    relatedSkills: ['P1-ADD-01', 'P1-ADD-03'],
  },
  {
    tag: 'subtracts_wrong_direction',
    label: 'Subtracts the smaller digit from the larger regardless of position',
    description: 'Always subtracts the smaller digit from the larger digit regardless of which number is on top, e.g. for 12 - 5, computes 5 - 2 = 3 for the ones column.',
    remediationExplanation: 'Always take away from the first number. In 8 - 3, start at 8 and take away 3. Do not swap the numbers around.',
    visualScaffold: 'number_line_count_back',
    recheckPattern: 'Show a new subtraction and check whether the child subtracts in the correct direction.',
    parentNote: 'Use counters. Put out the first number and physically remove the second number. This makes the direction clear.',
    relatedSkills: ['P1-ADD-02', 'P1-ADD-04', 'P1-ADD-06'],
  },
  {
    tag: 'forgets_teen_structure',
    label: 'Does not understand teen = 10 + ones',
    description: 'Does not recognise that teen numbers are made of 10 and some ones, e.g. does not see 14 as 10 + 4, leading to errors when adding to or from teens.',
    remediationExplanation: 'Every teen number is 10 and some more. 14 is 10 and 4. 17 is 10 and 7. When you add to a teen, add to the ones part first.',
    visualScaffold: 'ten_frame_with_extras',
    recheckPattern: 'Ask the child to break a teen number into 10 and ones, then solve an addition.',
    parentNote: 'Use a ten-frame. Fill 10 spaces, then show the extra ones beside it. This helps your child see the teen structure.',
    relatedSkills: ['P1-ADD-05'],
  },
  {
    tag: 'adds_ones_to_tens',
    label: 'Adds the ones digit to the tens column',
    description: 'Adds the ones digit of one number to the tens digit of another, e.g. for 23 + 14, adds 4 to 2 instead of keeping tens and ones separate.',
    remediationExplanation: 'Add tens to tens and ones to ones. In 23 + 14: tens are 2 + 1 = 3 tens, ones are 3 + 4 = 7 ones. Answer is 37.',
    visualScaffold: 'column_addition_place_value',
    recheckPattern: 'New two-digit addition. Check whether the child keeps tens and ones in the correct columns.',
    parentNote: 'Write numbers in a place-value chart with a Tens column and a Ones column. Practise adding each column separately.',
    relatedSkills: ['P1-ADD-07'],
  },
  {
    tag: 'subtracts_smaller_from_larger_digit',
    label: 'Always subtracts smaller from larger digit, ignoring position',
    description: 'In column subtraction, always subtracts the smaller digit from the larger digit in each column, ignoring which number is the minuend, e.g. for 32 - 18 writes 2 - 8 as 8 - 2 = 6.',
    remediationExplanation: 'In subtraction, always take the bottom number away from the top number. If the top digit is smaller, you need to regroup (borrow) from the tens.',
    visualScaffold: 'column_subtraction_place_value',
    recheckPattern: 'New column subtraction where the ones digit of the bottom number is larger than the top. Check the child\'s working.',
    parentNote: 'Use base-ten blocks. Show that when the top ones are not enough, you must break a ten into 10 ones before subtracting.',
    relatedSkills: ['P1-ADD-08'],
  },
  {
    tag: 'wrong_operation_word_problem',
    label: 'Uses wrong operation for the word problem',
    description: 'Adds when the problem requires subtraction or vice versa, often triggered by keywords like "more" or "left" being misinterpreted.',
    remediationExplanation: 'Read the problem carefully. If things are put together or joined, add. If things are taken away or lost, subtract. Draw a picture to help.',
    visualScaffold: 'bar_model_word_problem',
    recheckPattern: 'New word problem. Ask the child to circle the action word and choose add or subtract before solving.',
    parentNote: 'Act out word problems with toys. If the story says "gave away", physically remove the toys. If it says "got more", add toys.',
    relatedSkills: ['P1-ADD-09'],
  },
  {
    tag: 'missing_number_adds_all',
    label: 'Adds all visible numbers instead of using inverse operation',
    description: 'When solving ? + 3 = 8 or 9 - ? = 4, adds the two visible numbers (3 + 8 = 11) instead of using the inverse operation to find the missing part.',
    remediationExplanation: 'The missing number is a part of the total. To find it, use the opposite operation. For ? + 3 = 8, think 8 - 3 = 5. For 9 - ? = 4, think 9 - 4 = 5.',
    visualScaffold: 'number_bond_missing_part',
    recheckPattern: 'New missing-number equation. Check whether the child uses the inverse operation.',
    parentNote: 'Use number bonds (part-part-whole diagrams). Cover one part and ask your child to find it by subtracting from the whole.',
    relatedSkills: ['P1-ADD-10'],
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
