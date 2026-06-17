// Ingest real exam-paper questions into the shared question bank, anchored to a
// DEVELOPMENTAL skill graph: every P6 skill traces back through prerequisites to
// a lower-primary foundation, so a hard P6 question is the "top" of a chain of
// steps a learner grows through (Primary 2 → … → Primary 6). The recommendation
// engine (routes/mastery.js) walks topic order → skill order, and the skill
// prerequisites let any surface reason about what to shore up before a hard item.
//
//   node scripts/seedExamPapers.js     (or: npm run seed:exampapers)
//
// Run AFTER seedFoundation.js (needs the Math subject). This file owns the FULL
// ordered Math topic→skill taxonomy — it RE-USES the topic names and skills that
// seedFoundation.js creates (Whole Numbers, Fractions, Decimals, Area and
// Perimeter, Word Problems) so there are no duplicate topics and no colliding
// skill orders; it simply enriches them with developmental order + prerequisites
// and extends them up to Primary 6. Idempotent: upserts topics/skills by name and
// deletes+reinserts only this paper's questions (by `sourceRef`).
//
// Pilot source: P6 Maths Prelim 2025 (Tao Nan School). Text-self-contained items
// are in QUESTIONS. Diagram-dependent items are in FIGURE_QUESTIONS — they are
// inserted with hasFigure:true and a figureUrl asset path; the matching images
// must be produced (see scripts/exam-papers/P6_TaoNan_Prelim_2025_figures.md).
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';

dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Seed script: refusing to run in production (NODE_ENV=production).");
  process.exit(1);
}
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const SOURCE_REF = 'P6_TaoNan_Prelim_2025';
const FIGURE_BASE = '/figures/p6-taonan-prelim-2025/';   // served from frontend/public

