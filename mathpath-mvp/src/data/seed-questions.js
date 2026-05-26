// seed-questions.js — a small curated seed bank for the MathPath MVP.
//
// MathPath generates items procedurally at runtime (see lib/questions.js); this bank is a
// curated reference/seed set — a few representative items per skill for QA, demos, and as a
// template for the question shape. Math is written KaTeX-compatible (\frac{a}{b}), never slashes.
//
// Fields per question: question_id, skill_id, level_tag, difficulty (1–5),
// estimated_time_seconds, answer, worked_solution[], hint_sequence[], misconception_tags[].

export const SEED_QUESTIONS = [
  // ── Multiplication fluency ──
  {
    question_id: 'mul-001', skill_id: 'mul-fluency', level_tag: 'P3', difficulty: 2,
    estimated_time_seconds: 4, prompt_text: '7 × 8', answer: 56,
    worked_solution: ['7 × 8 means 7 groups of 8.', '7 × 8 = 7 × 5 + 7 + 7 + 7 = 35 + 21 = 56.'],
    hint_sequence: ['It’s a 7 times-table fact.', 'Start from 7 × 5 = 35, then add 7 three more times.'],
    misconception_tags: ['mult/adds', 'mult/adjacent'],
  },
  {
    question_id: 'mul-002', skill_id: 'mul-fluency', level_tag: 'P3', difficulty: 2,
    estimated_time_seconds: 4, prompt_text: '6 × 9', answer: 54,
    worked_solution: ['6 × 9 = 6 × 10 − 6 = 60 − 6 = 54.'],
    hint_sequence: ['6 × 10 = 60, then take one 6 away.'],
    misconception_tags: ['mult/adjacent', 'mult/recall'],
  },
  {
    question_id: 'mul-003', skill_id: 'mul-fluency', level_tag: 'P3', difficulty: 3,
    estimated_time_seconds: 5, prompt_text: '8 × 12', answer: 96,
    worked_solution: ['8 × 12 = 8 × 10 + 8 + 8 = 80 + 16 = 96.'],
    hint_sequence: ['Anchor on 8 × 10 = 80, then add 8 twice.'],
    misconception_tags: ['mult/recall'],
  },

  // ── Division fluency ──
  {
    question_id: 'div-001', skill_id: 'div-fluency', level_tag: 'P3', difficulty: 2,
    estimated_time_seconds: 5, prompt_text: '56 ÷ 7', answer: 8,
    worked_solution: ['56 ÷ 7 asks how many 7s make 56.', '7 × 8 = 56, so 56 ÷ 7 = 8.'],
    hint_sequence: ['Use the matching fact: 7 × ? = 56.'],
    misconception_tags: ['div/multiplied', 'div/off-by-one'],
  },
  {
    question_id: 'div-002', skill_id: 'div-fluency', level_tag: 'P3', difficulty: 2,
    estimated_time_seconds: 5, prompt_text: '45 ÷ 9', answer: 5,
    worked_solution: ['9 × 5 = 45, so 45 ÷ 9 = 5.'],
    hint_sequence: ['Which 9 times-table fact gives 45?'],
    misconception_tags: ['div/recall'],
  },

  // ── Fraction meaning ── (visual bar; choices are KaTeX fractions)
  {
    question_id: 'frm-001', skill_id: 'frac-meaning', level_tag: 'P3', difficulty: 1,
    estimated_time_seconds: 10, prompt_text: 'What fraction is shaded?',
    visual: { kind: 'bar', n: 3, d: 4 }, answer: '\\frac{3}{4}',
    worked_solution: ['The bar has 4 equal parts; 3 are shaded.', '\\frac{\\text{shaded}}{\\text{total}} = \\frac{3}{4}'],
    hint_sequence: ['Count the shaded parts over the total parts.'],
    misconception_tags: ['frac/unshaded'],
  },
  {
    question_id: 'frm-002', skill_id: 'frac-meaning', level_tag: 'P3', difficulty: 2,
    estimated_time_seconds: 10, prompt_text: 'What fraction is shaded?',
    visual: { kind: 'bar', n: 2, d: 6 }, answer: '\\frac{2}{6}',
    worked_solution: ['6 equal parts, 2 shaded → \\frac{2}{6}.'],
    hint_sequence: ['Shaded over total.'],
    misconception_tags: ['frac/unshaded', 'frac/parts'],
  },

  // ── Equivalent fractions ── (fill the missing numerator)
  {
    question_id: 'feq-001', skill_id: 'frac-equiv', level_tag: 'P4', difficulty: 2,
    estimated_time_seconds: 12, prompt_latex: '\\frac{3}{4} = \\frac{\\rule{0.7em}{0.08em}}{12}', answer: 9,
    worked_solution: ['4 was multiplied by 3 to make 12.', '\\frac{3}{4} = \\frac{3 \\times 3}{4 \\times 3} = \\frac{9}{12}'],
    hint_sequence: ['What times 4 makes 12? Multiply the top by the same number.'],
    misconception_tags: ['frac/added-not-multiplied', 'frac/scaled-one-part'],
  },
  {
    question_id: 'feq-002', skill_id: 'frac-equiv', level_tag: 'P4', difficulty: 2,
    estimated_time_seconds: 12, prompt_latex: '\\frac{2}{5} = \\frac{\\rule{0.7em}{0.08em}}{10}', answer: 4,
    worked_solution: ['\\frac{2}{5} = \\frac{2 \\times 2}{5 \\times 2} = \\frac{4}{10}'],
    hint_sequence: ['5 × 2 = 10, so do the same to the top.'],
    misconception_tags: ['frac/added-not-multiplied'],
  },

  // ── Comparing fractions ── (which is greater?)
  {
    question_id: 'fcm-001', skill_id: 'frac-compare', level_tag: 'P4', difficulty: 3,
    estimated_time_seconds: 12, prompt_text: 'Which fraction is greater?', answer: '\\frac{2}{3}',
    choices: ['\\frac{2}{3}', '\\frac{3}{5}'],
    worked_solution: ['Common denominator 15:', '\\frac{2}{3} = \\frac{10}{15}, \\quad \\frac{3}{5} = \\frac{9}{15}', '10 > 9, so \\frac{2}{3} is greater.'],
    hint_sequence: ['Give them the same denominator, then compare the tops.'],
    misconception_tags: ['frac/bigger-denominator'],
  },
  {
    question_id: 'fcm-002', skill_id: 'frac-compare', level_tag: 'P4', difficulty: 2,
    estimated_time_seconds: 12, prompt_text: 'Which fraction is greater?', answer: '\\frac{3}{4}',
    choices: ['\\frac{1}{2}', '\\frac{3}{4}'],
    worked_solution: ['\\frac{1}{2} = \\frac{2}{4}; \\quad \\frac{3}{4} > \\frac{2}{4}.'],
    hint_sequence: ['Rename to quarters.'],
    misconception_tags: ['frac/bigger-denominator'],
  },

  // ── Simple fraction addition ── (like denominators)
  {
    question_id: 'fad-001', skill_id: 'frac-add', level_tag: 'P4', difficulty: 2,
    estimated_time_seconds: 14, prompt_latex: '\\frac{1}{4} + \\frac{2}{4}', answer: '\\frac{3}{4}',
    choices: ['\\frac{3}{4}', '\\frac{3}{8}', '\\frac{2}{4}', '\\frac{4}{4}'],
    worked_solution: ['Denominators match — add the tops, keep the bottom:', '\\frac{1}{4} + \\frac{2}{4} = \\frac{1 + 2}{4} = \\frac{3}{4}'],
    hint_sequence: ['Same bottom? Add the tops, keep the bottom.'],
    misconception_tags: ['frac/added-denominators'],
  },
  {
    question_id: 'fad-002', skill_id: 'frac-add', level_tag: 'P4', difficulty: 2,
    estimated_time_seconds: 14, prompt_latex: '\\frac{2}{5} + \\frac{1}{5}', answer: '\\frac{3}{5}',
    choices: ['\\frac{3}{5}', '\\frac{3}{10}', '\\frac{2}{5}', '\\frac{1}{5}'],
    worked_solution: ['\\frac{2}{5} + \\frac{1}{5} = \\frac{3}{5}'],
    hint_sequence: ['Add 2 and 1 on top; the 5 stays.'],
    misconception_tags: ['frac/added-denominators'],
  },
];

export default SEED_QUESTIONS;
