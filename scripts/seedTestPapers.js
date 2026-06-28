import dotenv from 'dotenv';
import mongoose from 'mongoose';
import TestPaper from '../models/TestPaper.js';

dotenv.config();

// Content seed (idempotent, upsert by paperCode) — safe to run against prod to
// publish the starter paper. Mirrors seedExamPapers.js (no NODE_ENV guard,
// since this seeds shared content, not student data).
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

// ── Phase-1 starter: a real P5 mixed mock, authored exam-paper style.
// Every answer is mark-verified. Two questions carry diagrams (bar graph +
// rectangle) to prove diagrams render inside a paper. Word problems sit at the
// end as the "challenging" tier and link to PSL for method help.
const P5_MOCK_A = {
  paperCode: 'P5-MATH-MOCK-A',
  title: 'P5 Maths — Mid-Year Mock A',
  subject: 'Mathematics',
  level: 'P5',
  durationMinutes: 50,
  status: 'published',
  description: 'A mixed-topic P5 paper in exam style: number, fractions, decimals, measurement, ratio and multi-step word problems.',
  tags: ['mock', 'mixed-topic', 'challenge'],
  source: 'authored',
  sourceRef: 'TianOS_P5_Mock_A',
  questions: [
    {
      order: 1, section: 'A', marks: 2, type: 'mcq',
      stem: 'In the number 4 763 850, what is the value of the digit 7?',
      choices: ['700 000', '70 000', '7 000', '700'],
      answer: '700 000',
      skillName: 'Place value', frameworkSkillId: '', difficulty: 'easy',
      workedSolution: 'The 7 is in the hundred-thousands place, so its value is 700 000.',
    },
    {
      order: 2, section: 'A', marks: 2, type: 'mcq',
      stem: 'Express 2 3/5 as an improper fraction.',
      choices: ['13/5', '11/5', '7/5', '6/5'],
      answer: '13/5',
      skillName: 'Mixed numbers', frameworkSkillId: '', difficulty: 'easy',
      workedSolution: '2 3/5 = (2 × 5 + 3)/5 = 13/5.',
    },
    {
      order: 3, section: 'A', marks: 2, type: 'short_answer',
      stem: 'The bar graph shows the number of books read by four pupils. How many more books did Mei read than Sam?',
      answer: '7',
      unit: 'books',
      diagram: { kind: 'bar', rows: [['Mei', 18], ['Sam', 11], ['Ali', 14], ['Lin', 9]] },
      skillName: 'Reading bar graphs', frameworkSkillId: 'ST003', difficulty: 'easy',
      workedSolution: 'Mei read 18 and Sam read 11. 18 − 11 = 7.',
    },
    {
      order: 4, section: 'B', marks: 2, type: 'short_answer',
      stem: 'Express 7/8 as a decimal.',
      answer: '0.875',
      skillName: 'Fraction to decimal', frameworkSkillId: '', difficulty: 'medium',
      workedSolution: '7 ÷ 8 = 0.875.',
    },
    {
      order: 5, section: 'B', marks: 2, type: 'short_answer',
      stem: 'The figure shows a rectangle. Find its perimeter.',
      answer: '38', unit: 'cm',
      diagram: { kind: 'rectangle', l: 12, w: 7, unit: 'cm' },
      skillName: 'Perimeter of a rectangle', frameworkSkillId: 'AP001', difficulty: 'medium',
      workedSolution: 'Perimeter = 2 × (length + width) = 2 × (12 + 7) = 2 × 19 = 38 cm.',
    },
    {
      order: 6, section: 'B', marks: 2, type: 'short_answer',
      stem: 'The average of 5 numbers is 18. What is their total?',
      answer: '90',
      skillName: 'Average', frameworkSkillId: '', difficulty: 'medium',
      workedSolution: 'Total = average × number of values = 18 × 5 = 90.',
    },
    {
      order: 7, section: 'B', marks: 2, type: 'short_answer',
      stem: 'Express the ratio 18 : 24 in its simplest form.',
      answer: '3 : 4',
      skillName: 'Simplifying ratio', frameworkSkillId: '', difficulty: 'medium',
      workedSolution: 'Divide both parts by their HCF, 6: 18 ÷ 6 = 3, 24 ÷ 6 = 4, so 3 : 4.',
    },
    {
      order: 8, section: 'C', marks: 3, type: 'short_answer',
      stem: 'Mei had $120. She spent 1/3 of it on a book and 1/4 of the remainder on a pen. How much money had she left?',
      answer: '60', unit: '$',
      skillName: 'Fraction of remainder (word problem)', frameworkSkillId: '', difficulty: 'hard',
      solutionSteps: [
        'Book: 1/3 of $120 = $40. Remainder = $120 − $40 = $80.',
        'Pen: 1/4 of $80 = $20.',
        'Left = $80 − $20 = $60.',
      ],
      workedSolution: 'Book = 1/3 × 120 = 40, remainder 80; pen = 1/4 × 80 = 20; left = 80 − 20 = 60.',
    },
    {
      order: 9, section: 'C', marks: 4, type: 'short_answer',
      stem: 'A baker had 3 trays of muffins with 24 muffins on each tray. He sold 5/8 of all the muffins. How many muffins were left?',
      answer: '27',
      skillName: 'Multi-step fractions (word problem)', frameworkSkillId: '', difficulty: 'hard',
      solutionSteps: [
        'Total muffins = 3 × 24 = 72.',
        'Sold = 5/8 of 72 = 45.',
        'Left = 72 − 45 = 27.',
      ],
      workedSolution: 'Total 3 × 24 = 72; sold 5/8 × 72 = 45; left 72 − 45 = 27.',
    },
    {
      order: 10, section: 'C', marks: 4, type: 'short_answer',
      stem: "The ratio of John's stickers to Peter's stickers is 5 : 3. John has 24 more stickers than Peter. How many stickers do they have altogether?",
      answer: '96',
      skillName: 'Ratio difference (word problem)', frameworkSkillId: '', difficulty: 'hard',
      solutionSteps: [
        'Difference = 5 − 3 = 2 units, and 2 units = 24, so 1 unit = 12.',
        'Total = 5 + 3 = 8 units.',
        'Altogether = 8 × 12 = 96.',
      ],
      workedSolution: 'Difference 2 units = 24 → 1 unit = 12; total 8 units = 8 × 12 = 96.',
    },
  ],
};