// ---- Developmental skill graph -------------------------------------------
// Topics in curriculum order; skills within each ordered earliest → most
// advanced. `prereqs` names skills (in ANY topic) that must come first. Skills
// marked (F) are also created by seedFoundation.js — listing them here keeps a
// single, consistently-ordered source of truth.
const TOPICS = [
  { name: 'Whole Numbers', level: 'Primary 4', skills: [
    { name: 'Place value to 1000', level: 'Primary 2', prereqs: [] },
    { name: 'Place value to 100 000', level: 'Primary 4', prereqs: ['Place value to 1000'] },          // (F)
    { name: 'Multiplication facts', level: 'Primary 4', prereqs: ['Place value to 1000'] },             // (F)
    { name: 'Long division', level: 'Primary 4', prereqs: ['Multiplication facts'] },                   // (F)
    { name: 'Rounding whole numbers', level: 'Primary 4', prereqs: ['Place value to 100 000'] },
    { name: 'Order of operations', level: 'Primary 6', prereqs: ['Place value to 100 000', 'Long division'] },
  ] },
  { name: 'Fractions', level: 'Primary 4', skills: [
    { name: 'Understanding fractions', level: 'Primary 3', prereqs: [] },
    { name: 'Equivalent fractions', level: 'Primary 4', prereqs: ['Understanding fractions'] },         // (F)
    { name: 'Simplifying fractions', level: 'Primary 4', prereqs: ['Equivalent fractions'] },           // (F)
    { name: 'Adding like fractions', level: 'Primary 4', prereqs: ['Understanding fractions'] },        // (F)
    { name: 'Adding unlike fractions', level: 'Primary 4', prereqs: ['Adding like fractions', 'Equivalent fractions'] }, // (F)
    { name: 'Subtracting unlike fractions', level: 'Primary 4', prereqs: ['Adding unlike fractions'] }, // (F)
    { name: 'Multiplying fractions by whole numbers', level: 'Primary 4', prereqs: ['Equivalent fractions'] }, // (F)
    { name: 'Mixed numbers and improper fractions', level: 'Primary 4', prereqs: ['Equivalent fractions'] },
    { name: 'Dividing by a fraction in context', level: 'Primary 6', prereqs: ['Mixed numbers and improper fractions'] },
    { name: 'Fraction word problems', level: 'Primary 4', prereqs: ['Adding unlike fractions', 'Multiplying fractions by whole numbers'] }, // (F)
    { name: 'Fraction word problems (remainder concept)', level: 'Primary 6', prereqs: ['Fraction word problems', 'Mixed numbers and improper fractions'] },
    { name: 'Fraction word problems (equal units)', level: 'Primary 6', prereqs: ['Fraction word problems (remainder concept)'] },
  ] },
  { name: 'Decimals', level: 'Primary 4', skills: [
    { name: 'Decimal place value', level: 'Primary 4', prereqs: ['Place value to 100 000'] },           // (F)
    { name: 'Decimals on a number line', level: 'Primary 4', prereqs: ['Decimal place value'] },
    { name: 'Adding decimals', level: 'Primary 4', prereqs: ['Decimal place value'] },                  // (F)
    { name: 'Subtracting decimals', level: 'Primary 4', prereqs: ['Decimal place value'] },
    { name: 'Decimals and fractions', level: 'Primary 4', prereqs: ['Decimal place value', 'Equivalent fractions'] }, // (F)
  ] },
  { name: 'Measurement and Time', level: 'Primary 5', skills: [
    { name: 'Telling time and the 24-hour clock', level: 'Primary 4', prereqs: [] },
    { name: 'Duration and time intervals', level: 'Primary 5', prereqs: ['Telling time and the 24-hour clock'] },
    { name: 'Comparing decimals, fractions and measurements', level: 'Primary 5', prereqs: ['Decimal place value', 'Equivalent fractions'] },
  ] },
  { name: 'Ratio', level: 'Primary 6', skills: [
    { name: 'Understanding ratio', level: 'Primary 5', prereqs: ['Equivalent fractions'] },
    { name: 'Simplifying and equivalent ratios', level: 'Primary 5', prereqs: ['Understanding ratio'] },
    { name: 'Ratio word problems (comparing quantities)', level: 'Primary 6', prereqs: ['Simplifying and equivalent ratios'] },
    { name: 'Ratio before and after (difference unchanged)', level: 'Primary 6', prereqs: ['Ratio word problems (comparing quantities)'] },
    { name: 'Ratio with multiple quantities and total value', level: 'Primary 6', prereqs: ['Ratio word problems (comparing quantities)'] },
  ] },
  { name: 'Percentage', level: 'Primary 6', skills: [
    { name: 'Understanding percentage', level: 'Primary 5', prereqs: ['Equivalent fractions'] },
    { name: 'Percentage of a quantity', level: 'Primary 5', prereqs: ['Understanding percentage'] },
    { name: 'Percentage increase and decrease', level: 'Primary 6', prereqs: ['Percentage of a quantity'] },
    { name: 'Percentage word problems', level: 'Primary 6', prereqs: ['Percentage increase and decrease'] },
    { name: 'Percentage before and after (repeated identity)', level: 'Primary 6', prereqs: ['Percentage word problems'] },
  ] },
  { name: 'Rate and Speed', level: 'Primary 6', skills: [
    { name: 'Rate', level: 'Primary 5', prereqs: ['Understanding ratio'] },
    { name: 'Speed, distance and time', level: 'Primary 6', prereqs: ['Rate'] },
    { name: 'Average speed and relative motion', level: 'Primary 6', prereqs: ['Speed, distance and time'] },
    { name: 'Rate and tiered charges', level: 'Primary 6', prereqs: ['Rate'] },
  ] },
  { name: 'Angles and Geometry', level: 'Primary 6', skills: [
    { name: 'Parallel and perpendicular lines', level: 'Primary 4', prereqs: [] },
    { name: 'Symmetry', level: 'Primary 4', prereqs: [] },
    { name: 'Position and compass directions', level: 'Primary 5', prereqs: [] },
    { name: 'Angles on a line and at a point', level: 'Primary 5', prereqs: [] },
    { name: 'Angles in special quadrilaterals', level: 'Primary 6', prereqs: ['Angles on a line and at a point'] },
    { name: 'Drawing and constructing figures', level: 'Primary 6', prereqs: ['Parallel and perpendicular lines', 'Angles on a line and at a point'] },
  ] },
  { name: 'Area and Perimeter', level: 'Primary 4', skills: [
    { name: 'Perimeter of rectangles', level: 'Primary 4', prereqs: [] },                               // (F)
    { name: 'Area of rectangles', level: 'Primary 4', prereqs: [] },                                    // (F)
    { name: 'Area of a triangle', level: 'Primary 5', prereqs: ['Area of rectangles'] },
    { name: 'Circumference and area of a circle', level: 'Primary 6', prereqs: ['Area of rectangles'] },
    { name: 'Perimeter and area of circle parts', level: 'Primary 6', prereqs: ['Circumference and area of a circle'] },
    { name: 'Composite figures (area and perimeter)', level: 'Primary 6', prereqs: ['Area of a triangle', 'Perimeter and area of circle parts'] },
  ] },
  { name: 'Volume', level: 'Primary 6', skills: [
    { name: 'Reading measuring scales', level: 'Primary 3', prereqs: [] },
    { name: 'Volume of cubes and cuboids', level: 'Primary 5', prereqs: ['Area of rectangles'] },
    { name: 'Nets and volume of cuboids', level: 'Primary 6', prereqs: ['Volume of cubes and cuboids'] },
    { name: 'Volume and water level (rate)', level: 'Primary 6', prereqs: ['Volume of cubes and cuboids', 'Rate'] },
    { name: 'Visualising solids and unit cubes', level: 'Primary 6', prereqs: ['Volume of cubes and cuboids'] },
  ] },
  { name: 'Algebra', level: 'Primary 6', skills: [
    { name: 'Number patterns', level: 'Primary 5', prereqs: [] },
    { name: 'Algebraic notation and forming expressions', level: 'Primary 6', prereqs: ['Number patterns'] },
    { name: 'Evaluating algebraic expressions', level: 'Primary 6', prereqs: ['Algebraic notation and forming expressions', 'Order of operations'] },
    { name: 'Simplifying algebraic expressions', level: 'Primary 6', prereqs: ['Algebraic notation and forming expressions'] },
    { name: 'Solving word problems with algebra', level: 'Primary 6', prereqs: ['Evaluating algebraic expressions'] },
    { name: 'Number patterns and grouping', level: 'Primary 6', prereqs: ['Number patterns'] },
  ] },
  { name: 'Data Analysis', level: 'Primary 6', skills: [
    { name: 'Reading tables and bar graphs', level: 'Primary 4', prereqs: [] },
    { name: 'Line graphs', level: 'Primary 5', prereqs: ['Reading tables and bar graphs'] },
    { name: 'Average (mean)', level: 'Primary 5', prereqs: ['Reading tables and bar graphs'] },
    { name: 'Pie charts', level: 'Primary 6', prereqs: ['Line graphs', 'Percentage of a quantity'] },
  ] },
  { name: 'Number Theory', level: 'Primary 6', skills: [
    { name: 'Factors and multiples', level: 'Primary 4', prereqs: [] },
    { name: 'HCF and LCM word problems', level: 'Primary 6', prereqs: ['Factors and multiples'] },
  ] },
  { name: 'Word Problems', level: 'Primary 5', skills: [
    { name: 'Model drawing', level: 'Primary 5', prereqs: [] },                                         // (F)
    { name: 'Multi-step word problems', level: 'Primary 5', prereqs: ['Model drawing'] },               // (F)
  ] },
  { name: 'Money and Reasoning', level: 'Primary 6', skills: [
    { name: 'Money word problems and reasoning', level: 'Primary 6', prereqs: [] },
  ] },
];

