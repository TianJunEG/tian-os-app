// Seed the Science Adaptive Revision content into the shared Tian OS core:
// Subject(science) → 5 topics → 15 skills → 30 questions (MCQ / short / open-ended).
// Science is a SECONDARY module; it reuses the same Subject/Topic/Skill/Question
// collections as MathPath (keyed by skillId), so mastery/mistakes/practice all
// flow through the shared engine. Idempotent for source:'seed' science questions.
//
//   node scripts/seedScience.js     (or: npm run seed:science)
//
// Run AFTER seedFoundation.js.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Skill from '../models/Skill.js';
import Question from '../models/Question.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const LEVEL = 'Primary 5';

// topic → skills → questions. Each question: { type, stem, choices?, answer,
// modelAnswer?, keyPoints?, explanation?, difficulty }.
const mc = (stem, choices, answer, explanation, difficulty = 'easy') => ({ type: 'mcq', stem, choices, answer, explanation, difficulty });
const sa = (stem, answer, explanation, difficulty = 'medium') => ({ type: 'short_answer', stem, answer, explanation, difficulty });
const oe = (stem, answer, modelAnswer, keyPoints, difficulty = 'medium') => ({ type: 'open_ended', stem, answer, modelAnswer, keyPoints, difficulty });

const MAP = [
  { topic: 'Cycles', skills: [
    { name: 'Life cycles of plants', qs: [
      mc('Which stage comes first in a plant life cycle?', ['Seed', 'Flower', 'Fruit', 'Adult plant'], 'Seed', 'A plant begins life as a seed, which germinates into a seedling.'),
      oe('Describe the life cycle of a flowering plant.', 'seed → seedling → adult → flower → seed',
        'A seed germinates into a seedling, grows into an adult plant, produces flowers which are pollinated and form seeds, and the cycle repeats.',
        ['seed', 'seedling|germinat', 'flower', 'pollinat|reproduc']),
    ] },
    { name: 'Life cycles of animals', qs: [
      mc('Which animal undergoes complete metamorphosis?', ['Butterfly', 'Chicken', 'Cat', 'Human'], 'Butterfly', 'A butterfly goes egg → larva → pupa → adult, a complete metamorphosis.'),
      sa('How many stages are in the life cycle of a butterfly?', '4', 'Egg, larva (caterpillar), pupa (chrysalis), adult.'),
    ] },
    { name: 'Reproduction in plants', qs: [
      mc('Which part of the flower receives pollen?', ['Stigma', 'Petal', 'Root', 'Leaf'], 'Stigma', 'Pollen lands on the stigma during pollination.'),
      oe('Explain how pollination leads to the formation of seeds.', 'pollen reaches stigma, fertilisation, seeds form',
        'Pollen is transferred to the stigma (pollination); it travels to the ovary and fertilises the ovule; the fertilised ovule develops into a seed.',
        ['pollen', 'stigma', 'fertilis', 'ovule|ovary', 'seed']),
    ] },
  ] },
  { topic: 'Systems', skills: [
    { name: 'Digestive system', qs: [
      mc('Where does most digestion of food get completed?', ['Small intestine', 'Mouth', 'Lungs', 'Heart'], 'Small intestine', 'Most digestion and absorption happens in the small intestine.'),
      oe('Describe what happens to food in the digestive system.', 'broken down, absorbed, waste removed',
        'Food is broken down (mechanically and chemically) into smaller substances, nutrients are absorbed into the blood in the small intestine, and undigested waste is removed.',
        ['broken down|digest', 'absorb', 'nutrient', 'waste']),
    ] },
    { name: 'Respiratory system', qs: [
      mc('Which organ takes in oxygen from the air?', ['Lungs', 'Stomach', 'Kidney', 'Brain'], 'Lungs', 'The lungs exchange oxygen and carbon dioxide with the blood.'),
      sa('Which gas do we breathe out as waste?', 'carbon dioxide', 'We take in oxygen and breathe out carbon dioxide.'),
    ] },
    { name: 'Circulatory system', qs: [
      mc('Which organ pumps blood around the body?', ['Heart', 'Lungs', 'Liver', 'Brain'], 'Heart', 'The heart pumps blood through blood vessels.'),
      oe('Explain the job of the circulatory system.', 'transports oxygen and nutrients, removes waste',
        'The heart pumps blood through vessels to transport oxygen and nutrients to cells and to carry away waste such as carbon dioxide.',
        ['heart|pump', 'blood', 'oxygen|nutrient', 'transport|carry']),
    ] },
  ] },
  { topic: 'Energy', skills: [
    { name: 'Heat and temperature', qs: [
      mc('Heat always flows from...', ['Hotter to cooler', 'Cooler to hotter', 'Light to dark', 'Big to small'], 'Hotter to cooler', 'Heat energy flows from a hotter object to a cooler one.'),
      oe('What happens to a metal spoon placed in a cup of hot water? Explain using heat.', 'spoon gains heat, temperature rises',
        'The spoon gains heat from the hotter water, so heat flows from the water to the spoon and the spoon\'s temperature rises until they are the same.',
        ['heat', 'gain|flow', 'temperature rises|warmer|hotter']),
    ] },
    { name: 'Light and shadows', qs: [
      mc('A shadow forms when light is...', ['Blocked by an object', 'Reflected by a mirror', 'Bent by a lens', 'Absorbed by water'], 'Blocked by an object', 'An opaque object blocks light, forming a shadow.'),
      sa('What kind of material lets no light pass through?', 'opaque', 'Opaque materials block light; transparent materials let light through.'),
    ] },
    { name: 'Forms of energy', qs: [
      mc('A moving car mainly has which form of energy?', ['Kinetic energy', 'Light energy', 'Sound energy', 'Chemical energy'], 'Kinetic energy', 'Kinetic energy is the energy of movement.'),
      sa('Name the form of energy stored in food.', 'chemical', 'Food stores chemical (potential) energy.'),
    ] },
  ] },
  { topic: 'Interactions', skills: [
    { name: 'Magnets', qs: [
      mc('Two north poles brought together will...', ['Repel', 'Attract', 'Stick', 'Melt'], 'Repel', 'Like poles repel; unlike poles attract.'),
      oe('Explain what happens when the south pole of one magnet meets the north pole of another.', 'unlike poles attract',
        'Unlike poles attract, so the south pole and north pole pull towards each other.',
        ['unlike|opposite|different', 'attract']),
    ] },
    { name: 'Food chains', qs: [
      mc('In a food chain, the arrow points...', ['From the eaten to the eater', 'From the eater to the eaten', 'Both ways', 'Downwards'], 'From the eaten to the eater', 'Arrows show the flow of energy to the consumer.'),
      sa('What do we call an animal that eats only plants?', 'herbivore', 'Herbivores eat plants; carnivores eat animals.'),
    ] },
    { name: 'Forces and friction', qs: [
      mc('Friction always acts to...', ['Oppose motion', 'Speed things up', 'Create light', 'Add mass'], 'Oppose motion', 'Friction is a force that opposes movement between surfaces.'),
      sa('A force can be a push or a ___.', 'pull', 'A force is a push or a pull.'),
    ] },
  ] },
  { topic: 'Diversity', skills: [
    { name: 'Classification of living things', qs: [
      mc('Which group do humans belong to?', ['Mammals', 'Birds', 'Fish', 'Insects'], 'Mammals', 'Mammals have hair/fur and feed young with milk.'),
      oe('Give two features used to classify animals into groups.', 'body covering, number of legs, how they reproduce',
        'Animals can be classified by features such as body covering (fur, feathers, scales), number of legs, whether they have a backbone, and how they reproduce.',
        ['body covering|fur|feather|scale|skin', 'legs|backbone|reproduce|lay eggs']),
    ] },
    { name: 'Living and non-living things', qs: [
      mc('Which is a characteristic of all living things?', ['They reproduce', 'They are made of metal', 'They never change', 'They glow'], 'They reproduce', 'Living things grow, reproduce, respond and need food.'),
      sa('Do living things need food to survive? (yes/no)', 'yes', 'All living things need food/energy to survive.'),
    ] },
    { name: 'Plants vs animals', qs: [
      mc('Which can make their own food?', ['Plants', 'Animals', 'Both', 'Neither'], 'Plants', 'Plants make food by photosynthesis; animals cannot.'),
      oe('State one way plants are different from animals.', 'plants make their own food',
        'Plants make their own food through photosynthesis and usually cannot move from place to place, while animals must eat other living things and can move around.',
        ['make.*food|photosynthesis', 'move|cannot move']),
    ] },
  ] },
];

