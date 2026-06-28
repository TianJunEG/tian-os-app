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

async function run() {
  await mongoose.connect(URI);
  const papers = [P5_MOCK_A];
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