// ---- Questions (text-self-contained items only) ---------------------------
const QUESTIONS = [
  // ----- Paper 1, Booklet A (MCQ) -----
  { q: 'P1 Q1', skill: 'Decimal place value', difficulty: 'easy', type: 'mcq',
    stem: 'In 165.324, which digit is in the hundredths place?',
    choices: ['1', '2', '3', '4'], answer: '2',
    workedSolution: 'Tenths = 3, hundredths = 2, thousandths = 4.' },
  { q: 'P1 Q5', skill: 'Rate', difficulty: 'easy', type: 'mcq',
    stem: 'A machine prints 15 postcards in 5 minutes. At this rate, how many postcards can it print in 50 minutes?',
    choices: ['75', '150', '250', '750'], answer: '150',
    workedSolution: '15 ÷ 5 = 3 per min; 3 × 50 = 150.' },
  { q: 'P1 Q6', skill: 'Comparing decimals, fractions and measurements', difficulty: 'medium', type: 'mcq',
    stem: 'Arrange these masses from the lightest to the heaviest: 2.35 kg, 2 kg 50 g, 2 3/10 kg.',
    choices: [
      '2.35 kg, 2 3/10 kg, 2 kg 50 g',
      '2 3/10 kg, 2.35 kg, 2 kg 50 g',
      '2 kg 50 g, 2.35 kg, 2 3/10 kg',
      '2 kg 50 g, 2 3/10 kg, 2.35 kg',
    ], answer: '2 kg 50 g, 2 3/10 kg, 2.35 kg',
    workedSolution: 'Convert to kg: 2 kg 50 g = 2.05, 2 3/10 = 2.30, and 2.35. Order: 2.05 < 2.30 < 2.35.' },
  { q: 'P1 Q7', skill: 'Mixed numbers and improper fractions', difficulty: 'medium', type: 'mcq',
    stem: 'How many eighths are there in 3 5/8?',
    choices: ['35', '29', '23', '16'], answer: '29',
    workedSolution: '3 5/8 = (3 × 8 + 5)/8 = 29/8, so 29 eighths.' },
  { q: 'P1 Q8', skill: 'Rounding whole numbers', difficulty: 'easy', type: 'mcq',
    stem: 'Round 47 458 to the nearest thousand.',
    choices: ['47 000', '47 460', '47 500', '48 000'], answer: '47 000',
    workedSolution: 'The hundreds digit is 4 (< 5), so round down to 47 000.' },
  { q: 'P1 Q9', skill: 'Ratio word problems (comparing quantities)', difficulty: 'medium', type: 'mcq',
    stem: 'There are 48 chocolates in a box. 36 of them are milk chocolates while the rest are dark chocolates. What is the ratio of the number of dark chocolates to the number of milk chocolates?',
    choices: ['1 : 3', '1 : 4', '3 : 1', '3 : 4'], answer: '1 : 3',
    workedSolution: 'Dark = 48 − 36 = 12. Ratio dark : milk = 12 : 36 = 1 : 3.' },
  { q: 'P1 Q12', skill: 'Solving word problems with algebra', difficulty: 'hard', type: 'mcq',
    stem: 'Ali had y marbles. Bala had 5 more marbles than Ali. Charles had 3 times as many marbles as Ali. They had 45 marbles altogether. How many more marbles did Charles have than Bala?',
    choices: ['8', '10', '11', '15'], answer: '11',
    workedSolution: 'y + (y + 5) + 3y = 45 → 5y + 5 = 45 → y = 8. Charles = 24, Bala = 13. 24 − 13 = 11.' },
  { q: 'P1 Q13', skill: 'Visualising solids and unit cubes', difficulty: 'hard', type: 'mcq',
    stem: '64 unit cubes of side 1 cm are glued to form a 4 cm by 4 cm by 4 cm cube. The whole cube is painted red, including the base. How many of the unit cubes have exactly 2 faces painted red?',
    choices: ['16', '18', '24', '32'], answer: '24',
    workedSolution: 'Cubes with exactly 2 painted faces lie along the edges (not corners): each of the 12 edges has 4 − 2 = 2 such cubes. 12 × 2 = 24.' },
  { q: 'P1 Q14', skill: 'HCF and LCM word problems', difficulty: 'medium', type: 'mcq',
    stem: 'Lisa packed 60 cream cookies and 75 mint cookies into as many boxes as possible. She packed the same number of each type of cookie in each box. How many mint cookies were there in each box?',
    choices: ['5', '9', '15', '4'], answer: '5',
    workedSolution: 'Most boxes = HCF(60, 75) = 15. Mint per box = 75 ÷ 15 = 5.' },

  // ----- Paper 1, Booklet B (short answer) -----
  { q: 'P1 Q16', skill: 'Subtracting decimals', difficulty: 'easy', type: 'short_answer',
    stem: 'Find the value of 11.1 − 0.77.', answer: '10.33',
    workedSolution: '11.10 − 0.77 = 10.33.' },
  { q: 'P1 Q17', skill: 'Duration and time intervals', difficulty: 'medium', type: 'short_answer',
    stem: 'Ted completed his 1.6 km walk/run in 11 min 40 s. Veronica was faster than Ted by 55 s. What was Veronica’s timing?',
    answer: '10 min 45 s',
    workedSolution: '11 min 40 s = 700 s. 700 − 55 = 645 s = 10 min 45 s.' },
  { q: 'P1 Q18', skill: 'Perimeter and area of circle parts', difficulty: 'medium', type: 'short_answer',
    stem: 'Find the perimeter of a quarter circle of radius 7 cm. (Take π = 22/7)',
    answer: '25 cm',
    workedSolution: 'Arc = 1/4 × 2 × 22/7 × 7 = 11 cm. Add two radii: 11 + 7 + 7 = 25 cm.' },
  { q: 'P1 Q19', skill: 'Speed, distance and time', difficulty: 'medium', type: 'short_answer',
    stem: 'Johann took 15 minutes to walk from home to school at an average speed of 70 m/min. How far was school from home?',
    answer: '1050 m',
    workedSolution: '70 × 15 = 1050 m (= 1.05 km). Note: the original answer line is marked "km"; the official key gives 1050.' },
  { q: 'P1 Q21a', skill: 'Order of operations', difficulty: 'medium', type: 'short_answer',
    stem: 'Find the value of 32 − 4 × 5 + (18 − 6 ÷ 3).',
    answer: '28',
    workedSolution: '(18 − 6 ÷ 3) = 18 − 2 = 16. 4 × 5 = 20. 32 − 20 + 16 = 28.' },
  { q: 'P1 Q21b', skill: 'Evaluating algebraic expressions', difficulty: 'medium', type: 'short_answer',
    stem: 'Find the value of 5m − 6 + 2m when m = 4.',
    answer: '22',
    workedSolution: '5(4) − 6 + 2(4) = 20 − 6 + 8 = 22.' },
  { q: 'P1 Q23', skill: 'Ratio word problems (comparing quantities)', difficulty: 'medium', type: 'short_answer',
    stem: 'The ratio of the length of a rectangle to its breadth is 7 : 3. The length of the rectangle is 12 cm longer than its breadth. Find the length of the rectangle.',
    answer: '21 cm',
    workedSolution: 'Length − breadth = 7 − 3 = 4 units = 12 cm, so 1 unit = 3 cm. Length = 7 units = 21 cm.' },
  { q: 'P1 Q24', skill: 'Average (mean)', difficulty: 'easy', type: 'short_answer',
    stem: 'Find the average of the following numbers: 101, 0, 125, 74.',
    answer: '75',
    workedSolution: '(101 + 0 + 125 + 74) ÷ 4 = 300 ÷ 4 = 75.' },
  { q: 'P1 Q27', skill: 'Dividing by a fraction in context', difficulty: 'hard', type: 'short_answer',
    stem: 'Mrs Chong has 2 rolls of ribbon each 9/10 m long. She cuts the ribbon into equal pieces to make bows. Each piece is 1/5 m long. How many bows can she make?',
    answer: '8',
    workedSolution: 'Each roll: 9/10 ÷ 1/5 = 4 1/2, so only 4 whole pieces per roll (the 1/2 piece is too short). 2 rolls × 4 = 8 bows.' },
  { q: 'P1 Q28', skill: 'Percentage word problems', difficulty: 'hard', type: 'short_answer',
    stem: 'After a 10% discount, the price of an admission ticket to the amusement park is $45. Children are given a further discount of $3. What is the percentage discount for one child ticket?',
    answer: '16 %',
    workedSolution: 'Original price: $45 is 90%, so 100% = $50. Child pays $45 − $3 = $42, a $8 discount from $50. 8/50 × 100% = 16%.' },
  { q: 'P1 Q29', skill: 'Duration and time intervals', difficulty: 'medium', type: 'short_answer',
    stem: 'At a movie marathon, John watched movies one after another without any break. He started the first movie at 18 30. The durations were: 1st 1 h 20 min, 2nd 50 min, 3rd 1 h 30 min, 4th 2 h 5 min. At what time did he start to watch the 4th movie? (Give your answer in 24-hour clock.)',
    answer: '2210',
    workedSolution: 'Before the 4th movie: 1 h 20 min + 50 min + 1 h 30 min = 3 h 40 min. 18 30 + 3 h 40 min = 22 10.' },
  { q: 'P1 Q30', skill: 'Number patterns and grouping', difficulty: 'hard', type: 'short_answer',
    stem: 'A number pattern is arranged in 4 columns A, B, C, D. Row 1: A=3, B=4, C=5, D=6. Row 2: A=10, B=9, C=8, D=7. Row 3: A=11, B=12, C=13, D=14, and so on (odd rows increase left-to-right, even rows decrease). In which column and which row will the number 498 appear?',
    answer: 'Column A, Row 124',
    workedSolution: 'Row n holds the four numbers 4n−1 to 4n+2. 498 = 4(124)+2, so it is in Row 124. Row 124 is even (decreasing), so Column A holds the largest value, 498.' },

  // ----- Paper 2 -----
  { q: 'P2 Q1', skill: 'Fraction word problems (remainder concept)', difficulty: 'hard', type: 'short_answer',
    stem: 'A baker had 300 eggs at first. In the morning, he used some eggs. In the afternoon, he used 1/3 of the remaining eggs. After that, there were 60 eggs left. How many eggs did the baker use in the morning?',
    answer: '210',
    workedSolution: 'After the afternoon, 2/3 of the remainder = 60, so the remainder after the morning = 90. Morning used = 300 − 90 = 210.' },
  { q: 'P2 Q3', skill: 'Ratio before and after (difference unchanged)', difficulty: 'hard', type: 'short_answer',
    stem: 'There were 50 red pens and 230 blue pens. After an equal number of red and blue pens were added, the ratio of the number of red pens to the number of blue pens became 1 : 3. How many red pens were there in the end?',
    answer: '90',
    workedSolution: 'Adding the same number to both keeps the difference 230 − 50 = 180. After, blue − red = 3 − 1 = 2 units = 180, so 1 unit = 90. Red = 1 unit = 90.' },
  { q: 'P2 Q4', skill: 'Simplifying algebraic expressions', difficulty: 'hard', type: 'short_answer',
    stem: 'Siti had 35 marbles and Ted had more marbles than her. After giving Siti m marbles, Ted had 20 more marbles than Siti. How many marbles did Ted have at first? Give your answer in terms of m in the simplest form.',
    answer: '2m + 55',
    workedSolution: 'After: Siti = 35 + m, Ted = (35 + m) + 20. Ted at first = Ted now + m = 35 + m + 20 + m = 2m + 55.' },
  { q: 'P2 Q5', skill: 'Average speed and relative motion', difficulty: 'hard', type: 'short_answer',
    stem: 'A cyclist and a motorist started travelling at the same time from point A to point B. The motorist’s average speed was 16 km/h faster than the cyclist. When the motorist reached point B in 12 minutes, the cyclist had only travelled 3/5 of the distance. What was the cyclist’s average speed in km/h?',
    answer: '24 km/h',
    workedSolution: 'In 12 min (0.2 h) the motorist’s lead = 16 × 0.2 = 3.2 km, which is 2/5 of the distance. So 1/5 = 1.6 km and the full distance = 4.8 km. Cyclist speed = 4.8 ÷ 0.2 = 24 km/h.' },
  { q: 'P2 Q6', skill: 'Percentage before and after (repeated identity)', difficulty: 'hard', type: 'short_answer',
    stem: 'A box contained some yellow cubes and 72 blue cubes. 40% of the cubes were yellow. After some red cubes were added into the box, 32% of the cubes were yellow. How many red cubes were there?',
    answer: '30',
    workedSolution: 'Blue = 60% = 72, so total = 120 and yellow = 48. Yellow is unchanged: 48 = 32% of the new total → total = 150. Red added = 150 − 120 = 30.' },
  { q: 'P2 Q7', skill: 'Nets and volume of cuboids', difficulty: 'hard', type: 'short_answer',
    stem: 'The net of a cuboid has 2 square faces. The ratio of the length to the breadth is 3 : 2. The perimeter of the net is 128 cm. Find the volume of the cuboid.',
    answer: '768 cm³',
    workedSolution: 'The net’s perimeter = 32 units (length = 3 units, breadth = 2 units). 1 unit = 128 ÷ 32 = 4 cm, so length = 12 cm and breadth = 8 cm. With two square 8×8 faces, volume = 8 × 8 × 12 = 768 cm³.' },
  { q: 'P2 Q8', skill: 'Fraction word problems (equal units)', difficulty: 'hard', type: 'short_answer',
    stem: 'After Aini gave 1/6 of her stickers away and Bala gave 1/4 of his stickers away, both of them had the same number of stickers left. The total number of stickers Aini and Bala gave away was 2280. How many stickers did Bala have at first?',
    answer: '5700',
    workedSolution: 'Let the equal amount left = L. Aini gave L/5 (since 5/6 left) and Bala gave L/3 (since 3/4 left). L/5 + L/3 = 8L/15 = 2280 → L = 4275. Bala at first = 4/3 × L = 5700.' },
  { q: 'P2 Q9', skill: 'Percentage word problems', difficulty: 'hard', type: 'short_answer',
    stem: 'At a concert, there were 30% more women than men and 25% more boys than girls. There were 250 people at the concert with as many males as females. How many girls were there at the concert?',
    answer: '60',
    workedSolution: 'Let men = M. Women = 1.3M; girls = G, boys = 1.25G. Males = females → M + 1.25G = 1.3M + G → 0.25G = 0.3M → G = 1.2M. Total 5M = 250 → M = 50, G = 60.' },
  { q: 'P2 Q10', skill: 'Volume and water level (rate)', difficulty: 'hard', type: 'short_answer',
    stem: 'Tank X is a rectangular tank with a base area of 48 cm² and height 9 cm, containing 432 cm³ of water. Tank Y is an empty rectangular tank with a base 8 cm by 3 cm. Water drips at a rate of 3 cm³ per second from a tap at the bottom of Tank X into Tank Y. How long did it take for the height of the water level in Tank Y to be 3 cm above that of Tank X?',
    answer: '64 s',
    workedSolution: 'Let v cm³ drain. Height in X = (432 − v)/48, height in Y = v/24. Set v/24 = (432 − v)/48 + 3 → 2v = 432 − v + 144 → 3v = 576 → v = 192. Time = 192 ÷ 3 = 64 s.' },
  { q: 'P2 Q11b', skill: 'Rate and tiered charges', difficulty: 'medium', type: 'short_answer',
    stem: 'Water is charged at $3.50 per m³ for the first 40 m³ used, and $4.50 for every additional m³. In May, a family used 50 m³ of water. How much did they pay for their water bill in May?',
    answer: '$185',
    workedSolution: 'First 40 m³: 40 × $3.50 = $140. Next 10 m³: 10 × $4.50 = $45. Total = $185.' },
  { q: 'P2 Q13a', skill: 'Number patterns and grouping', difficulty: 'hard', type: 'short_answer',
    stem: '1 m white lines are painted on a road as lane markings. The 7 white lines just before a traffic light crossing are 1 m apart, while all the other white lines are 3 m apart. The distance between two traffic light crossings along a straight stretch of road is 493 m. How many 1 m white lines are there between the two traffic light crossings?',
    answer: '127',
    workedSolution: 'The 7 close lines span 7 lines + 6 one-metre gaps = 13 m. Remaining 493 − 13 = 480 m has lines spaced "1 m line + 3 m gap" = 4 m each: 480 ÷ 4 = 120 lines. Total = 120 + 7 = 127.' },
  { q: 'P2 Q13b', skill: 'Average speed and relative motion', difficulty: 'hard', type: 'short_answer',
    stem: 'George and Hariz started jogging at the same time but in opposite directions, from one traffic light crossing towards the other, 493 m apart. George’s speed was 5 m/s and Hariz’s speed was 4 m/s, and both kept their speeds throughout. After jogging for 1 minute, how far apart were George and Hariz from each other?',
    answer: '47 m',
    workedSolution: 'Combined they cover 5 + 4 = 9 m/s. In 60 s they cover 540 m. Since the path is 493 m, after passing each other they are 540 − 493 = 47 m apart.' },
  { q: 'P2 Q15', skill: 'Average (mean)', difficulty: 'hard', type: 'short_answer',
    stem: 'The average height of a group of 3 girls and 5 boys was 160 cm. The average height of the 3 girls was 12 cm less than the average height of the 5 boys. Find the average height of the 5 boys.',
    answer: '164.5 cm',
    workedSolution: 'Total = 160 × 8 = 1280 cm. If boys’ average = b, girls’ average = b − 12: 5b + 3(b − 12) = 1280 → 8b = 1316 → b = 164.5 cm.' },
  { q: 'P2 Q16a', skill: 'Ratio with multiple quantities and total value', difficulty: 'hard', type: 'short_answer',
    stem: 'Mr Abdul received some vouchers in denominations of $2, $5 and $10. There were as many $10 vouchers as $5 vouchers. The ratio of the number of $2 vouchers to the number of $10 vouchers was 3 : 2. The value of all the vouchers was $1260. What was the total value of the $2 vouchers he received?',
    answer: '$210',
    workedSolution: 'Counts $5 : $10 : $2 = 2 : 2 : 3. One set value = 2×$5 + 2×$10 + 3×$2 = $36. Sets = 1260 ÷ 36 = 35. Value of $2 vouchers = 35 × (3 × $2) = $210.' },
  { q: 'P2 Q16b', skill: 'Money word problems and reasoning', difficulty: 'hard', type: 'short_answer',
    stem: 'Mr Abdul had 4 $2 vouchers, 2 $5 vouchers and 1 $10 voucher left. He bought food from 3 stalls costing $8, $9 and $11. Payment at each stall could be vouchers, cash, or a combination, but the value of vouchers used at a stall cannot exceed the cost of the food. What was the least amount he could have paid in cash?',
    answer: '$2',
    workedSolution: 'Stall B ($9): $5 + $2 + $2 = $9 → $0 cash. Stall A ($8): $5 + $2 = $7 → $1 cash. Stall C ($11): $10 → $1 cash. Least cash = $1 + $1 = $2.' },
];