// ── P4 mixed mock (mark-verified). Simpler arithmetic + early word problems.
const P4_MOCK_A = {
  paperCode: 'P4-MATH-MOCK-A',
  title: 'P4 Maths — Mid-Year Mock A',
  subject: 'Mathematics',
  level: 'P4',
  durationMinutes: 60,
  status: 'published',
  description: 'A full-length P4 paper in exam style: Section A (MCQ), Section B (short answer) and Section C (word problems).',
  tags: ['mock', 'mixed-topic', 'full-length'],
  source: 'authored',
  sourceRef: 'TianOS_P4_Mock_A',
  questions: [
    // ── Section A — Multiple choice (2 marks each)
    { order: 1, section: 'A', marks: 2, type: 'mcq', stem: 'In the number 58 247, what is the value of the digit 8?', choices: ['8 000', '800', '80', '80 000'], answer: '8 000', skillName: 'Place value', difficulty: 'easy', workedSolution: 'The 8 is in the thousands place, so its value is 8 000.' },
    { order: 2, section: 'A', marks: 2, type: 'mcq', stem: 'Round 6 482 to the nearest hundred.', choices: ['6 500', '6 400', '6 480', '7 000'], answer: '6 500', skillName: 'Rounding', difficulty: 'easy', workedSolution: '6 482 is between 6 400 and 6 500; the tens digit 8 rounds it up to 6 500.' },
    { order: 3, section: 'A', marks: 2, type: 'mcq', stem: 'Which number is a common factor of 12 and 18?', choices: ['6', '4', '8', '9'], answer: '6', skillName: 'Factors', difficulty: 'medium', workedSolution: '6 divides both 12 (12 = 6 x 2) and 18 (18 = 6 x 3).' },
    { order: 4, section: 'A', marks: 2, type: 'mcq', stem: 'Which of these is a multiple of 7?', choices: ['56', '50', '60', '48'], answer: '56', skillName: 'Multiples', difficulty: 'easy', workedSolution: '7 x 8 = 56.' },
    { order: 5, section: 'A', marks: 2, type: 'mcq', stem: 'Which fraction is equivalent to 2/3?', choices: ['6/9', '4/9', '3/4', '2/6'], answer: '6/9', skillName: 'Equivalent fractions', difficulty: 'medium', workedSolution: '2/3 = (2x3)/(3x3) = 6/9.' },
    { order: 6, section: 'A', marks: 2, type: 'mcq', stem: 'What is the value of the digit 5 in 3.45?', choices: ['0.05', '0.5', '5', '0.005'], answer: '0.05', skillName: 'Decimal place value', difficulty: 'medium', workedSolution: 'The 5 is in the hundredths place, so its value is 0.05.' },
    { order: 7, section: 'A', marks: 2, type: 'mcq', stem: 'How many minutes are there in 2 hours 15 minutes?', choices: ['135', '215', '75', '120'], answer: '135', skillName: 'Time', difficulty: 'easy', workedSolution: '2 x 60 + 15 = 120 + 15 = 135 minutes.' },
    { order: 8, section: 'A', marks: 2, type: 'mcq', stem: 'Which unit is best for measuring the mass of an apple?', choices: ['grams', 'kilograms', 'litres', 'metres'], answer: 'grams', skillName: 'Choosing units', difficulty: 'easy', workedSolution: 'An apple is light, so grams (g) is the most suitable unit.' },
    { order: 9, section: 'A', marks: 2, type: 'mcq', stem: 'How many right angles are there in a rectangle?', choices: ['4', '2', '1', '0'], answer: '4', skillName: 'Properties of shapes', difficulty: 'easy', workedSolution: 'A rectangle has 4 corners, each a right angle.' },
    { order: 10, section: 'A', marks: 2, type: 'mcq', stem: 'How many lines of symmetry does a square have?', choices: ['4', '2', '1', '8'], answer: '4', skillName: 'Symmetry', difficulty: 'medium', workedSolution: 'A square has 4 lines of symmetry: 2 through the sides and 2 through the corners.' },

    // ── Section B — Short answer (2 marks each)
    { order: 11, section: 'B', marks: 2, type: 'short_answer', stem: 'Find the value of 234 x 6.', answer: '1404', skillName: 'Multiplication', difficulty: 'medium', workedSolution: '234 x 6 = 1404.' },
    { order: 12, section: 'B', marks: 2, type: 'short_answer', stem: 'Divide 405 by 5.', answer: '81', skillName: 'Division', difficulty: 'medium', workedSolution: '405 / 5 = 81.' },
    { order: 13, section: 'B', marks: 2, type: 'short_answer', stem: 'Find the value of 12 + 3 x 4.', answer: '24', skillName: 'Order of operations', difficulty: 'medium', workedSolution: 'Multiply first: 3 x 4 = 12, then 12 + 12 = 24.' },
    { order: 14, section: 'B', marks: 2, type: 'short_answer', stem: 'Find the value of 3/8 + 1/8. Give your answer in its simplest form.', answer: '1/2', skillName: 'Adding fractions', difficulty: 'medium', workedSolution: '3/8 + 1/8 = 4/8 = 1/2.' },
    { order: 15, section: 'B', marks: 2, type: 'short_answer', stem: 'There are 24 sweets in a jar. 3/4 of them are red. How many red sweets are there?', answer: '18', skillName: 'Fraction of a set', difficulty: 'medium', workedSolution: '3/4 x 24 = 18.' },
    { order: 16, section: 'B', marks: 2, type: 'short_answer', stem: 'Find the value of 3.7 + 2.45.', answer: '6.15', skillName: 'Adding decimals', difficulty: 'medium', workedSolution: '3.70 + 2.45 = 6.15.' },
    { order: 17, section: 'B', marks: 2, type: 'short_answer', stem: 'Find the value of 8.3 - 5.6.', answer: '2.7', skillName: 'Subtracting decimals', difficulty: 'medium', workedSolution: '8.3 - 5.6 = 2.7.' },
    { order: 18, section: 'B', marks: 2, type: 'short_answer', stem: 'Convert 3 m 25 cm to centimetres.', answer: '325', unit: 'cm', skillName: 'Length conversion', difficulty: 'medium', workedSolution: '3 m = 300 cm, so 3 m 25 cm = 325 cm.' },
    { order: 19, section: 'B', marks: 2, type: 'short_answer', stem: 'Convert 2 kg 400 g to grams.', answer: '2400', unit: 'g', skillName: 'Mass conversion', difficulty: 'medium', workedSolution: '2 kg = 2000 g, so 2 kg 400 g = 2400 g.' },
    { order: 20, section: 'B', marks: 2, type: 'short_answer', stem: 'The figure shows a square. Find its area.', answer: '81', unit: 'cm²', diagram: { kind: 'square', side: 9, unit: 'cm' }, skillName: 'Area of a square', frameworkSkillId: 'AP001', difficulty: 'medium', workedSolution: 'Area = side x side = 9 x 9 = 81 cm².' },

    // ── Section C — Word problems (3-4 marks each)
    { order: 21, section: 'C', marks: 3, type: 'short_answer', stem: 'A baker made 120 cupcakes. He sold 3/4 of them. How many cupcakes were left?', answer: '30', skillName: 'Fraction word problem', difficulty: 'hard', solutionSteps: ['Sold = 3/4 of 120 = 90.', 'Left = 120 - 90 = 30.'], workedSolution: 'Sold 3/4 x 120 = 90; left 120 - 90 = 30.' },
    { order: 22, section: 'C', marks: 3, type: 'short_answer', stem: 'Sara had $50. She bought 3 books at $12 each. How much money had she left?', answer: '14', unit: '$', skillName: 'Money word problem', difficulty: 'hard', solutionSteps: ['Cost = 3 x $12 = $36.', 'Left = $50 - $36 = $14.'], workedSolution: 'Cost 3 x 12 = 36; left 50 - 36 = 14.' },
    { order: 23, section: 'C', marks: 4, type: 'short_answer', stem: 'There are 8 rows of chairs with 15 chairs in each row. 23 chairs are taken. How many chairs are empty?', answer: '97', skillName: 'Multi-step word problem', difficulty: 'hard', solutionSteps: ['Total chairs = 8 x 15 = 120.', 'Empty = 120 - 23 = 97.'], workedSolution: 'Total 8 x 15 = 120; empty 120 - 23 = 97.' },
    { order: 24, section: 'C', marks: 3, type: 'short_answer', stem: 'A rope 6 m long is cut into pieces of 75 cm each. How many pieces are there?', answer: '8', skillName: 'Length word problem', difficulty: 'hard', solutionSteps: ['6 m = 600 cm.', '600 / 75 = 8 pieces.'], workedSolution: '600 cm / 75 cm = 8.' },
    { order: 25, section: 'C', marks: 4, type: 'short_answer', stem: 'A tank holds 45 litres of water. 5/9 of the water is used. How many litres of water are left?', answer: '20', unit: 'L', skillName: 'Fraction word problem', difficulty: 'hard', solutionSteps: ['Used = 5/9 of 45 = 25 litres.', 'Left = 45 - 25 = 20 litres.'], workedSolution: 'Used 5/9 x 45 = 25; left 45 - 25 = 20.' },
    { order: 26, section: 'C', marks: 3, type: 'short_answer', stem: 'Ali bought 4 pens at $3 each and a notebook for $8. How much did he spend altogether?', answer: '20', unit: '$', skillName: 'Money word problem', difficulty: 'hard', solutionSteps: ['Pens = 4 x $3 = $12.', 'Total = $12 + $8 = $20.'], workedSolution: '4 x 3 + 8 = 12 + 8 = 20.' },
    { order: 27, section: 'C', marks: 4, type: 'short_answer', stem: 'The figure shows a rectangular field. Find its perimeter.', answer: '60', unit: 'm', diagram: { kind: 'rectangle', l: 18, w: 12, unit: 'm' }, skillName: 'Perimeter word problem', frameworkSkillId: 'AP001', difficulty: 'hard', solutionSteps: ['Perimeter = 2 x (length + width).', '2 x (18 + 12) = 2 x 30 = 60 m.'], workedSolution: '2 x (18 + 12) = 60 m.' },
    { order: 28, section: 'C', marks: 4, type: 'short_answer', stem: 'Mrs Lee had 3 boxes of sugar, each 250 g. She used 400 g. How many grams of sugar are left?', answer: '350', unit: 'g', skillName: 'Mass word problem', difficulty: 'hard', solutionSteps: ['Total = 3 x 250 = 750 g.', 'Left = 750 - 400 = 350 g.'], workedSolution: '3 x 250 = 750; 750 - 400 = 350.' },
    { order: 29, section: 'C', marks: 3, type: 'short_answer', stem: 'A train journey starts at 9:20 and ends at 10:05. How many minutes did the journey take?', answer: '45', unit: 'min', skillName: 'Time word problem', difficulty: 'hard', solutionSteps: ['9:20 to 10:00 is 40 minutes.', '10:00 to 10:05 is 5 minutes.', 'Total = 40 + 5 = 45 minutes.'], workedSolution: 'From 9:20 to 10:05 is 45 minutes.' },
    { order: 30, section: 'C', marks: 4, type: 'short_answer', stem: '120 children went on a trip. They were put into groups of 8. Each group needed 2 adults. How many adults were needed?', answer: '30', skillName: 'Multi-step word problem', difficulty: 'hard', solutionSteps: ['Groups = 120 / 8 = 15.', 'Adults = 15 x 2 = 30.'], workedSolution: '120 / 8 = 15 groups; 15 x 2 = 30 adults.' },
  ],
};

