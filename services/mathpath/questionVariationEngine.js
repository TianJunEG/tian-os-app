function textOf(question = {}) {
  return String(question.questionText || question.prompt || question.text || question.stem || '').trim();
}

function normalizeText(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/\b\d+\s*\/\s*\d+\b/g, '<fraction>')
    .replace(/\b\d+\.\d+\b/g, '<number>')
    .replace(/\b\d+\b/g, '<number>')
    .replace(/\b(ali|ben|sarah|mei|john|mary|tom|lily|raj|siti)\b/g, '<name>')
    .replace(/\b(cards?|stickers?|apples?|marbles?|books?|pencils?|cookies?|problems?)\b/g, '<object>')
    .replace(/\s+/g, ' ')
    .trim();
}

function numberSignature(value = '') {
  return [...String(value || '').matchAll(/\b\d+\s*\/\s*\d+\b|\b\d+\.\d+\b|\b\d+\b/g)].map((match) => match[0]);
}

function structureSignature(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/\b\d+\s*\/\s*\d+\b/g, 'F')
    .replace(/\b\d+\.\d+\b/g, 'N')
    .replace(/\b\d+\b/g, 'N')
    .replace(/[a-z]+/g, 'w')
    .replace(/\s+/g, ' ')
    .trim();
}

function groupBy(items = [], keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    if (!key) return acc;
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(item);
    return acc;
  }, new Map());
}

function rowId(question = {}, index = 0) {
  return question._id?.toString?.() || question.id || question.questionId || question.fingerprint || `question_${index + 1}`;
}

function repeatedGroups(groups, minimumRepeats = 3) {
  return [...groups.entries()]
    .filter(([, rows]) => rows.length >= minimumRepeats)
    .map(([signature, rows]) => ({
      signature,
      count: rows.length,
      questionIds: rows.map((row) => row.id),
      examples: rows.slice(0, 3).map((row) => row.text),
    }))
    .sort((a, b) => b.count - a.count);
}

export function analyseQuestionVariation(questions = [], { minimumRepeats = 3 } = {}) {
  const rows = (questions || []).map((question, index) => {
    const text = textOf(question);
    return {
      id: rowId(question, index),
      skillId: question.skillId || question.skillCode || '',
      templateId: question.templateId || '',
      text,
      normalizedText: normalizeText(text),
      numberSignature: numberSignature(text).join('|'),
      structureSignature: structureSignature(text),
    };
  }).filter((row) => row.text);

  const wordingGroups = repeatedGroups(groupBy(rows, (row) => row.normalizedText), minimumRepeats);
  const numberGroups = repeatedGroups(groupBy(rows, (row) => row.numberSignature), minimumRepeats)
    .filter((group) => group.signature);
  const structureGroups = repeatedGroups(groupBy(rows, (row) => row.structureSignature), minimumRepeats + 2);

  const repeatedQuestionIds = new Set([
    ...wordingGroups.flatMap((group) => group.questionIds),
    ...numberGroups.flatMap((group) => group.questionIds),
    ...structureGroups.flatMap((group) => group.questionIds),
  ]);
  const diversityScore = rows.length
    ? Math.max(0, Math.round(100 - (repeatedQuestionIds.size / rows.length) * 100))
    : 100;

  return {
    totalQuestions: rows.length,
    diversityScore,
    repeatedTemplates: wordingGroups,
    repeatedNumbers: numberGroups,
    repeatedStructures: structureGroups,
    repeatedQuestionCount: repeatedQuestionIds.size,
  };
}

export function normalizeQuestionTemplate(value = '') {
  return normalizeText(value);
}

export default {
  analyseQuestionVariation,
  normalizeQuestionTemplate,
};