// ---- Diagram-dependent questions ------------------------------------------
// Inserted with hasFigure:true and a figureUrl asset path. `fig` is the figure
// id; the image must be produced at FIGURE_BASE + fig + '.svg' (see the figures
// prompt doc). `figureAlt` is the short description used as alt text + the brief
// for image generation.
const FIGURE_QUESTIONS = [
  { q: 'P1 Q2', fig: 'p1-q2', skill: 'Parallel and perpendicular lines', difficulty: 'medium', type: 'mcq',
    stem: 'Which two lines are perpendicular to each other?',
    choices: ['AB and BC', 'AB and AE', 'AE and BC', 'AE and CD'], answer: 'AB and BC',
    figureAlt: 'A square dotted grid with points A, B, C, D, E joined by line segments AB, BC, CD, DE, EA forming an irregular figure; AB meets BC at a right angle.' },
  { q: 'P1 Q3', fig: 'p1-q3', skill: 'Reading measuring scales', difficulty: 'medium', type: 'mcq',
    stem: 'What is the total volume of water in the two containers?',
    choices: ['450 ml', '550 ml', '800 ml', '900 ml'], answer: '800 ml',
    figureAlt: 'Two measuring cylinders. Left cylinder graduated to 1000 ml with water at 600 ml; right cylinder graduated to 500 ml with water at 200 ml.' },
  { q: 'P1 Q4', fig: 'p1-q4', skill: 'Decimals on a number line', difficulty: 'medium', type: 'mcq',
    stem: 'In the number line, what is the value represented by A?',
    choices: ['7.30', '7.60', '7.75', '8.25'], answer: '7.75',
    figureAlt: 'A horizontal number line from 7 to 9 divided into 8 equal intervals (each 0.25); an arrow labelled A points to the third tick after 7 (7.75).' },
  { q: 'P1 Q10', fig: 'p1-q10', skill: 'Angles on a line and at a point', difficulty: 'medium', type: 'mcq',
    stem: 'AB and CD are straight lines. Find ∠m.',
    choices: ['25°', '35°', '60°', '65°'], answer: '65°',
    figureAlt: 'Two straight lines AB and CD crossing at a point with a third ray; marked angles 30° and 125° around the intersection, with the unknown angle m below; a small right-angle mark is shown.' },
  { q: 'P1 Q11', fig: 'p1-q11', skill: 'Pie charts', difficulty: 'medium', type: 'mcq',
    stem: 'Some students were asked to choose their favourite hobby. The pie chart represents their choices. Which hobby was chosen by 1/5 of the students?',
    choices: ['Dancing', 'Gaming', 'Jogging', 'Reading'], answer: 'Reading',
    figureAlt: 'A pie chart of favourite hobbies with sectors labelled Jogging 30, Reading 48, Gaming 62, Dancing 40, and Cycling (a right-angle/90° sector). Total 240.' },
  { q: 'P1 Q15', fig: 'p1-q15', skill: 'Composite figures (area and perimeter)', difficulty: 'hard', type: 'mcq',
    stem: 'The figure is made up of three identical right-angled triangles. The perimeter of the figure is 72 cm. Find the area of the figure.',
    choices: ['96 cm²', '192 cm²', '288 cm²', '360 cm²'], answer: '288 cm²',
    figureAlt: 'Three identical right-angled triangles arranged around a common point; a vertical side is labelled 24 cm and a hypotenuse 20 cm.' },
  { q: 'P1 Q20', fig: 'p1-q20', skill: 'Line graphs', difficulty: 'easy', type: 'short_answer',
    stem: 'The line graph shows the height of a plant measured from March to August. What was the height of the plant in May?',
    answer: '95 cm',
    figureAlt: 'A line graph, y-axis "Height of plant (cm)" 0–160, x-axis months Mar–Aug. Points roughly: Mar 35, Apr 70, May 95, Jun 105, Jul 132, Aug 142.' },
  { q: 'P1 Q22a', fig: 'p1-q22', skill: 'Position and compass directions', difficulty: 'medium', type: 'short_answer',
    stem: 'The square grid shows the positions of eight points A–H, with a North arrow. Fill in the blanks with north, south, east or west: F is ___ of D and ___ of G.',
    answer: 'West; North',
    figureAlt: 'A square grid with a North arrow and eight labelled points A, B, C, D, E, F, G, H placed at grid intersections (A top-left, B top-right, C right, H left-middle, E middle, F lower-middle-left, D lower-middle-right, G bottom).' },
  { q: 'P1 Q22b', fig: 'p1-q22', skill: 'Position and compass directions', difficulty: 'medium', type: 'short_answer',
    stem: 'The square grid shows the positions of eight points A–H, with a North arrow. Write down all possible points that are south-west of B.',
    answer: 'E, F',
    figureAlt: 'Same eight-point grid with North arrow as the previous part (A, B, C, D, E, F, G, H on a square grid).' },
  { q: 'P1 Q25', fig: 'p1-q25', skill: 'Drawing and constructing figures', difficulty: 'hard', type: 'open_ended',
    stem: 'The square grid shows lines ST and TU, which are two sides of a trapezium. ∠TSV = 90°. Draw trapezium STUV and label the vertices clearly.',
    answer: 'Construct V so that SV is perpendicular to ST (∠TSV = 90°) and VU is parallel to ST, giving trapezium STUV.',
    figureAlt: 'A square grid showing two connected line segments: S to T (sloping down-right) and T to U (sloping more steeply down-right), the two given sides of a trapezium.' },
  { q: 'P1 Q26a', fig: 'p1-q26', skill: 'Visualising solids and unit cubes', difficulty: 'medium', type: 'open_ended',
    stem: 'Pamela builds a solid using 8 cubes of side 1 cm; the front view and side view are shown. Draw the top view on the grid.',
    answer: '(Drawing) the top-view footprint of the solid on the dotted grid.',
    figureAlt: 'An isometric drawing of a solid made of 8 unit cubes (an L/step shape) with arrows marking "Front view" and "Side view", plus the side-view drawn on a dot grid.' },
  { q: 'P1 Q26b', fig: 'p1-q26', skill: 'Volume of cubes and cuboids', difficulty: 'medium', type: 'short_answer',
    stem: 'Pamela builds a solid using 8 cubes of side 1 cm (shown). She wants to build a cuboid of sides 3 cm by 3 cm by 4 cm. How many more cubes does she need?',
    answer: '28',
    workedSolution: '3 × 3 × 4 = 36 cubes needed; 36 − 8 = 28 more.',
    figureAlt: 'Same solid of 8 unit cubes (step shape) as the previous part.' },
  { q: 'P2 Q2', fig: 'p2-q2', skill: 'Symmetry', difficulty: 'medium', type: 'open_ended',
    stem: 'There are 7 shaded squares in the figure. Shade 5 more squares to form a symmetric figure with AB as the line of symmetry.',
    answer: '(Drawing) reflect the existing shaded squares across the diagonal AB and shade the 5 cells needed to complete the symmetry.',
    figureAlt: 'A tilted square grid (about 6×6) with a dashed diagonal line of symmetry from A (bottom-left) to B (top-right) and 7 shaded cells positioned asymmetrically about AB.' },
  { q: 'P2 Q11a', fig: 'p2-q11', skill: 'Percentage increase and decrease', difficulty: 'medium', type: 'short_answer',
    stem: 'The line graph shows the volume of water the Tan family used from January to June. What was the percentage increase in the water used from April to May?',
    answer: '25 %',
    workedSolution: 'April 40 m³ → May 50 m³. (50 − 40)/40 × 100% = 25%.',
    figureAlt: 'A line graph, y-axis "Amount of water used (m³)" 0–60, x-axis Jan–Jun. Points: Jan 34, Feb 48, Mar 28, Apr 40, May 50, Jun 24.' },
  { q: 'P2 Q12a', fig: 'p2-q12', skill: 'Angles in special quadrilaterals', difficulty: 'hard', type: 'short_answer',
    stem: 'ABCD is a parallelogram and CFDE is a rhombus. ∠ADG = 12° and ∠DFC = 74° (see figure). Find ∠w.',
    answer: '127°',
    workedSolution: '∠EHG = (180 − 74) ÷ 2 = 53°. ∠w = 180 − 53 = 127°.',
    figureAlt: 'Parallelogram ABCD (A top-left, B top-right, C right, D lower-left) overlapping rhombus CFDE with E at top and F at bottom (apex angle 74° at F); points G and H lie on AB; angle 12° marked at D and angle w near H.' },
  { q: 'P2 Q14a', fig: 'p2-q14', skill: 'Reading tables and bar graphs', difficulty: 'hard', type: 'short_answer',
    stem: 'The bar graph shows books borrowed Mon–Fri (Friday not shown): Mon 65, Tue 90, Wed 85, Thu 40. 30% of the books borrowed from Monday to Thursday were non-fiction. The fiction books borrowed were: Mon 45, Tue 57, Thu 28 (Wednesday not shown). How many fiction books were borrowed on Wednesday?',
    answer: '66',
    workedSolution: 'Total Mon–Thu = 280; fiction = 70% × 280 = 196. 196 − (45 + 57 + 28) = 66.',
    figureAlt: 'A bar graph "Number of books borrowed" with bars Mon 65, Tue 90, Wed 85, Thu 40 and an empty/"?" slot for Fri.' },
  { q: 'P2 Q14b', fig: 'p2-q14', skill: 'Reading tables and bar graphs', difficulty: 'medium', type: 'short_answer',
    stem: 'Using the same bar graph (Mon 65, Tue 90, Wed 85, Thu 40), the number of books borrowed from Monday to Wednesday is 4 times as many as the number borrowed on Thursday and Friday combined. Find the number of books borrowed on Friday.',
    answer: '20',
    workedSolution: 'Mon–Wed = 65 + 90 + 85 = 240 = 4 × (Thu + Fri) → Thu + Fri = 60 → Fri = 60 − 40 = 20.',
    figureAlt: 'Same bar graph: Mon 65, Tue 90, Wed 85, Thu 40, Fri unknown.' },
  { q: 'P2 Q17a', fig: 'p2-q17a', skill: 'Composite figures (area and perimeter)', difficulty: 'hard', type: 'short_answer',
    stem: 'Figure 1 shows three identical rectangles in a row. The area of the shaded triangle is 256 cm². Find the difference in area between the shaded and unshaded parts.',
    answer: '1024 cm²',
    workedSolution: 'The shaded triangle is 1/6 of the three rectangles. Difference = (5/6 − 1/6) = 4/6 of the rectangles = 4 × 256 = 1024 cm².',
    figureAlt: 'Three identical rectangles placed side by side forming one long rectangle; a large shaded triangle is drawn from the bottom-left corner to the top-right corner across all three.' },
  { q: 'P2 Q17b', fig: 'p2-q17b', skill: 'Composite figures (area and perimeter)', difficulty: 'hard', type: 'short_answer',
    stem: 'Figure 2 is formed by three similar-sized circles and three similar-sized squares. Line AB passes through the centre of the three circles. The area of each square is 256 cm². Find the difference in area between the shaded and unshaded parts. (Take π = 3.14)',
    answer: '748.8 cm²',
    workedSolution: 'Square side = √256 = 16 cm. Working through the shaded/unshaded sectors and squares gives 803.84 − 55.04 = 748.8 cm².',
    figureAlt: 'Three equal circles in a row with horizontal line AB through their centres; each circle contains a tilted square (side 16 cm); various semicircle/square regions shaded to compare shaded vs unshaded area.' },
];

