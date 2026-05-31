function wholeAnswer(value) {
  return { type: 'whole', whole: value, display: String(value) };
}

function textAnswer(value) {
  return { type: 'text', value, display: value };
}

function listAnswer(values) {
  return { type: 'list', value: values, display: values.join(', ') };
}

function repairSetFractionQuestion(question) {
  const prompt = String(question?.prompt || question?.stem || '');
  const match = prompt.match(
    /^A set has (\d+) objects\.\s+(\d+)\/(\d+) of them are selected\. How many are selected\?$/i
  );
  if (!match) return question;

  const total = Number(match[1]);
  const numerator = Number(match[2]);
  const denominator = Number(match[3]);
  if (!denominator || total % denominator === 0) return question;

  const groups = Math.max(2, Math.ceil(total / denominator));
  const repairedTotal = denominator * groups;
  const selected = numerator * groups;
  return {
    ...question,
    prompt: `A set has ${repairedTotal} objects. ${numerator}/${denominator} of them are selected. How many are selected?`,
    answer: wholeAnswer(selected),
    acceptedAnswers: [String(selected)],
    solutionSteps: [
      `Find 1/${denominator} of ${repairedTotal}: ${repairedTotal}/${denominator} = ${groups}.`,
      `Multiply by ${numerator}: ${selected}.`,
    ],
  };
}

function repairDuplicateGreaterQuestion(question) {
  const prompt = String(question?.prompt || question?.stem || '');
  const match = prompt.match(/^Which is greater:\s+(\d+)\/(\d+)\s+or\s+(\d+)\/(\d+)\?$/i);
  if (!match) return question;

  const leftNumerator = Number(match[1]);
  const leftDenominator = Number(match[2]);
  const rightNumerator = Number(match[3]);
  const rightDenominator = Number(match[4]);
  if (leftNumerator !== rightNumerator || leftDenominator !== rightDenominator) return question;

  const repairedRightDenominator = rightDenominator < 12 ? rightDenominator + 1 : rightDenominator - 1;
  const left = `${leftNumerator}/${leftDenominator}`;
  const right = `${rightNumerator}/${repairedRightDenominator}`;
  const leftValue = leftNumerator / leftDenominator;
  const rightValue = rightNumerator / repairedRightDenominator;
  const greater = leftValue > rightValue ? left : right;

  return {
    ...question,
    prompt: `Which is greater: ${left} or ${right}?`,
    answer: textAnswer(greater),
    acceptedAnswers: [greater],
    solutionSteps: ['Compare the two fraction values.', `${greater} is greater.`],
  };
}

function ordinalWord(n) {
  return ({
    1: 'first',
    2: 'second',
    3: 'third',
    4: 'fourth',
    5: 'fifth',
    6: 'sixth',
    7: 'seventh',
    8: 'eighth',
    9: 'ninth',
    10: 'tenth',
    11: 'eleventh',
    12: 'twelfth',
  })[n] || `${n}th`;
}

function repairNumberLineOrdinalQuestion(question) {
  const prompt = String(question?.prompt || question?.stem || '');
  const match = prompt.match(
    /^On a number line from 0 to 1 split into (\d+) equal parts, what fraction is at the (\d+)(?:st|nd|rd|th) mark after 0\?$/i
  );
  if (!match) return question;

  const parts = Number(match[1]);
  const mark = Number(match[2]);
  return {
    ...question,
    prompt: `On a number line from 0 to 1 divided into ${parts} equal parts, what fraction is at the ${ordinalWord(mark)} mark after 0?`,
  };
}

function repairDuplicateOrderingQuestion(question) {
  const prompt = String(question?.prompt || question?.stem || '');
  const match = prompt.match(/^Order these fractions from smallest to largest:\s+(.+?)\.$/i);
  if (!match) return question;

  const shown = match[1].split(',').map((part) => part.trim()).filter(Boolean);
  const unique = new Set(shown.map((part) => part.replace(/\s+/g, '')));
  if (shown.length !== 3 || unique.size === 3) return question;

  const replacement = ['1/4', '1/2', '3/4'];
  return {
    ...question,
    prompt: `Order these fractions from smallest to largest: ${replacement.join(', ')}.`,
    answer: listAnswer(replacement),
    acceptedAnswers: [replacement.join(','), replacement.join(', ')],
    solutionSteps: ['Compare the fraction values.', `Order: ${replacement.join(', ')}.`],
  };
}

export function repairFractionQuestion(question) {
  return repairDuplicateOrderingQuestion(
    repairNumberLineOrdinalQuestion(repairDuplicateGreaterQuestion(repairSetFractionQuestion(question)))
  );
}

export function repairFractionQuestions(questions = []) {
  return questions.map(repairFractionQuestion);
}