// ── P6 mixed mock (mark-verified). Percentage, ratio, speed, circle, algebra.
const P6_MOCK_A = {
  paperCode: 'P6-MATH-MOCK-A',
  title: 'P6 Maths — Mid-Year Mock A',
  subject: 'Mathematics',
  level: 'P6',
  durationMinutes: 50,
  status: 'published',
  description: 'A mixed-topic P6 paper: percentage, ratio, speed, area of a circle, algebra and multi-step word problems.',
  tags: ['mock', 'mixed-topic', 'challenge'],
  source: 'authored',
  sourceRef: 'TianOS_P6_Mock_A',
  questions: [
    { order: 1, section: 'A', marks: 2, type: 'mcq', stem: 'What is 25% of 240?', choices: ['60', '48', '40', '96'], answer: '60', skillName: 'Percentage of a quantity', difficulty: 'easy', workedSolution: '25% = 1/4, and 1/4 of 240 = 60.' },
    { order: 2, section: 'A', marks: 2, type: 'mcq', stem: 'Express 36 : 48 in its simplest form.', choices: ['3 : 4', '4 : 3', '6 : 8', '9 : 12'], answer: '3 : 4', skillName: 'Simplifying ratio', difficulty: 'easy', workedSolution: 'Divide both by 12: 36 ÷ 12 = 3, 48 ÷ 12 = 4 → 3 : 4.' },
    { order: 3, section: 'A', marks: 2, type: 'mcq', stem: 'If 3x + 5 = 20, what is the value of x?', choices: ['5', '15', '8', '45'], answer: '5', skillName: 'Solving simple equations', difficulty: 'medium', workedSolution: '3x = 20 − 5 = 15, so x = 15 ÷ 3 = 5.' },
    { order: 4, section: 'B', marks: 2, type: 'short_answer', stem: 'A circle has a radius of 7 cm. Find its area. (Take π = 22/7.)', answer: '154', unit: 'cm²', diagram: { kind: 'circle', radius: 7, label: '7 cm', show: 'radius' }, skillName: 'Area of a circle', difficulty: 'medium', workedSolution: 'Area = π × r² = 22/7 × 7 × 7 = 22 × 7 = 154 cm².' },
    { order: 5, section: 'B', marks: 2, type: 'short_answer', stem: 'A car travels 240 km in 3 hours. What is its average speed?', answer: '80', unit: 'km/h', skillName: 'Average speed', difficulty: 'medium', workedSolution: 'Speed = distance ÷ time = 240 ÷ 3 = 80 km/h.' },
    { order: 6, section: 'B', marks: 2, type: 'short_answer', stem: 'A shirt costs $40. After a 15% discount, what is the new price?', answer: '34', unit: '$', skillName: 'Percentage discount', difficulty: 'medium', workedSolution: 'Discount = 15% of 40 = 6; new price = 40 − 6 = 34.' },
    { order: 7, section: 'B', marks: 2, type: 'short_answer', stem: 'Find the value of 3/4 − 1/6.', answer: '7/12', skillName: 'Subtracting fractions', difficulty: 'medium', workedSolution: '3/4 = 9/12, 1/6 = 2/12; 9/12 − 2/12 = 7/12.' },
    { order: 8, section: 'C', marks: 3, type: 'short_answer', stem: 'The ratio of red marbles to blue marbles is 3 : 5. There are 24 red marbles. How many marbles are there altogether?', answer: '64', skillName: 'Ratio word problem', difficulty: 'hard', solutionSteps: ['3 units = 24, so 1 unit = 8.', 'Total = 3 + 5 = 8 units = 8 × 8 = 64.'], workedSolution: '3 units = 24 → 1 unit = 8; total 8 units = 64.' },
    { order: 9, section: 'C', marks: 4, type: 'short_answer', stem: 'In a school, 60% of the pupils are girls. There are 240 boys. How many pupils are there altogether?', answer: '600', skillName: 'Percentage word problem', difficulty: 'hard', solutionSteps: ['Boys = 100% − 60% = 40% of the pupils.', '40% = 240, so 1% = 6.', 'Total = 100% = 600.'], workedSolution: 'Boys are 40% = 240 → 1% = 6 → 100% = 600.' },
    { order: 10, section: 'C', marks: 4, type: 'short_answer', stem: 'Ali drove from Town A to Town B at 60 km/h in 2 hours. He returned along the same road at 80 km/h. How long did the return journey take, in minutes?', answer: '90', unit: 'min', skillName: 'Speed word problem', difficulty: 'hard', solutionSteps: ['Distance = 60 × 2 = 120 km.', 'Return time = 120 ÷ 80 = 1.5 hours = 90 minutes.'], workedSolution: 'Distance 60 × 2 = 120 km; return 120 ÷ 80 = 1.5 h = 90 min.' },
  ],
};