async function main() {
  await mongoose.connect(URI);
  let science = await Subject.findOne({ key: 'science' });
  if (!science) science = await Subject.create({ key: 'science', name: 'Science', order: 1 });

  let topicCount = 0, skillCount = 0, qCount = 0;
  for (let t = 0; t < MAP.length; t++) {
    const def = MAP[t];
    let topic = await Topic.findOne({ subjectId: science._id, name: def.topic });
    if (!topic) topic = await Topic.create({ subjectId: science._id, name: def.topic, moeLevel: LEVEL, order: t });
    topicCount++;

    for (let s = 0; s < def.skills.length; s++) {
      const sk = def.skills[s];
      let skill = await Skill.findOne({ topicId: topic._id, name: sk.name });
      if (!skill) { skill = await Skill.create({ topicId: topic._id, name: sk.name, moeLevel: LEVEL, order: s }); skillCount++; }

      await Question.deleteMany({ skillId: skill._id, source: 'seed' });
      await Question.insertMany(sk.qs.map((q) => ({
        subjectId: science._id, topicId: topic._id, skillId: skill._id, moeLevel: LEVEL,
        difficulty: q.difficulty, type: q.type, stem: q.stem, choices: q.choices || [],
        answer: String(q.answer), modelAnswer: q.modelAnswer || '', keyPoints: q.keyPoints || [],
        explanation: q.explanation || '', workedSolution: q.explanation || '', source: 'seed',
      })));
      qCount += sk.qs.length;
    }
  }

  console.log('✅ Science Adaptive Revision content seeded');
  console.log(`   Subject: Science · ${topicCount} topics, ${skillCount} new skills, ${qCount} questions`);
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