async function main() {
  await mongoose.connect(URI);

  const math = await Subject.findOne({ key: 'math' });
  if (!math) { console.error('No Math subject found — run `npm run seed:foundation` first.'); process.exit(1); }

  // ---- upsert topics + skills (pass 1: create), then wire prerequisites ----
  const skillByName = new Map();   // name -> skill doc
  for (let t = 0; t < TOPICS.length; t++) {
    const def = TOPICS[t];
    let topic = await Topic.findOne({ subjectId: math._id, name: def.name });
    if (!topic) topic = await Topic.create({ subjectId: math._id, name: def.name, moeLevel: def.level, order: t });
    else { topic.moeLevel = def.level; topic.order = t; await topic.save(); }

    for (let s = 0; s < def.skills.length; s++) {
      const sd = def.skills[s];
      let skill = await Skill.findOne({ topicId: topic._id, name: sd.name });
      if (!skill) skill = await Skill.create({ topicId: topic._id, name: sd.name, moeLevel: sd.level, order: s });
      else { skill.moeLevel = sd.level; skill.order = s; await skill.save(); }
      skillByName.set(sd.name, skill);
    }
  }
  // pass 2: resolve prerequisite names → ids
  let prereqLinks = 0;
  for (const def of TOPICS) {
    for (const sd of def.skills) {
      const skill = skillByName.get(sd.name);
      const ids = (sd.prereqs || []).map((n) => skillByName.get(n)?._id).filter(Boolean);
      skill.prerequisiteSkillIds = ids;
      prereqLinks += ids.length;
      await skill.save();
    }
  }

  // ---- questions: idempotent replace of just this paper's items ----
  const removed = await Question.deleteMany({ sourceRef: SOURCE_REF });
  let inserted = 0, figureItems = 0;
  const missingSkills = new Set();

  const insert = async (item, figure) => {
    const skill = skillByName.get(item.skill);
    if (!skill) { missingSkills.add(item.skill); return; }
    await Question.create({
      subjectId: math._id,
      topicId: skill.topicId,
      skillId: skill._id,
      moeLevel: 'Primary 6',
      difficulty: item.difficulty,
      type: item.type,
      stem: item.stem,
      choices: item.choices || [],
      answer: item.answer,
      workedSolution: item.workedSolution || '',
      source: 'authored',
      sourceRef: SOURCE_REF,
      hasFigure: !!figure,
      figureUrl: figure ? FIGURE_BASE + item.fig + '.svg' : '',
      figureAlt: figure ? item.figureAlt || '' : '',
    });
    inserted++;
    if (figure) figureItems++;
  };

  for (const item of QUESTIONS) await insert(item, false);
  for (const item of FIGURE_QUESTIONS) await insert(item, true);

  console.log('✅ Exam-paper ingest complete');
  console.log(`   Skill graph: ${skillByName.size} skills across ${TOPICS.length} topics, ${prereqLinks} prerequisite links`);
  console.log(`   Questions (${SOURCE_REF}): removed ${removed.deletedCount}, inserted ${inserted} (${figureItems} need figures)`);
  if (missingSkills.size) console.log(`   ⚠ questions skipped (skill not found): ${[...missingSkills].join(', ')}`);
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