// ── Topic challenge sets (KooBits-style "Challenging" tier): one topic, all
// hard word problems, untimed. Mark-verified.
const P5_FRAC_CHALLENGE = {
  paperCode: 'P5-FRAC-CHALLENGE',
  title: 'P5 Fractions — Challenge',
  subject: 'Mathematics',
  level: 'P5',
  category: 'challenge',
  topic: 'Fractions',
  durationMinutes: 0,
  status: 'published',
  description: 'Tough P5 fraction word problems — work-backwards, remainder and part-whole reasoning.',
  tags: ['challenge', 'fractions'],
  source: 'authored',
  sourceRef: 'TianOS_P5_Frac_Challenge',
  questions: [
    { order: 1, section: 'A', marks: 3, type: 'short_answer', stem: 'Raj had a sum of money. He spent 2/5 of it on a toy and 1/3 of the remainder on a book. He had $40 left. How much money did he have at first?', answer: '100', unit: '$', skillName: 'Fraction of remainder (work backwards)', difficulty: 'hard', solutionSteps: ['After the toy, 3/5 of the money was left.', '1/3 of that remainder went on the book = 1/5 of the original.', 'Left = 3/5 − 1/5 = 2/5 of the original = $40, so the original = $40 ÷ 2 × 5 = $100.'], workedSolution: '2/5 of the money = $40 left → original = $100.' },
    { order: 2, section: 'A', marks: 3, type: 'short_answer', stem: '5/8 of the pupils in a class are boys. There are 12 girls. How many pupils are in the class?', answer: '32', skillName: 'Fraction part-whole', difficulty: 'hard', solutionSteps: ['Girls = 1 − 5/8 = 3/8 of the class.', '3/8 = 12, so 1/8 = 4.', 'Whole class = 8/8 = 32.'], workedSolution: 'Girls 3/8 = 12 → 1/8 = 4 → class = 32.' },
    { order: 3, section: 'A', marks: 3, type: 'short_answer', stem: 'A tank was 3/4 full. After 18 litres were used, it was 1/2 full. What is the capacity of the tank?', answer: '72', unit: 'L', skillName: 'Fraction difference', difficulty: 'hard', solutionSteps: ['3/4 − 1/2 = 1/4 of the tank was used.', '1/4 = 18 litres.', 'Capacity = 4 × 18 = 72 litres.'], workedSolution: '1/4 of the tank = 18 L → capacity = 72 L.' },
    { order: 4, section: 'B', marks: 4, type: 'short_answer', stem: 'Mrs Tan bought some apples. She gave 1/4 to her neighbour and 2/3 of the remainder to her sister. She had 9 apples left. How many apples did she buy?', answer: '36', skillName: 'Fraction of remainder', difficulty: 'hard', solutionSteps: ['After the neighbour, 3/4 were left.', 'She gave 2/3 of that = 1/2 of the apples to her sister.', 'Left = 3/4 − 1/2 = 1/4 = 9, so total = 36.'], workedSolution: 'Left 1/4 = 9 → bought 36.' },
    { order: 5, section: 'B', marks: 4, type: 'short_answer', stem: '1/3 of a number is equal to 1/4 of 48. What is the number?', answer: '36', skillName: 'Fraction equations', difficulty: 'hard', solutionSteps: ['1/4 of 48 = 12.', '1/3 of the number = 12, so the number = 3 × 12 = 36.'], workedSolution: '1/4 of 48 = 12; number = 3 × 12 = 36.' },
    { order: 6, section: 'B', marks: 4, type: 'short_answer', stem: 'Ben read 2/5 of a book on Monday and 1/4 of the book on Tuesday. He still had 42 pages left. How many pages does the book have?', answer: '120', skillName: 'Combining fractions', difficulty: 'hard', solutionSteps: ['Read 2/5 + 1/4 = 8/20 + 5/20 = 13/20.', 'Left = 7/20 = 42 pages.', 'Total = 42 ÷ 7 × 20 = 120 pages.'], workedSolution: 'Left 7/20 = 42 → book = 120 pages.' },
  ],
};

