import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';
import { strategyScaffold, makeTemplate } from './pslTemplateFactory.js';

// ─── Scaffold helpers ───────────────────────────────────────────────
const DI_STRATEGIES = [
  'Read the data carefully, then add/subtract/calculate',
  'Draw a bar model from the data',
  'Use guess and check',
  'Work backwards from the answer',
];

const diScaffold = () => strategyScaffold({
  understand: [
    'Reading and interpreting data from a table or chart',
    'Comparing two equal groups',
    'Finding a pattern in numbers',
    'Sharing items equally',
  ],
  questionChoices: [
    'A value computed from the given data',
    'The total of all values',
    'The difference between two values',
    'The average of the values',
  ],
  strategyChoices: DI_STRATEGIES,
  solveType: 'expression',
  solveSpec: { operation: 'compute', expression: '{answer}', answer: '{answer}' },
});

const mk = (id, skill, level, story, constraints) =>
  makeTemplate(id, skill, 'dataInterpretation', {
    heuristic: 'data-interpretation', level, storyTemplate: story, constraints,
    scaffold: diScaffold(),
  });

const g4 = () => ({ min: 10, max: 50 });

const templates = [
  // ── P4: psl-p4-di-table-read (3) ──
  mk('psl-p4-di-table-read-01', 'psl-p4-di-table-read', 'P4',
    'The table shows books read by 4 students last month: {name1} read {valA}, {name2} read {valB}, {name3} read {valC}, {name4} read {valD}. How many books were read in total?',
    { _generic: { valA: g4(), valB: g4(), valC: g4(), valD: g4() },
      _computeStr: { answer: 'valA + valB + valC + valD' }, answer: { min: 40 } }),

  mk('psl-p4-di-table-read-02', 'psl-p4-di-table-read', 'P4',
    'The canteen recorded food orders for Monday: chicken rice {valA}, nasi lemak {valB}, fishball noodles {valC}, mee rebus {valD}. How many orders were there altogether?',
    { _generic: { valA: {min:15,max:60}, valB: {min:15,max:60}, valC: {min:15,max:60}, valD: {min:15,max:60} },
      _computeStr: { answer: 'valA + valB + valC + valD' }, answer: { min: 60 } }),

  mk('psl-p4-di-table-read-03', 'psl-p4-di-table-read', 'P4',
    'A table shows CCA attendance this week: Art Club {valA}, Robotics {valB}, Basketball {valC}, Choir {valD}. How many more students attended Robotics than Art Club?',
    { _generic: { valA: {min:8,max:25}, valB: {min:26,max:50}, valC: {min:10,max:40}, valD: {min:10,max:40} },
      _computeStr: { answer: 'valB - valA' }, answer: { min: 1 } }),

  // ── P4: psl-p4-di-bar-chart (3) ──
  mk('psl-p4-di-bar-chart-01', 'psl-p4-di-bar-chart', 'P4',
    'A bar chart shows Sports Day results. Red House scored {valA} points, Blue House {valB}, Green House {valC}, Yellow House {valD}. Which house scored the most and how many points?',
    { _generic: { valA: {min:50,max:120}, valB: {min:50,max:120}, valC: {min:50,max:120}, valD: {min:50,max:120} },
      _computeStr: { answer: 'Math.max(valA, valB, valC, valD)' }, answer: { min: 50 } }),

  mk('psl-p4-di-bar-chart-02', 'psl-p4-di-bar-chart', 'P4',
    'The bar chart shows library books borrowed: Jan {valA}, Feb {valB}, Mar {valC}, Apr {valD}. What is the total number of books borrowed?',
    { _generic: { valA: {min:20,max:80}, valB: {min:20,max:80}, valC: {min:20,max:80}, valD: {min:20,max:80} },
      _computeStr: { answer: 'valA + valB + valC + valD' }, answer: { min: 80 } }),

  mk('psl-p4-di-bar-chart-03', 'psl-p4-di-bar-chart', 'P4',
    'A bar chart shows hawker stall sales on Saturday: Stall A sold {valA} plates, Stall B {valB}, Stall C {valC}, Stall D {valD}. How many fewer plates did Stall C sell than Stall B?',
    { _generic: { valA: {min:30,max:80}, valB: {min:50,max:100}, valC: {min:10,max:49}, valD: {min:30,max:80} },
      _computeStr: { answer: 'valB - valC' }, answer: { min: 1 } }),

  // ── P4: psl-p4-di-line-graph (2) ──
  mk('psl-p4-di-line-graph-01', 'psl-p4-di-line-graph', 'P4',
    'A line graph shows the temperature in Singapore over 4 days: Mon {valA}°C, Tue {valB}°C, Wed {valC}°C, Thu {valD}°C. What is the difference between the highest and lowest temperature?',
    { _generic: { valA: {min:27,max:35}, valB: {min:27,max:35}, valC: {min:27,max:35}, valD: {min:27,max:35} },
      _computeStr: { answer: 'Math.max(valA, valB, valC, valD) - Math.min(valA, valB, valC, valD)' }, answer: { min: 0 } }),

  mk('psl-p4-di-line-graph-02', 'psl-p4-di-line-graph', 'P4',
    'A line graph tracks MRT ridership (in thousands): Week 1 {valA}, Week 2 {valB}, Week 3 {valC}, Week 4 {valD}. By how many thousand did ridership increase from Week 1 to Week 4?',
    { _generic: { valA: {min:50,max:80}, valB: {min:60,max:90}, valC: {min:70,max:100}, valD: {min:80,max:120} },
      _computeStr: { answer: 'valD - valA' }, answer: { min: 0 } }),

  // ── P5: psl-p5-di-average (3) ──
  mk('psl-p5-di-average-01', 'psl-p5-di-average', 'P5',
    'A table shows test scores for 4 students: {name1} scored {valA}, {name2} scored {valB}, {name3} scored {valC}, {name4} scored {valD}. What is the average score?',
    { _generic: { valA: {min:60,max:100}, valB: {min:60,max:100}, valC: {min:60,max:100}, valD: {min:60,max:100} },
      _computeStr: { total: 'valA + valB + valC + valD', answer: '(valA + valB + valC + valD) / 4' },
      _integerKeys: ['answer'], answer: { min: 60 } }),

  mk('psl-p5-di-average-02', 'psl-p5-di-average', 'P5',
    'The school fundraiser collected donations over 4 weeks: Week 1 ${valA}, Week 2 ${valB}, Week 3 ${valC}, Week 4 ${valD}. What was the average weekly collection?',
    { _generic: { valA: {min:100,max:500}, valB: {min:100,max:500}, valC: {min:100,max:500}, valD: {min:100,max:500} },
      _computeStr: { total: 'valA + valB + valC + valD', answer: '(valA + valB + valC + valD) / 4' },
      _integerKeys: ['answer'], answer: { min: 100 } }),

  mk('psl-p5-di-average-03', 'psl-p5-di-average', 'P5',
    'A table records laps run by 4 pupils during PE: {name1} ran {valA}, {name2} ran {valB}, {name3} ran {valC}, {name4} ran {valD}. What is the average number of laps?',
    { _generic: { valA: {min:4,max:20}, valB: {min:4,max:20}, valC: {min:4,max:20}, valD: {min:4,max:20} },
      _computeStr: { total: 'valA + valB + valC + valD', answer: '(valA + valB + valC + valD) / 4' },
      _integerKeys: ['answer'], answer: { min: 4 } }),

  // ── P5: psl-p5-di-pie-chart (3) ──
  mk('psl-p5-di-pie-chart-01', 'psl-p5-di-pie-chart', 'P5',
    'A pie chart shows how {totalVal} students travel to school: Bus {pctA}%, MRT {pctB}%, Walk {pctC}%, Car {pctD}%. How many students take the bus?',
    { _generic: { totalVal: {min:100,max:400}, pctA: {min:20,max:45}, pctB: {min:15,max:30}, pctC: {min:10,max:25}, pctD: {min:10,max:25} },
      _computeStr: { answer: 'Math.round(totalVal * pctA / 100)' }, answer: { min: 20 } }),

  mk('psl-p5-di-pie-chart-02', 'psl-p5-di-pie-chart', 'P5',
    'A pie chart shows favourite CCAs among {totalVal} students: Basketball {pctA}%, Badminton {pctB}%, Swimming {pctC}%, Track {pctD}%. How many more students prefer Basketball over Swimming?',
    { _generic: { totalVal: {min:100,max:300}, pctA: {min:30,max:45}, pctB: {min:10,max:25}, pctC: {min:10,max:25}, pctD: {min:10,max:20} },
      _computeStr: { answer: 'Math.round(totalVal * (pctA - pctC) / 100)' }, answer: { min: 5 } }),

  mk('psl-p5-di-pie-chart-03', 'psl-p5-di-pie-chart', 'P5',
    'A pie chart shows canteen spending by {totalVal} pupils: Drinks {pctA}%, Rice {pctB}%, Noodles {pctC}%, Snacks {pctD}%. How many pupils spent on Noodles?',
    { _generic: { totalVal: {min:150,max:400}, pctA: {min:15,max:25}, pctB: {min:25,max:35}, pctC: {min:20,max:30}, pctD: {min:10,max:20} },
      _computeStr: { answer: 'Math.round(totalVal * pctC / 100)' }, answer: { min: 30 } }),

  // ── P5: psl-p5-di-two-step (2) ──
  mk('psl-p5-di-two-step-01', 'psl-p5-di-two-step', 'P5',
    'A table shows stickers collected: {name1} {valA}, {name2} {valB}, {name3} {valC}, {name4} {valD}. {name1} gave {giveAway} stickers to {name3}. How many does {name1} have now?',
    { _generic: { valA: {min:30,max:80}, valB: {min:20,max:60}, valC: {min:20,max:60}, valD: {min:20,max:60}, giveAway: {min:5,max:20} },
      _computeStr: { answer: 'valA - giveAway' }, answer: { min: 10 } }),

  mk('psl-p5-di-two-step-02', 'psl-p5-di-two-step', 'P5',
    'A chart shows hawker stall earnings: Mon ${valA}, Tue ${valB}, Wed ${valC}, Thu ${valD}. The owner spent ${expense} on ingredients. What was the profit for the 4 days?',
    { _generic: { valA: {min:80,max:200}, valB: {min:80,max:200}, valC: {min:80,max:200}, valD: {min:80,max:200}, expense: {min:100,max:300} },
      _computeStr: { total: 'valA + valB + valC + valD', answer: 'valA + valB + valC + valD - expense' }, answer: { min: 20 } }),

  // ── P6: psl-p6-di-rate (3) ──
  mk('psl-p6-di-rate-01', 'psl-p6-di-rate', 'P6',
    'A table shows water usage over 4 months: Jan {valA} litres, Feb {valB} litres, Mar {valC} litres, Apr {valD} litres. What is the average monthly rate of water usage?',
    { _generic: { valA: {min:200,max:600}, valB: {min:200,max:600}, valC: {min:200,max:600}, valD: {min:200,max:600} },
      _computeStr: { total: 'valA + valB + valC + valD', answer: '(valA + valB + valC + valD) / 4' },
      _integerKeys: ['answer'], answer: { min: 200 } }),

  mk('psl-p6-di-rate-02', 'psl-p6-di-rate', 'P6',
    'MRT ridership data shows {valA} riders/hr in the morning, {valB} at midday, {valC} in the evening, {valD} at night. What is the total ridership over 4 equal 3-hour blocks?',
    { _generic: { valA: {min:500,max:2000}, valB: {min:300,max:1000}, valC: {min:500,max:2000}, valD: {min:200,max:800} },
      _computeStr: { answer: '(valA + valB + valC + valD) * 3' }, answer: { min: 4500 } }),

  mk('psl-p6-di-rate-03', 'psl-p6-di-rate', 'P6',
    'A graph shows a factory producing {valA} toys/hr for the first {hrsA} hours, then {valB} toys/hr for the next {hrsB} hours. How many toys were produced in total?',
    { _generic: { valA: {min:50,max:150}, valB: {min:30,max:100}, hrsA: {min:2,max:5}, hrsB: {min:2,max:5} },
      _computeStr: { answer: 'valA * hrsA + valB * hrsB' }, answer: { min: 160 } }),

  // ── P6: psl-p6-di-multi-source (3) ──
  mk('psl-p6-di-multi-source-01', 'psl-p6-di-multi-source', 'P6',
    'Table 1 shows School A enrolment: P4 {valA}, P5 {valB}, P6 {valC}. Table 2 shows School B: P4 {valD}, P5 {valE}, P6 {valF}. How many more P5 students does School A have than School B?',
    { _generic: { valA: {min:100,max:200}, valB: {min:120,max:250}, valC: {min:100,max:200}, valD: {min:80,max:180}, valE: {min:80,max:119}, valF: {min:80,max:180} },
      _computeStr: { answer: 'valB - valE' }, answer: { min: 1 } }),

  mk('psl-p6-di-multi-source-02', 'psl-p6-di-multi-source', 'P6',
    'Chart A shows donations from parents: ${valA}. Chart B shows donations from alumni: ${valB}. The school fundraiser target is ${target}. How much more is needed to reach the target?',
    { _generic: { valA: {min:500,max:2000}, valB: {min:500,max:2000}, target: {min:3000,max:6000} },
      _computeStr: { collected: 'valA + valB', answer: 'target - (valA + valB)' }, answer: { min: 100 } }),

  mk('psl-p6-di-multi-source-03', 'psl-p6-di-multi-source', 'P6',
    'Table 1 shows Mon-Wed canteen sales: Mon ${valA}, Tue ${valB}, Wed ${valC}. Table 2 shows Thu-Fri: Thu ${valD}, Fri ${valE}. What was the average daily sales for the whole week?',
    { _generic: { valA: {min:200,max:600}, valB: {min:200,max:600}, valC: {min:200,max:600}, valD: {min:200,max:600}, valE: {min:200,max:600} },
      _computeStr: { total: 'valA + valB + valC + valD + valE', answer: '(valA + valB + valC + valD + valE) / 5' },
      _integerKeys: ['answer'], answer: { min: 200 } }),
];

// Upsert seed
async function seed() {
  await connectDB();
  console.log(`Seeding ${templates.length} data-interpretation templates...`);
  for (const tpl of templates) {
    await PSLProblemTemplate.findOneAndUpdate(
      { templateId: tpl.templateId },
      tpl,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`  ✓ ${tpl.templateId}`);
  }
  console.log(`Done – ${templates.length} templates upserted.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
