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
  title: 'P4 Maths — End-of-Year Mock A',
  subject: 'Mathematics',
  level: 'P4',
  durationMinutes: 90,
  status: 'published',
  description: 'A full-length P4 paper in real exam format — Paper 1 (Section A MCQ + Section B short answer, 2 marks each) and Paper 2 (word problems, 4 marks each). 100 marks.',
  tags: ['mock', 'full-length', 'exam-format'],
  source: 'authored',
  sourceRef: 'TianOS_P4_Mock_A',
  questions: [
    // ── Paper 1, Section A — Multiple choice (Q1-10, 2 marks each)
    { order: 1, section: 'A', paper: 1, marks: 2, type: 'mcq', stem: 'What is the value of the digit 7 in 47 320?', choices: ['7 000', '700', '70 000', '70'], answer: '7 000', skillName: 'Place value' },
    { order: 2, section: 'A', paper: 1, marks: 2, type: 'mcq', stem: 'Which of the following is a common multiple of 3 and 5?', choices: ['45', '20', '12', '25'], answer: '45', skillName: 'Multiples' },
    { order: 3, section: 'A', paper: 1, marks: 2, type: 'mcq', stem: 'Which fraction is equal to 3/4?', choices: ['9/12', '6/12', '4/5', '5/8'], answer: '9/12', skillName: 'Equivalent fractions' },
    { order: 4, section: 'A', paper: 1, marks: 2, type: 'mcq', stem: 'What is 4.07 × 6?', choices: ['24.42', '24.07', '246.2', '24.2'], answer: '24.42', skillName: 'Multiplying decimals' },
    { order: 5, section: 'A', paper: 1, marks: 2, type: 'mcq', stem: 'Which improper fraction is the same as 2 3/4?', choices: ['11/4', '9/4', '8/3', '7/4'], answer: '11/4', skillName: 'Mixed numbers' },
    { order: 6, section: 'A', paper: 1, marks: 2, type: 'mcq', stem: 'An angle measures 90°. What type of angle is it?', choices: ['right angle', 'acute angle', 'obtuse angle', 'straight angle'], answer: 'right angle', skillName: 'Types of angles' },
    { order: 7, section: 'A', paper: 1, marks: 2, type: 'mcq', stem: 'How many millilitres are there in 2.5 litres?', choices: ['2 500 ml', '250 ml', '25 ml', '25 000 ml'], answer: '2 500 ml', skillName: 'Volume conversion' },
    { order: 8, section: 'A', paper: 1, marks: 2, type: 'mcq', stem: 'There are 30 pupils in a class. 2/5 of them wear glasses. How many pupils wear glasses?', choices: ['12', '15', '10', '6'], answer: '12', skillName: 'Fraction of a set' },
    { order: 9, section: 'A', paper: 1, marks: 2, type: 'mcq', stem: 'How many faces does a cube have?', choices: ['6', '4', '8', '12'], answer: '6', skillName: 'Properties of solids' },
    { order: 10, section: 'A', paper: 1, marks: 2, type: 'mcq', stem: 'The figure shows a rectangle. Find its perimeter.', choices: ['26 cm', '40 cm', '13 cm', '18 cm'], answer: '26 cm', diagram: { kind: 'rectangle', l: 8, w: 5, unit: 'cm' }, skillName: 'Perimeter' },

    // ── Paper 1, Section B — Short answer (Q11-30, 2 marks each)
    { order: 11, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'What is the remainder when 2 458 is divided by 7?', answer: '1', skillName: 'Division with remainder', workedSolution: '2458 ÷ 7 = 351 remainder 1.' },
    { order: 12, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'Round 4 736 to the nearest hundred.', answer: '4 700', skillName: 'Rounding', workedSolution: 'The tens digit is 3 (< 5), so it rounds to 4 700.' },
    { order: 13, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'What is the largest 4-digit number that can be made using each of the digits 5, 0, 8 and 3 once?', answer: '8 530', skillName: 'Place value', workedSolution: 'Largest first: 8, 5, 3, 0 → 8 530.' },
    { order: 14, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'Find the value of 3/8 + 1/8. Give your answer in its simplest form.', answer: '1/2', skillName: 'Adding fractions', workedSolution: '3/8 + 1/8 = 4/8 = 1/2.' },
    { order: 15, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'What is 5/6 − 1/3? Give your answer in its simplest form.', answer: '1/2', skillName: 'Subtracting fractions', workedSolution: '5/6 − 2/6 = 3/6 = 1/2.' },
    { order: 16, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'Express 9/4 as a mixed number.', answer: '2 1/4', skillName: 'Mixed numbers', workedSolution: '9 ÷ 4 = 2 remainder 1 → 2 1/4.' },
    { order: 17, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'Write 3 hundredths as a decimal.', answer: '0.03', skillName: 'Decimal place value' },
    { order: 18, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'Find the value of 7.2 − 4.65.', answer: '2.55', skillName: 'Subtracting decimals' },
    { order: 19, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'Express 0.8 as a fraction in its simplest form.', answer: '4/5', skillName: 'Decimal to fraction', workedSolution: '0.8 = 8/10 = 4/5.' },
    { order: 20, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'How many minutes are there in 3 hours 40 minutes?', answer: '220', unit: 'min', skillName: 'Time', workedSolution: '3 × 60 + 40 = 220.' },
    { order: 21, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'Convert 2 m 8 cm to centimetres.', answer: '208', unit: 'cm', skillName: 'Length conversion', workedSolution: '2 m = 200 cm, so 2 m 8 cm = 208 cm.' },
    { order: 22, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'Convert 3 kg 50 g to grams.', answer: '3050', unit: 'g', skillName: 'Mass conversion', workedSolution: '3 kg = 3000 g, so 3 kg 50 g = 3050 g.' },
    { order: 23, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'Find the product of 48 and 7.', answer: '336', skillName: 'Multiplication' },
    { order: 24, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'Divide 504 by 8.', answer: '63', skillName: 'Division' },
    { order: 25, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'Find the value of 12 × 25.', answer: '300', skillName: 'Multiplication' },
    { order: 26, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'What is 2/3 of 24?', answer: '16', skillName: 'Fraction of a quantity', workedSolution: '2/3 × 24 = 16.' },
    { order: 27, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'The bar graph shows the number of pets owned by a group of children. How many more cats than dogs are there?', answer: '3', diagram: { kind: 'bar', rows: [['Cats', 8], ['Dogs', 5], ['Fish', 6], ['Birds', 3]] }, skillName: 'Reading bar graphs', frameworkSkillId: 'ST003', workedSolution: '8 cats − 5 dogs = 3.' },
    { order: 28, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'The figure shows a square. Find its area.', answer: '49', unit: 'cm²', diagram: { kind: 'square', side: 7, unit: 'cm' }, skillName: 'Area of a square', frameworkSkillId: 'AP001', workedSolution: '7 × 7 = 49 cm².' },
    { order: 29, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'The figure shows a rectangle. Find its perimeter.', answer: '48', unit: 'cm', diagram: { kind: 'rectangle', l: 15, w: 9, unit: 'cm' }, skillName: 'Perimeter', frameworkSkillId: 'AP001', workedSolution: '2 × (15 + 9) = 48 cm.' },
    { order: 30, section: 'B', paper: 1, marks: 2, type: 'short_answer', stem: 'A lesson runs from 10:15 to 11:05. How many minutes long is the lesson?', answer: '50', unit: 'min', skillName: 'Time interval', workedSolution: '10:15 to 11:05 is 50 minutes.' },

    // ── Paper 2 — Word problems (4 marks each)
    { order: 31, section: 'C', paper: 2, marks: 4, type: 'short_answer', stem: 'A baker baked 672 buns. He packed them equally into 8 boxes. How many buns were in each box?', answer: '84', skillName: 'Division word problem', workedSolution: '672 ÷ 8 = 84.' },
    { order: 32, section: 'C', paper: 2, marks: 4, type: 'short_answer', stem: 'Mrs Lim bought 3.5 kg of rice at $2 per kilogram and a chicken for $9. How much did she spend altogether?', answer: '16', unit: '$', skillName: 'Money word problem', workedSolution: 'Rice = 3.5 × 2 = $7; total = 7 + 9 = $16.' },
    { order: 33, section: 'C', paper: 2, marks: 4, type: 'short_answer', stem: 'A rope is 6 m long. It is cut into pieces of 40 cm each. How many pieces are there?', answer: '15', skillName: 'Length word problem', workedSolution: '6 m = 600 cm; 600 ÷ 40 = 15.' },
    { order: 34, section: 'C', paper: 2, marks: 4, type: 'short_answer', stem: 'There were 1 250 people at a concert. 3/5 of them were adults. How many of them were children?', answer: '500', skillName: 'Fraction word problem', workedSolution: 'Children = 2/5 of 1250 = 500.' },
    { order: 35, section: 'C', paper: 2, marks: 4, type: 'short_answer', stem: 'A tank held 18 litres of water. 2.5 litres were used and then 4.8 litres were added. How much water is in the tank now?', answer: '20.3', unit: 'L', skillName: 'Decimal word problem', workedSolution: '18 − 2.5 + 4.8 = 20.3 litres.' },
    { order: 36, section: 'C', paper: 2, marks: 4, type: 'short_answer', stem: 'Ahmad had $80. He spent 1/4 of it on a book and $15 on a pen. How much money had he left?', answer: '45', unit: '$', skillName: 'Multi-step word problem', workedSolution: 'Book = 1/4 × 80 = $20; left = 80 − 20 − 15 = $45.' },
    { order: 37, section: 'C', paper: 2, marks: 4, type: 'short_answer', stem: '8 identical chairs cost $264. How much do 5 such chairs cost?', answer: '165', unit: '$', skillName: 'Unitary method', workedSolution: '1 chair = 264 ÷ 8 = $33; 5 chairs = 5 × 33 = $165.' },
    // Multi-part word problems (grouped: shared intro, parts a + b)
    { order: 38, section: 'C', paper: 2, marks: 2, type: 'short_answer', groupId: 'P2-8', partLabel: 'a', groupIntro: 'A shop sells notebooks at $3 each. Buy 4 notebooks and get 1 free.', stem: 'Mr Tan has $24. What is the greatest number of notebooks he can get?', answer: '10', skillName: 'Money word problem', workedSolution: '$24 buys 8 notebooks; every 4 bought gives 1 free → 8 + 2 = 10.' },
    { order: 39, section: 'C', paper: 2, marks: 2, type: 'short_answer', groupId: 'P2-8', partLabel: 'b', groupIntro: 'A shop sells notebooks at $3 each. Buy 4 notebooks and get 1 free.', stem: 'Sara wants exactly 13 notebooks. What is the least amount she must pay?', answer: '33', unit: '$', skillName: 'Money word problem', workedSolution: '10 notebooks (8 paid) = $24, plus 3 more = $9 → $33.' },
    { order: 40, section: 'C', paper: 2, marks: 2, type: 'short_answer', groupId: 'P2-9', partLabel: 'a', groupIntro: 'A rectangular garden is 24 m long and 16 m wide.', stem: 'Find the perimeter of the garden.', answer: '80', unit: 'm', skillName: 'Perimeter word problem', workedSolution: '2 × (24 + 16) = 80 m.' },
    { order: 41, section: 'C', paper: 2, marks: 2, type: 'short_answer', groupId: 'P2-9', partLabel: 'b', groupIntro: 'A rectangular garden is 24 m long and 16 m wide.', stem: 'Fencing costs $5 per metre. Find the total cost to fence around the garden.', answer: '400', unit: '$', skillName: 'Multi-step word problem', workedSolution: '80 m × $5 = $400.' },
    { order: 42, section: 'C', paper: 2, marks: 2, type: 'short_answer', groupId: 'P2-10', partLabel: 'a', groupIntro: 'A water tank held 45 litres of water. Water flows out at 3 litres per minute.', stem: 'How much water is left after 6 minutes?', answer: '27', unit: 'L', skillName: 'Rate word problem', workedSolution: '45 − 3 × 6 = 45 − 18 = 27 litres.' },
    { order: 43, section: 'C', paper: 2, marks: 2, type: 'short_answer', groupId: 'P2-10', partLabel: 'b', groupIntro: 'A water tank held 45 litres of water. Water flows out at 3 litres per minute.', stem: 'How many minutes will it take for the tank to be empty?', answer: '15', unit: 'min', skillName: 'Rate word problem', workedSolution: '45 ÷ 3 = 15 minutes.' },
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