const P6_PCT_RATIO_CHALLENGE = {
  paperCode: 'P6-PCT-RATIO-CHALLENGE',
  title: 'P6 Percentage & Ratio — Challenge',
  subject: 'Mathematics',
  level: 'P6',
  category: 'challenge',
  topic: 'Percentage & Ratio',
  durationMinutes: 0,
  status: 'published',
  description: 'Tough P6 percentage and ratio word problems — reverse percentage and changing ratios.',
  tags: ['challenge', 'percentage', 'ratio'],
  source: 'authored',
  sourceRef: 'TianOS_P6_PctRatio_Challenge',
  questions: [
    { order: 1, section: 'A', marks: 3, type: 'short_answer', stem: 'A number is increased by 20% to become 96. What was the original number?', answer: '80', skillName: 'Reverse percentage', difficulty: 'hard', solutionSteps: ['96 represents 120% of the original.', '1% = 96 ÷ 120 = 0.8.', 'Original = 100% = 80.'], workedSolution: '120% = 96 → 100% = 80.' },
    { order: 2, section: 'A', marks: 3, type: 'short_answer', stem: "The ratio of John's money to Mary's money is 2 : 3. If John has $48, how much do they have altogether?", answer: '120', unit: '$', skillName: 'Ratio word problem', difficulty: 'hard', solutionSteps: ['John = 2 units = $48, so 1 unit = $24.', 'Total = 2 + 3 = 5 units = 5 × $24 = $120.'], workedSolution: '2 units = $48 → 1 unit = $24; total 5 units = $120.' },
    { order: 3, section: 'A', marks: 3, type: 'short_answer', stem: 'In a bag, 40% of the balls are red and the rest are blue. There are 36 blue balls. How many balls are there altogether?', answer: '60', skillName: 'Reverse percentage', difficulty: 'hard', solutionSteps: ['Blue = 100% − 40% = 60% of the balls.', '60% = 36, so 1% = 0.6.', 'Total = 100% = 60.'], workedSolution: 'Blue 60% = 36 → total 60.' },
    { order: 4, section: 'B', marks: 4, type: 'short_answer', stem: 'The ratio of boys to girls in a hall was 5 : 4. After 20 boys left, the ratio became 3 : 4. How many girls were in the hall?', answer: '40', skillName: 'Changing ratio (constant part)', difficulty: 'hard', solutionSteps: ['Girls did not change. Let 1 unit = u: boys 5u, girls 4u.', 'After 20 boys leave: (5u − 20) : 4u = 3 : 4 → 4(5u − 20) = 3(4u) → 8u = 80 → u = 10.', 'Girls = 4u = 40.'], workedSolution: 'Solve (5u−20):4u = 3:4 → u = 10; girls = 4u = 40.' },
    { order: 5, section: 'B', marks: 4, type: 'short_answer', stem: 'A shopkeeper sold an item for $84 after giving a 30% discount. What was the original price?', answer: '120', unit: '$', skillName: 'Reverse percentage (discount)', difficulty: 'hard', solutionSteps: ['$84 is 70% of the original price.', '1% = 84 ÷ 70 = 1.2.', 'Original = 100% = $120.'], workedSolution: '70% = $84 → 100% = $120.' },
    { order: 6, section: 'B', marks: 4, type: 'short_answer', stem: 'The ratio of red to blue to green marbles is 2 : 3 : 5. There are 60 more green marbles than red marbles. How many marbles are there altogether?', answer: '200', skillName: 'Three-part ratio', difficulty: 'hard', solutionSteps: ['Green − red = 5 − 2 = 3 units = 60, so 1 unit = 20.', 'Total = 2 + 3 + 5 = 10 units = 10 × 20 = 200.'], workedSolution: '3 units = 60 → 1 unit = 20; total 10 units = 200.' },
  ],
};

async function run() {
  await mongoose.connect(URI);
  const papers = [P4_MOCK_A, P5_MOCK_A, P6_MOCK_A, P5_FRAC_CHALLENGE, P6_PCT_RATIO_CHALLENGE];
  for (const def of papers) {
    await TestPaper.deleteOne({ paperCode: def.paperCode });
    const doc = new TestPaper(def);
    await doc.save(); // pre-save hook computes totalMarks
    console.log(`✅ ${def.paperCode} — "${def.title}" (${doc.questions.length} questions, ${doc.totalMarks} marks)`);
  }
  await mongoose.disconnect();
  console.log('✅ Test-paper seed complete');
}

run().catch((err) => { console.error('❌ seedTestPapers failed:', err); process.exit(1); });
