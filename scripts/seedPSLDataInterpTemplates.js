import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import PSLProblemTemplate from '../models/psl/PSLProblemTemplate.js';
import { makeTemplate } from './pslTemplateFactory.js';

// Data-Interpretation heuristic – 22 templates across 8 skills (P4–P6)
// _compute uses string expressions (survives MongoDB serialization)
// _chart embeds chart type + labels for visual rendering

function diScaffold(understandChoices, questionChoices, solveSpec) {
  return {
    understand: { type: 'mc', prompt: 'What is this data about?', correctIndex: 0, choices: understandChoices },
    identify_info: { type: 'highlight', expected: [] },
    identify_question: { type: 'mc', prompt: 'What do we need to find?', correctIndex: 0, choices: questionChoices },
    plan: { type: 'strategySelect', prompt: 'How should we use the data?', correctIndex: 0,
      choices: ['Read the data and calculate', 'Guess the answer', 'Draw a picture', 'Ask a friend'] },
    solve: { type: 'expression', operation: solveSpec.operation || 'addition',
      expression: solveSpec.expression || '{answer}', answer: solveSpec.answer || '{answer}' },
    check: { type: 'reasonableness', prompt: 'Does the answer make sense with the data?' },
  };
}

const mk = (id, skill, level, diff, story, constraints, scaffold, solTpl) =>
  makeTemplate(id, skill, 'dataInterpretation', {
    heuristic: 'data-interpretation', level, difficulty: diff,
    storyTemplate: story, constraints, scaffold,
    solutionTemplate: solTpl || '',
  });

