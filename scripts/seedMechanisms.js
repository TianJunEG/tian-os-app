// Seed the Mechanisms Playground (Secondary D&T) into the shared Tian OS core:
// Subject(dt) → Topic(Mechanisms) → 4 Skills (Gears, Levers, Pulleys, Linkages)
// → 12 concept-check MCQs (3 per skill). These mirror the in-app concept checks
// so completing one records practice/mistakes/mastery against the D&T skill via
// the shared engine (module 'Mechanisms Playground', subject 'Design & Technology').
//
//   node scripts/seedMechanisms.js     (or: npm run seed:mechanisms)
//
// Idempotent for source:'seed' D&T questions. Run AFTER seedFoundation.js.
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
const LEVEL = 'Secondary 1';

// mcq(stem, choices, answer, explanation). The order of `qs` per skill is the
// contract with the frontend concept check (it posts answer indices in this order).
const mc = (stem, choices, answer, explanation) => ({ type: 'mcq', stem, choices, answer, explanation, difficulty: 'medium' });

const SKILLS = [
  { name: 'Gears', qs: [
    mc('A driver gear has 10 teeth. The driven gear has 30 teeth. What is the gear ratio?',
      ['1 : 3', '3 : 1', '1 : 30', '10 : 1'], '1 : 3', 'Gear ratio = driven ÷ driver = 30 ÷ 10 = 3, written 1 : 3 (driver : driven turns).'),
    mc('Two gears mesh directly and the driver turns clockwise. The driven gear turns…',
      ['Clockwise', 'Anticlockwise', 'Stays still', 'It depends on size'], 'Anticlockwise', 'Two directly meshed gears always rotate in opposite directions.'),
    mc('A gear ratio of 3 : 1 means the driven gear is…',
      ['Three times faster than the driver', 'Three times slower, with more turning force', 'The same speed as the driver', 'Smaller than the driver'],
      'Three times slower, with more turning force', 'A larger driven gear turns slower but delivers more torque.'),
  ] },
  { name: 'Levers', qs: [
    mc('A wheelbarrow is which class of lever?', ['Class 1', 'Class 2', 'Class 3', 'Not a lever'], 'Class 2', 'The load sits between the fulcrum (wheel) and the effort (handles) — a class 2 lever.'),
    mc('A class 3 lever (like tweezers) gives you…',
      ['A force advantage — lift heavy things easily', 'A speed & distance advantage', 'No advantage at all', 'A change in direction only'],
      'A speed & distance advantage', 'In a class 3 lever the effort exceeds the load, but the load moves further and faster.'),
    mc('The point a lever pivots around is called the…', ['Pivot', 'Fulcrum', 'Effort point', 'Both pivot and fulcrum'], 'Both pivot and fulcrum', 'Fulcrum and pivot are two names for the point a lever turns about.'),
  ] },
  { name: 'Pulleys', qs: [
    mc('What is the mechanical advantage of a single fixed pulley?', ['1', '2', '0', '4'], '1', 'A fixed pulley changes the direction of effort but not its size, so MA = 1.'),
    mc('A single movable pulley gives MA = 2. To lift a load 1 m, how much rope do you pull?', ['0.5 m', '1 m', '2 m', '4 m'], '2 m', 'Energy is conserved: half the effort means twice the distance pulled.'),
    mc('Pulleys are most useful when you need to…',
      ['Increase the speed of a wheel', 'Lift heavy loads with less effort, or change the pulling direction', 'Generate electricity', 'Reduce friction'],
      'Lift heavy loads with less effort, or change the pulling direction', 'Pulleys multiply or redirect effort.'),
  ] },
  { name: 'Linkages', qs: [
    mc('Which linkage converts rotary motion into straight-line back-and-forth motion?',
      ['Reverse motion linkage', 'Parallel motion linkage', 'Crank-slider linkage', 'Bell crank'], 'Crank-slider linkage', 'A crank-slider turns rotation into reciprocating straight-line motion (as in an engine).'),
    mc('A parallel motion linkage is best for…',
      ['Reversing the direction of motion', 'Keeping a platform horizontal while it moves', 'Making something spin', 'Locking a mechanism in place'],
      'Keeping a platform horizontal while it moves', 'Equal-length cranks keep the coupler parallel to the ground.'),
    mc('The points where bars join and rotate freely are called…', ['Sliders', 'Pivots', 'Cranks', 'Levers'], 'Pivots', 'Pivots are the freely-rotating joints between links.'),
  ] },
];

async function main() {
  await mongoose.connect(URI);
  let dt = await Subject.findOne({ key: 'dt' });
  if (!dt) dt = await Subject.create({ key: 'dt', name: 'Design & Technology', order: 3 });

  let topic = await Topic.findOne({ subjectId: dt._id, name: 'Mechanisms' });
  if (!topic) topic = await Topic.create({ subjectId: dt._id, name: 'Mechanisms', moeLevel: LEVEL, order: 0 });

  let skillCount = 0, qCount = 0;
  for (let s = 0; s < SKILLS.length; s++) {
    const def = SKILLS[s];
    let skill = await Skill.findOne({ topicId: topic._id, name: def.name });
    if (!skill) { skill = await Skill.create({ topicId: topic._id, name: def.name, moeLevel: LEVEL, order: s }); skillCount++; }

    // Fresh insert preserves array order via ascending _id (the route sorts by
    // _id to map the frontend's answer indices back to questions).
    await Question.deleteMany({ skillId: skill._id, source: 'seed' });
    await Question.insertMany(def.qs.map((q) => ({
      subjectId: dt._id, topicId: topic._id, skillId: skill._id, moeLevel: LEVEL,
      difficulty: q.difficulty, type: q.type, stem: q.stem, choices: q.choices,
      answer: String(q.answer), explanation: q.explanation, workedSolution: q.explanation,
      source: 'seed',
    })));
    qCount += def.qs.length;
  }

  console.log('✅ Mechanisms Playground (D&T) content seeded');
  console.log(`   Subject: Design & Technology · 1 topic, ${skillCount} new skills, ${qCount} questions`);
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
