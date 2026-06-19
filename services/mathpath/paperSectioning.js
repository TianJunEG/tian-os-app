// Group a flat list of generated questions into PSLE-style paper sections.
//
// Singapore PSLE Mathematics convention:
//   - Paper 1: Booklet A (multiple choice) + Booklet B (short answer), NO calculator.
//   - Paper 2: structured / longer questions, calculator ALLOWED.
//
// We keep the questions array flat (so the existing one-at-a-time player keeps
// working) but reorder it by section and tag each question with its section, plus
// return a parallel `sections[]` describing each booklet/section. A question's
// `type` ('mcq' | 'short_answer' | 'open_ended') drives which section it lands in.

// Section templates keyed by a stable id. Order in this list defines paper order.
const SECTION_TEMPLATES = {
  p1a: {
    id: 'p1a', paper: 1, shortName: 'Booklet A',
    name: 'Paper 1 · Booklet A (Multiple Choice)',
    types: ['mcq'],
    instructions: 'Choose the correct option for each question.',
  },
  p1b: {
    id: 'p1b', paper: 1, shortName: 'Booklet B',
    name: 'Paper 1 · Booklet B (Short Answer)',
    types: ['short_answer'],
    instructions: 'Write your answer in the space provided. Show your working.',
  },
  p2: {
    id: 'p2', paper: 2, shortName: 'Paper 2',
    name: 'Paper 2 (Structured Questions)',
    types: ['open_ended'],
    instructions: 'Show all working clearly. Marks are awarded for method.',
  },
  single: {
    id: 'single', paper: 1, shortName: 'Section A',
    name: 'Section A',
    types: ['mcq', 'short_answer', 'open_ended'],
    instructions: 'Answer all questions. Show your working where required.',
  },
};

const SECTION_ORDER = ['p1a', 'p1b', 'p2', 'single'];

// A spec runs the full two-paper booklet format when it's a PSLE mock or its
// paperType explicitly asks for the combined paper.
function isBookletFormat(paperType, testMode) {
  return testMode === 'psle_mock' || String(paperType || '') === 'combined';
}

// Which section template a question belongs to, given the format.
function sectionIdFor(questionType, { booklet, paperType }) {
  if (!booklet) {
    // Single-booklet specs keep the current flat behaviour: one section.
    return 'single';
  }
  if (String(paperType || '') === 'paper2') return 'p2';
  if (questionType === 'mcq') return 'p1a';
  if (questionType === 'open_ended') return 'p2';
  return 'p1b'; // short_answer (and anything else) → Paper 1 Booklet B
}

// Calculator rule per section. PSLE mocks follow the real convention (Paper 1 no
// calculator, Paper 2 calculator allowed); other formats inherit the spec flag.
function sectionCalculator(template, { testMode, calculatorAllowed }) {
  if (testMode === 'psle_mock') return template.paper === 2;
  return Boolean(calculatorAllowed);
}

// Returns { sections, questions } where questions are reordered by section and
// each carries { sectionId, sectionIndex, paper }. Input questions are not mutated.
export function buildPaperSections({ questions = [], paperType = 'paper1', testMode = 'topic_test', calculatorAllowed = false } = {}) {
  const list = Array.isArray(questions) ? questions : [];
  if (!list.length) return { sections: [], questions: [] };

  const booklet = isBookletFormat(paperType, testMode);

  // Bucket questions by section id, preserving original relative order.
  const buckets = new Map();
  for (const q of list) {
    const id = sectionIdFor(String(q.type || 'short_answer'), { booklet, paperType });
    if (!buckets.has(id)) buckets.set(id, []);
    buckets.get(id).push(q);
  }

  const sections = [];
  const orderedQuestions = [];
  let sectionIndex = 0;

  for (const id of SECTION_ORDER) {
    const bucket = buckets.get(id);
    if (!bucket || !bucket.length) continue;
    const template = SECTION_TEMPLATES[id];
    const calc = sectionCalculator(template, { testMode, calculatorAllowed });
    const startIndex = orderedQuestions.length;

    bucket.forEach((q) => {
      orderedQuestions.push({ ...q, sectionId: id, sectionIndex, paper: template.paper });
    });

    sections.push({
      id: template.id,
      paper: template.paper,
      name: template.name,
      shortName: template.shortName,
      questionTypes: template.types,
      instructions: template.instructions,
      calculatorAllowed: calc,
      marks: bucket.reduce((s, q) => s + Number(q.marks || 0), 0),
      questionCount: bucket.length,
      startIndex,
    });
    sectionIndex += 1;
  }

  return { sections, questions: orderedQuestions };
}