const templates = [
  // ── P4: psl-p4-di-table-read (3) ──────────────────────────────
  mk('psl-p4-di-table-read-01', 'psl-p4-di-table-read', 'P4', 1,
    'The table shows books read by 4 students last month: {name1} read {valA}, {name2} read {valB}, {name3} read {valC}, {name4} read {valD}. How many books were read in total?',
    { _generic: { valA: {min:10,max:50}, valB: {min:10,max:50}, valC: {min:10,max:50}, valD: {min:10,max:50} },
      _compute: { total: 'valA+valB+valC+valD', answer: 'valA+valB+valC+valD' },
      _chart: { type: 'dataTable', title: 'Books Read Last Month', labels: ['{name1}','{name2}','{name3}','{name4}'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 40 } },
    diScaffold(
      ['Books read by students', 'Favourite subjects', 'Library hours', 'Homework marks'],
      ['Total books read', 'Who read the most', 'Average books', 'Difference between two'],
      { operation: 'addition', expression: '{valA} + {valB} + {valC} + {valD}', answer: '{answer}' }),
    'Step 1: Read the values: {valA}, {valB}, {valC}, {valD}.\nStep 2: Add them: {valA} + {valB} + {valC} + {valD} = {answer}.\nAnswer: {answer}.'),

  mk('psl-p4-di-table-read-02', 'psl-p4-di-table-read', 'P4', 1,
    'The canteen recorded food orders for Monday: chicken rice {valA}, nasi lemak {valB}, fishball noodles {valC}, mee rebus {valD}. How many orders were there altogether?',
    { _generic: { valA: {min:15,max:60}, valB: {min:15,max:60}, valC: {min:15,max:60}, valD: {min:15,max:60} },
      _compute: { total: 'valA+valB+valC+valD', answer: 'valA+valB+valC+valD' },
      _chart: { type: 'dataTable', title: 'Monday Canteen Orders', labels: ['Chicken Rice','Nasi Lemak','Fishball Noodles','Mee Rebus'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 60 } },
    diScaffold(
      ['Canteen food orders', 'Recipe ingredients', 'Lunch prices', 'Student attendance'],
      ['Total orders', 'Most popular food', 'Average orders', 'Cheapest food'],
      { operation: 'addition', expression: '{valA} + {valB} + {valC} + {valD}', answer: '{answer}' }),
    'Step 1: Read the values: {valA}, {valB}, {valC}, {valD}.\nStep 2: Add them: {valA} + {valB} + {valC} + {valD} = {answer}.\nAnswer: {answer}.'),

  mk('psl-p4-di-table-read-03', 'psl-p4-di-table-read', 'P4', 1,
    'A table shows CCA attendance this week: Art Club {valA}, Robotics {valB}, Basketball {valC}, Choir {valD}. How many more students attended Robotics than Art Club?',
    { _generic: { valA: {min:8,max:25}, valB: {min:26,max:50}, valC: {min:10,max:40}, valD: {min:10,max:40} },
      _compute: { answer: 'valB-valA' },
      _chart: { type: 'dataTable', title: 'CCA Attendance This Week', labels: ['Art Club','Robotics','Basketball','Choir'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 1 } },
    diScaffold(
      ['CCA attendance numbers', 'CCA schedule', 'Student grades', 'Teacher assignments'],
      ['How many more in Robotics than Art Club', 'Total attendance', 'Average attendance', 'Which CCA is smallest'],
      { operation: 'subtraction', expression: '{valB} − {valA}', answer: '{answer}' }),
    'Step 1: Read Art Club = {valA}, Robotics = {valB}.\nStep 2: Difference = {valB} − {valA} = {answer}.\nAnswer: {answer} more students.'),

  // ── P4: psl-p4-di-bar-chart (3) ──────────────────────────────
  mk('psl-p4-di-bar-chart-01', 'psl-p4-di-bar-chart', 'P4', 1,
    'A bar chart shows Sports Day results. Red House scored {valA} points, Blue House {valB}, Green House {valC}, Yellow House {valD}. Which house scored the most and how many points?',
    { _generic: { valA: {min:50,max:120}, valB: {min:50,max:120}, valC: {min:50,max:120}, valD: {min:50,max:120} },
      _compute: { answer: 'Math.max(valA,valB,valC,valD)' },
      _chart: { type: 'barChart', title: 'Sports Day Points', labels: ['Red','Blue','Green','Yellow'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 50 } },
    diScaffold(
      ['Sports Day house points', 'Relay race times', 'PE test results', 'Swimming records'],
      ['Which house scored the most', 'Total points', 'Average points', 'Lowest score'],
      { operation: 'comparison', expression: 'max({valA}, {valB}, {valC}, {valD})', answer: '{answer}' }),
    'Step 1: Read each bar: {valA}, {valB}, {valC}, {valD}.\nStep 2: Compare to find the largest = {answer}.\nAnswer: {answer} points.'),

  mk('psl-p4-di-bar-chart-02', 'psl-p4-di-bar-chart', 'P4', 1,
    'The bar chart shows library books borrowed: Jan {valA}, Feb {valB}, Mar {valC}, Apr {valD}. What is the total number of books borrowed?',
    { _generic: { valA: {min:20,max:80}, valB: {min:20,max:80}, valC: {min:20,max:80}, valD: {min:20,max:80} },
      _compute: { total: 'valA+valB+valC+valD', answer: 'valA+valB+valC+valD' },
      _chart: { type: 'barChart', title: 'Library Books Borrowed', labels: ['Jan','Feb','Mar','Apr'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 80 } },
    diScaffold(
      ['Monthly library borrowing', 'Book prices', 'Reading scores', 'Library opening hours'],
      ['Total books borrowed', 'Best month', 'Average per month', 'Worst month'],
      { operation: 'addition', expression: '{valA} + {valB} + {valC} + {valD}', answer: '{answer}' }),
    'Step 1: Read the bars: {valA}, {valB}, {valC}, {valD}.\nStep 2: Add them: {valA} + {valB} + {valC} + {valD} = {answer}.\nAnswer: {answer}.'),

  mk('psl-p4-di-bar-chart-03', 'psl-p4-di-bar-chart', 'P4', 1,
    'A bar chart shows hawker stall sales on Saturday: Stall A sold {valA} plates, Stall B {valB}, Stall C {valC}, Stall D {valD}. How many fewer plates did Stall C sell than Stall B?',
    { _generic: { valA: {min:30,max:80}, valB: {min:50,max:100}, valC: {min:10,max:49}, valD: {min:30,max:80} },
      _compute: { answer: 'valB-valC' },
      _chart: { type: 'barChart', title: 'Saturday Hawker Stall Sales', labels: ['Stall A','Stall B','Stall C','Stall D'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 1 } },
    diScaffold(
      ['Hawker stall plate sales', 'Stall rental prices', 'Food ingredients', 'Customer reviews'],
      ['Fewer plates at Stall C than Stall B', 'Total plates sold', 'Average per stall', 'Best stall'],
      { operation: 'subtraction', expression: '{valB} − {valC}', answer: '{answer}' }),
    'Step 1: Stall B = {valB}, Stall C = {valC}.\nStep 2: Difference = {valB} − {valC} = {answer}.\nAnswer: {answer} fewer plates.'),

  // ── P4: psl-p4-di-line-graph (2) ──────────────────────────────
  mk('psl-p4-di-line-graph-01', 'psl-p4-di-line-graph', 'P4', 2,
    'A line graph shows the temperature over 4 days: Mon {valA}°C, Tue {valB}°C, Wed {valC}°C, Thu {valD}°C. What is the difference between the highest and lowest temperature?',
    { _generic: { valA: {min:27,max:35}, valB: {min:27,max:35}, valC: {min:27,max:35}, valD: {min:27,max:35} },
      _compute: { answer: 'Math.max(valA,valB,valC,valD)-Math.min(valA,valB,valC,valD)' },
      _chart: { type: 'lineGraph', title: 'Daily Temperature (°C)', labels: ['Mon','Tue','Wed','Thu'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 0 } },
    diScaffold(
      ['Daily temperature readings', 'Rainfall amounts', 'Wind speed', 'UV index'],
      ['Range of temperatures', 'Average temperature', 'Hottest day', 'Coldest day'],
      { operation: 'subtraction', expression: 'highest − lowest', answer: '{answer}' }),
    'Step 1: Read the values: {valA}°C, {valB}°C, {valC}°C, {valD}°C.\nStep 2: Find highest and lowest.\nStep 3: Difference = highest − lowest = {answer}°C.\nAnswer: {answer}°C.'),

  mk('psl-p4-di-line-graph-02', 'psl-p4-di-line-graph', 'P4', 2,
    'A line graph tracks MRT ridership (in thousands): Week 1 {valA}, Week 2 {valB}, Week 3 {valC}, Week 4 {valD}. By how many thousand did ridership increase from Week 1 to Week 4?',
    { _generic: { valA: {min:50,max:80}, valB: {min:60,max:90}, valC: {min:70,max:100}, valD: {min:80,max:120} },
      _compute: { answer: 'valD-valA' },
      _chart: { type: 'lineGraph', title: 'MRT Ridership (thousands)', labels: ['Wk 1','Wk 2','Wk 3','Wk 4'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 0 } },
    diScaffold(
      ['Weekly MRT ridership data', 'Train schedules', 'Ticket prices', 'Station names'],
      ['Increase from Week 1 to Week 4', 'Total ridership', 'Average ridership', 'Best week'],
      { operation: 'subtraction', expression: '{valD} − {valA}', answer: '{answer}' }),
    'Step 1: Week 1 = {valA}, Week 4 = {valD}.\nStep 2: Increase = {valD} − {valA} = {answer}.\nAnswer: {answer} thousand.'),

  // ── P5: psl-p5-di-average (3) ──────────────────────────────
  mk('psl-p5-di-average-01', 'psl-p5-di-average', 'P5', 2,
    'A table shows test scores for 4 students: {name1} scored {valA}, {name2} scored {valB}, {name3} scored {valC}, {name4} scored {valD}. What is the average score?',
    { _generic: { valA: {min:60,max:100}, valB: {min:60,max:100}, valC: {min:60,max:100}, valD: {min:60,max:100} },
      _compute: { total: 'valA+valB+valC+valD', answer: '(valA+valB+valC+valD)/4' },
      _chart: { type: 'dataTable', title: 'Test Scores', labels: ['{name1}','{name2}','{name3}','{name4}'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 60 } },
    diScaffold(
      ['Student test scores', 'Homework deadlines', 'Class attendance', 'CCA schedule'],
      ['Average score', 'Highest score', 'Total score', 'Score range'],
      { operation: 'division', expression: '({valA} + {valB} + {valC} + {valD}) ÷ 4', answer: '{answer}' }),
    'Step 1: Total = {valA} + {valB} + {valC} + {valD} = {total}.\nStep 2: Average = {total} ÷ 4 = {answer}.\nAnswer: {answer}.'),

  mk('psl-p5-di-average-02', 'psl-p5-di-average', 'P5', 2,
    'The school fundraiser collected donations over 4 weeks: Week 1 ${valA}, Week 2 ${valB}, Week 3 ${valC}, Week 4 ${valD}. What was the average weekly collection?',
    { _generic: { valA: {min:100,max:500}, valB: {min:100,max:500}, valC: {min:100,max:500}, valD: {min:100,max:500} },
      _compute: { total: 'valA+valB+valC+valD', answer: '(valA+valB+valC+valD)/4' },
      _chart: { type: 'barChart', title: 'Weekly Fundraiser Donations ($)', labels: ['Week 1','Week 2','Week 3','Week 4'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 100 } },
    diScaffold(
      ['Fundraiser donations per week', 'Shopping expenses', 'Pocket money', 'Class fund balance'],
      ['Average weekly collection', 'Total donations', 'Best week', 'Worst week'],
      { operation: 'division', expression: '({valA} + {valB} + {valC} + {valD}) ÷ 4', answer: '{answer}' }),
    'Step 1: Total = {valA} + {valB} + {valC} + {valD} = {total}.\nStep 2: Average = {total} ÷ 4 = {answer}.\nAnswer: ${answer}.'),

  mk('psl-p5-di-average-03', 'psl-p5-di-average', 'P5', 2,
    'A table records laps run by 4 pupils during PE: {name1} ran {valA}, {name2} ran {valB}, {name3} ran {valC}, {name4} ran {valD}. What is the average number of laps?',
    { _generic: { valA: {min:4,max:20}, valB: {min:4,max:20}, valC: {min:4,max:20}, valD: {min:4,max:20} },
      _compute: { total: 'valA+valB+valC+valD', answer: '(valA+valB+valC+valD)/4' },
      _chart: { type: 'dataTable', title: 'PE Laps Run', labels: ['{name1}','{name2}','{name3}','{name4}'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 4 } },
    diScaffold(
      ['PE laps data', 'Swimming times', 'NAPFA results', 'Track distances'],
      ['Average laps', 'Total laps', 'Who ran most', 'Laps difference'],
      { operation: 'division', expression: '({valA} + {valB} + {valC} + {valD}) ÷ 4', answer: '{answer}' }),
    'Step 1: Total = {valA} + {valB} + {valC} + {valD} = {total}.\nStep 2: Average = {total} ÷ 4 = {answer}.\nAnswer: {answer} laps.'),

  // ── P5: psl-p5-di-pie-chart (3) ──────────────────────────────
  mk('psl-p5-di-pie-chart-01', 'psl-p5-di-pie-chart', 'P5', 2,
    'A pie chart shows how {totalVal} students travel to school: Bus {pctA}%, MRT {pctB}%, Walk {pctC}%, Car {pctD}%. How many students take the bus?',
    { _generic: { totalVal: {min:100,max:400}, pctA: {min:20,max:45}, pctB: {min:15,max:30}, pctC: {min:10,max:25}, pctD: {min:10,max:25} },
      _compute: { answer: 'Math.round(totalVal*pctA/100)' },
      _chart: { type: 'pieChart', title: 'How Students Travel to School', labels: ['Bus','MRT','Walk','Car'], pctKeys: ['pctA','pctB','pctC','pctD'], totalKey: 'totalVal' },
      answer: { min: 20 } },
    diScaffold(
      ['Transport modes to school', 'Favourite sports', 'Canteen food choices', 'CCA membership'],
      ['Number who take the bus', 'Total students', 'Most popular mode', 'Percentage who walk'],
      { operation: 'multiplication', expression: '{pctA}% × {totalVal}', answer: '{answer}' }),
    'Step 1: Bus = {pctA}%. Total = {totalVal}.\nStep 2: Students taking bus = {pctA}% × {totalVal} = {answer}.\nAnswer: {answer} students.'),

  mk('psl-p5-di-pie-chart-02', 'psl-p5-di-pie-chart', 'P5', 2,
    'A pie chart shows favourite CCAs among {totalVal} students: Basketball {pctA}%, Badminton {pctB}%, Swimming {pctC}%, Track {pctD}%. How many more students prefer Basketball over Swimming?',
    { _generic: { totalVal: {min:100,max:300}, pctA: {min:30,max:45}, pctB: {min:10,max:25}, pctC: {min:10,max:25}, pctD: {min:10,max:20} },
      _compute: { answer: 'Math.round(totalVal*(pctA-pctC)/100)' },
      _chart: { type: 'pieChart', title: 'Favourite CCAs', labels: ['Basketball','Badminton','Swimming','Track'], pctKeys: ['pctA','pctB','pctC','pctD'], totalKey: 'totalVal' },
      answer: { min: 5 } },
    diScaffold(
      ['CCA preferences', 'PE test results', 'Recess activities', 'Sports equipment inventory'],
      ['More students in Basketball than Swimming', 'Total students', 'Most popular CCA', 'Least popular CCA'],
      { operation: 'multiplication', expression: '({pctA} − {pctC})% × {totalVal}', answer: '{answer}' }),
    'Step 1: Basketball = {pctA}%, Swimming = {pctC}%.\nStep 2: Difference = ({pctA} − {pctC})% × {totalVal} = {answer}.\nAnswer: {answer} more students.'),

  mk('psl-p5-di-pie-chart-03', 'psl-p5-di-pie-chart', 'P5', 2,
    'A pie chart shows canteen spending by {totalVal} pupils: Drinks {pctA}%, Rice {pctB}%, Noodles {pctC}%, Snacks {pctD}%. How many pupils spent on Noodles?',
    { _generic: { totalVal: {min:150,max:400}, pctA: {min:15,max:25}, pctB: {min:25,max:35}, pctC: {min:20,max:30}, pctD: {min:10,max:20} },
      _compute: { answer: 'Math.round(totalVal*pctC/100)' },
      _chart: { type: 'pieChart', title: 'Canteen Spending', labels: ['Drinks','Rice','Noodles','Snacks'], pctKeys: ['pctA','pctB','pctC','pctD'], totalKey: 'totalVal' },
      answer: { min: 30 } },
    diScaffold(
      ['Canteen spending habits', 'Food prices', 'Menu items', 'Recess schedule'],
      ['Pupils who spent on Noodles', 'Total pupils', 'Most popular food', 'Least spent'],
      { operation: 'multiplication', expression: '{pctC}% × {totalVal}', answer: '{answer}' }),
    'Step 1: Noodles = {pctC}%. Total = {totalVal}.\nStep 2: Pupils on Noodles = {pctC}% × {totalVal} = {answer}.\nAnswer: {answer} pupils.'),

  // ── P5: psl-p5-di-two-step (2) ──────────────────────────────
  mk('psl-p5-di-two-step-01', 'psl-p5-di-two-step', 'P5', 3,
    'A table shows stickers collected: {name1} {valA}, {name2} {valB}, {name3} {valC}, {name4} {valD}. {name1} gave {giveAway} stickers to {name3}. How many does {name1} have now?',
    { _generic: { valA: {min:30,max:80}, valB: {min:20,max:60}, valC: {min:20,max:60}, valD: {min:20,max:60}, giveAway: {min:5,max:20} },
      _compute: { answer: 'valA-giveAway' },
      _chart: { type: 'dataTable', title: 'Stickers Collected', labels: ['{name1}','{name2}','{name3}','{name4}'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 10 } },
    diScaffold(
      ['Sticker collection data', 'Trading card values', 'Eraser counts', 'Marble totals'],
      ['How many {name1} has after giving away', 'Total stickers', 'Average stickers', 'Who has most'],
      { operation: 'subtraction', expression: '{valA} − {giveAway}', answer: '{answer}' }),
    'Step 1: {name1} starts with {valA} stickers.\nStep 2: After giving away {giveAway}: {valA} − {giveAway} = {answer}.\nAnswer: {answer} stickers.'),

  mk('psl-p5-di-two-step-02', 'psl-p5-di-two-step', 'P5', 3,
    'A chart shows hawker stall earnings: Mon ${valA}, Tue ${valB}, Wed ${valC}, Thu ${valD}. The owner spent ${expense} on ingredients. What was the profit for the 4 days?',
    { _generic: { valA: {min:80,max:200}, valB: {min:80,max:200}, valC: {min:80,max:200}, valD: {min:80,max:200}, expense: {min:100,max:300} },
      _compute: { total: 'valA+valB+valC+valD', answer: 'valA+valB+valC+valD-expense' },
      _chart: { type: 'barChart', title: 'Hawker Stall Earnings ($)', labels: ['Mon','Tue','Wed','Thu'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 20 } },
    diScaffold(
      ['Hawker stall daily earnings', 'Food prices', 'Customer counts', 'Opening hours'],
      ['Profit after expenses', 'Total earnings', 'Best day', 'Average earnings'],
      { operation: 'subtraction', expression: '({valA}+{valB}+{valC}+{valD}) − {expense}', answer: '{answer}' }),
    'Step 1: Total earnings = {valA} + {valB} + {valC} + {valD} = {total}.\nStep 2: Profit = {total} − {expense} = {answer}.\nAnswer: ${answer}.'),

  // ── P6: psl-p6-di-rate (3) ──────────────────────────────
  mk('psl-p6-di-rate-01', 'psl-p6-di-rate', 'P6', 2,
    'A table shows water usage over 4 months: Jan {valA} litres, Feb {valB} litres, Mar {valC} litres, Apr {valD} litres. What is the average monthly usage?',
    { _generic: { valA: {min:200,max:600}, valB: {min:200,max:600}, valC: {min:200,max:600}, valD: {min:200,max:600} },
      _compute: { total: 'valA+valB+valC+valD', answer: '(valA+valB+valC+valD)/4' },
      _chart: { type: 'barChart', title: 'Monthly Water Usage (litres)', labels: ['Jan','Feb','Mar','Apr'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 200 } },
    diScaffold(
      ['Monthly water usage data', 'Water prices', 'Tap locations', 'Pipe sizes'],
      ['Average monthly usage', 'Total usage', 'Highest month', 'Lowest month'],
      { operation: 'division', expression: '({valA}+{valB}+{valC}+{valD}) ÷ 4', answer: '{answer}' }),
    'Step 1: Total = {valA} + {valB} + {valC} + {valD} = {total}.\nStep 2: Average = {total} ÷ 4 = {answer} litres.\nAnswer: {answer} litres.'),

  mk('psl-p6-di-rate-02', 'psl-p6-di-rate', 'P6', 2,
    'MRT ridership data shows {valA} riders/hr in the morning, {valB} at midday, {valC} in the evening, {valD} at night. What is the total ridership over 4 equal 3-hour blocks?',
    { _generic: { valA: {min:500,max:2000}, valB: {min:300,max:1000}, valC: {min:500,max:2000}, valD: {min:200,max:800} },
      _compute: { answer: '(valA+valB+valC+valD)*3' },
      _chart: { type: 'barChart', title: 'MRT Ridership by Time Block', labels: ['Morning','Midday','Evening','Night'], valueKeys: ['valA','valB','valC','valD'] },
      answer: { min: 4500 } },
    diScaffold(
      ['Hourly MRT ridership rates', 'Train schedules', 'Station capacities', 'Ticket prices'],
      ['Total ridership for all blocks', 'Average ridership', 'Busiest time', 'Quietest time'],
      { operation: 'multiplication', expression: '({valA}+{valB}+{valC}+{valD}) × 3', answer: '{answer}' }),
    'Step 1: Total per hour = {valA} + {valB} + {valC} + {valD}.\nStep 2: Each block is 3 hours: ({valA}+{valB}+{valC}+{valD}) × 3 = {answer}.\nAnswer: {answer} riders.'),

  mk('psl-p6-di-rate-03', 'psl-p6-di-rate', 'P6', 3,
    'A graph shows a factory producing {valA} toys/hr for the first {hrsA} hours, then {valB} toys/hr for the next {hrsB} hours. How many toys were produced in total?',
    { _generic: { valA: {min:50,max:150}, valB: {min:30,max:100}, hrsA: {min:2,max:5}, hrsB: {min:2,max:5} },
      _compute: { answer: 'valA*hrsA+valB*hrsB' },
      _chart: { type: 'barChart', title: 'Factory Output (toys/hr)', labels: ['Batch 1','Batch 2'], valueKeys: ['valA','valB'] },
      answer: { min: 160 } },
    diScaffold(
      ['Factory production rate data', 'Machine specifications', 'Worker schedules', 'Quality scores'],
      ['Total toys produced', 'Average rate', 'Batch 1 output', 'Which batch was faster'],
      { operation: 'multiplication', expression: '{valA}×{hrsA} + {valB}×{hrsB}', answer: '{answer}' }),
    'Step 1: Batch 1 = {valA} × {hrsA} toys.\nStep 2: Batch 2 = {valB} × {hrsB} toys.\nStep 3: Total = ({valA}×{hrsA}) + ({valB}×{hrsB}) = {answer}.\nAnswer: {answer} toys.'),

  // ── P6: psl-p6-di-multi-source (3) ──────────────────────────────
  mk('psl-p6-di-multi-source-01', 'psl-p6-di-multi-source', 'P6', 3,
    'Table 1 shows School A enrolment: P4 {valA}, P5 {valB}, P6 {valC}. Table 2 shows School B: P4 {valD}, P5 {valE}, P6 {valF}. How many more P5 students does School A have than School B?',
    { _generic: { valA: {min:100,max:200}, valB: {min:120,max:250}, valC: {min:100,max:200}, valD: {min:80,max:180}, valE: {min:80,max:119}, valF: {min:80,max:180} },
      _compute: { answer: 'valB-valE' },
      _chart: { type: 'multiTable', tables: [
        { title: 'School A Enrolment', labels: ['P4','P5','P6'], valueKeys: ['valA','valB','valC'] },
        { title: 'School B Enrolment', labels: ['P4','P5','P6'], valueKeys: ['valD','valE','valF'] },
      ]},
      answer: { min: 1 } },
    diScaffold(
      ['School enrolment across two schools', 'Class schedules', 'Exam results', 'Teacher allocations'],
      ['P5 difference between School A and B', 'Total enrolment', 'Which school is larger', 'Average per level'],
      { operation: 'subtraction', expression: '{valB} − {valE}', answer: '{answer}' }),
    'Step 1: School A P5 = {valB}, School B P5 = {valE}.\nStep 2: Difference = {valB} − {valE} = {answer}.\nAnswer: {answer} more students.'),

  mk('psl-p6-di-multi-source-02', 'psl-p6-di-multi-source', 'P6', 3,
    'Chart A shows donations from parents: ${valA}. Chart B shows donations from alumni: ${valB}. The school fundraiser target is ${target}. How much more is needed?',
    { _generic: { valA: {min:500,max:2000}, valB: {min:500,max:2000}, target: {min:3000,max:6000} },
      _compute: { collected: 'valA+valB', answer: 'target-(valA+valB)' },
      _chart: { type: 'barChart', title: 'Fundraiser Donations ($)', labels: ['Parents','Alumni'], valueKeys: ['valA','valB'] },
      answer: { min: 100 } },
    diScaffold(
      ['Fundraiser donation data from two sources', 'Shopping receipts', 'Savings account', 'Budget plan'],
      ['How much more is needed', 'Total collected', 'Who donated more', 'Percentage reached'],
      { operation: 'subtraction', expression: '{target} − ({valA}+{valB})', answer: '{answer}' }),
    'Step 1: Total collected = {valA} + {valB} = {collected}.\nStep 2: Shortfall = {target} − {collected} = {answer}.\nAnswer: ${answer}.'),

  mk('psl-p6-di-multi-source-03', 'psl-p6-di-multi-source', 'P6', 3,
    'Table 1 shows Mon–Wed canteen sales: Mon ${valA}, Tue ${valB}, Wed ${valC}. Table 2 shows Thu–Fri: Thu ${valD}, Fri ${valE}. What was the average daily sales for the whole week?',
    { _generic: { valA: {min:200,max:600}, valB: {min:200,max:600}, valC: {min:200,max:600}, valD: {min:200,max:600}, valE: {min:200,max:600} },
      _compute: { total: 'valA+valB+valC+valD+valE', answer: '(valA+valB+valC+valD+valE)/5' },
      _chart: { type: 'multiTable', tables: [
        { title: 'Mon–Wed Sales ($)', labels: ['Mon','Tue','Wed'], valueKeys: ['valA','valB','valC'] },
        { title: 'Thu–Fri Sales ($)', labels: ['Thu','Fri'], valueKeys: ['valD','valE'] },
      ]},
      answer: { min: 200 } },
    diScaffold(
      ['Weekly canteen sales from two reports', 'Menu prices', 'Customer feedback', 'Opening hours'],
      ['Average daily sales for the week', 'Total weekly sales', 'Best day', 'Worst day'],
      { operation: 'division', expression: '({valA}+{valB}+{valC}+{valD}+{valE}) ÷ 5', answer: '{answer}' }),
    'Step 1: Total = {valA}+{valB}+{valC}+{valD}+{valE} = {total}.\nStep 2: Average = {total} ÷ 5 = {answer}.\nAnswer: ${answer}.'),
];

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
