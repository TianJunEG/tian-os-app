// Spelling Practice seed: shared library word lists (isShared) for the Tian OS
// Spelling module. Reuses the existing SpellingList model. Run after seed:foundation.
//
//   node scripts/seedSpelling.js     (or: npm run seed:spelling)
//
// Idempotent: clears and re-creates the seeded library lists (by title).
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import SpellingList from '../models/SpellingList.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

const w = (word, sentence = '', definition = '') => ({ word, sentence, definition });

const LISTS = [
  // ═══════════════════════════════════════════════════════════════════
  //  PRIMARY 1 — Foundation words
  // ═══════════════════════════════════════════════════════════════════
  { title: 'Primary 1 sight words', level: 'P1', description: 'High-frequency words every P1 student should recognise and spell.', words: [
    w('the', 'The cat sat on the mat.'),
    w('and', 'I like apples and oranges.'),
    w('said', 'She said hello to me.'),
    w('have', 'I have a new bag.'),
    w('come', 'Come and play with me.'),
    w('some', 'May I have some water?'),
    w('like', 'I like to read books.'),
    w('they', 'They went to the park.'),
    w('what', 'What is your name?'),
    w('were', 'They were happy to see us.'),
    w('when', 'When is your birthday?'),
    w('your', 'Your pencil is on the floor.'),
    w('from', 'I got a letter from my friend.'),
    w('make', 'Let us make a card.'),
    w('very', 'The cake was very good.'),
  ] },
  { title: 'Primary 1 everyday words', level: 'P1', description: 'Common words from daily life for P1 learners.', words: [
    w('house', 'We live in a big house.'),
    w('after', 'We play after school.'),
    w('mother', 'My mother cooks dinner.'),
    w('father', 'My father drives us to school.'),
    w('happy', 'The children were happy.'),
    w('other', 'The other team won.'),
    w('about', 'Tell me about your day.'),
    w('could', 'I could hear the birds.'),
    w('their', 'Their dog is very big.'),
    w('water', 'Please drink some water.'),
    w('called', 'She called her friend.'),
    w('first', 'I was first in line.'),
    w('these', 'These flowers are pretty.'),
    w('would', 'I would like some cake.'),
    w('where', 'Where is the library?'),
  ] },

  // ═══════════════════════════════════════════════════════════════════
  //  PRIMARY 2 — Building vocabulary
  // ═══════════════════════════════════════════════════════════════════
  { title: 'Primary 2 common words', level: 'P2', description: 'Everyday vocabulary for Primary 2 students.', words: [
    w('because', 'I stayed home because it rained.'),
    w('friend', 'My friend sits beside me.'),
    w('school', 'We walk to school together.'),
    w('people', 'Many people came to the fair.'),
    w('little', 'A little bird sang in the tree.'),
    w('animal', 'A dog is a friendly animal.'),
    w('family', 'My family eats dinner together.'),
    w('garden', 'Flowers grow in the garden.'),
    w('morning', 'We exercise in the morning.'),
    w('always', 'She always finishes her homework.'),
    w('brother', 'My brother is older than me.'),
    w('sister', 'My sister likes to draw.'),
    w('caught', 'He caught the ball.'),
    w('enough', 'There is enough food for everyone.'),
    w('thought', 'I thought it was a good idea.'),
  ] },

  // ═══════════════════════════════════════════════════════════════════
  //  PRIMARY 3 — Expanding range
  // ═══════════════════════════════════════════════════════════════════
  { title: 'Primary 3 vocabulary builder', level: 'P3', description: 'Essential words to broaden P3 vocabulary.', words: [
    w('different', 'The twins like different food.'),
    w('important', 'Sleep is important for health.'),
    w('beautiful', 'The sunset was beautiful.'),
    w('favourite', 'Blue is my favourite colour.'),
    w('library', 'We borrowed books from the library.'),
    w('weather', 'The weather is sunny today.'),
    w('breakfast', 'I had eggs for breakfast.'),
    w('special', 'Today is a special day.'),
    w('decided', 'She decided to help her friend.'),
    w('suddenly', 'Suddenly, the lights went out.'),
    w('excited', 'The children were excited about the trip.'),
    w('perhaps', 'Perhaps we can go tomorrow.'),
    w('receive', 'I hope to receive a letter.'),
    w('believe', 'I believe you can do it.'),
    w('through', 'We walked through the park.'),
  ] },
  { title: 'Primary 3 tricky spellings', level: 'P3', description: 'Words P3 students commonly misspell.', words: [
    w('Wednesday', 'We have art on Wednesday.'),
    w('tongue', 'The ice cream melted on his tongue.'),
    w('island', 'Singapore is an island.'),
    w('listen', 'Please listen to the teacher.'),
    w('answer', 'Write your answer clearly.'),
    w('calendar', 'Mark the date on the calendar.'),
    w('scissors', 'Use the scissors to cut the paper.'),
    w('straight', 'Draw a straight line.'),
    w('height', 'We measured the height of the plant.'),
    w('weight', 'The weight of the bag is 3 kg.'),
    w('caught', 'She caught the butterfly gently.'),
    w('brought', 'He brought his lunch to school.'),
    w('surprise', 'We planned a surprise party.'),
    w('minute', 'Wait one more minute.'),
    w('castle', 'We built a sand castle at the beach.'),
  ] },

  // ═══════════════════════════════════════════════════════════════════
  //  PRIMARY 4 — Academic vocabulary
  // ═══════════════════════════════════════════════════════════════════
  { title: 'Primary 4 academic words', level: 'P4', description: 'Vocabulary needed for P4 comprehension and composition.', words: [
    w('ancient', 'The ancient temple was very old.'),
    w('curious', 'The curious cat peeked around the corner.'),
    w('discover', 'Scientists discover new things every day.'),
    w('enormous', 'The elephant was enormous.'),
    w('grateful', 'I am grateful for your help.'),
    w('imagine', 'Can you imagine a world without books?'),
    w('journey', 'The journey took three hours.'),
    w('knowledge', 'Reading builds knowledge.'),
    w('mischief', 'The puppy got into mischief.'),
    w('opposite', 'Hot is the opposite of cold.'),
    w('patient', 'Be patient and wait your turn.'),
    w('quarter', 'A quarter of 100 is 25.'),
    w('refused', 'She refused to give up.'),
    w('sentence', 'Write a complete sentence.'),
    w('unusual', 'We saw an unusual bird at the park.'),
  ] },

  // ═══════════════════════════════════════════════════════════════════
  //  PRIMARY 5 — Commonly misspelled
  // ═══════════════════════════════════════════════════════════════════
  { title: 'Primary 5 commonly misspelled', level: 'P5', description: 'Tricky words P5 students often get wrong.', words: [
    w('necessary', 'It is necessary to revise before exams.'),
    w('separate', 'Keep the colours separate.'),
    w('definitely', 'I will definitely come to your party.'),
    w('embarrass', 'Please do not embarrass me.'),
    w('rhythm', 'The drum kept a steady rhythm.'),
    w('occasion', 'A birthday is a happy occasion.'),
    w('privilege', 'It is a privilege to be chosen.'),
    w('recommend', 'I recommend this book to you.'),
    w('government', 'The government built a new park.'),
    w('environment', 'We must protect the environment.'),
    w('guarantee', 'There is no guarantee of success.'),
    w('immediately', 'Come here immediately.'),
    w('accommodate', 'The hall can accommodate 200 people.'),
    w('conscience', 'His conscience told him to do the right thing.'),
    w('mischievous', 'The mischievous boy hid behind the door.'),
  ] },
  { title: 'Primary 5 composition words', level: 'P5', description: 'Words to enhance P5 narrative and expository writing.', words: [
    w('anxious', 'She felt anxious before the test.'),
    w('cautious', 'Be cautious when crossing the road.'),
    w('exhausted', 'After the race, he was exhausted.'),
    w('hesitate', 'Do not hesitate to ask for help.'),
    w('magnificent', 'The fireworks display was magnificent.'),
    w('opportunity', 'This is a great opportunity to learn.'),
    w('particular', 'She is particular about her food.'),
    w('reluctant', 'He was reluctant to leave.'),
    w('suspicious', 'The guard looked suspicious.'),
    w('tremendous', 'She made tremendous progress.'),
    w('accomplish', 'You can accomplish anything with hard work.'),
    w('consequence', 'Every action has a consequence.'),
    w('exaggerate', 'Do not exaggerate the story.'),
    w('interfere', 'Please do not interfere.'),
    w('persevere', 'You must persevere to succeed.'),
  ] },

  // ═══════════════════════════════════════════════════════════════════
  //  PRIMARY 6 — PSLE-level vocabulary
  // ═══════════════════════════════════════════════════════════════════
  { title: 'Primary 6 PSLE vocabulary', level: 'P6', description: 'Advanced vocabulary for PSLE preparation.', words: [
    w('acknowledge', 'She acknowledged the mistake.'),
    w('approximately', 'There are approximately 30 students.'),
    w('beneficial', 'Exercise is beneficial to health.'),
    w('circumstances', 'Under normal circumstances, we walk.'),
    w('determination', 'His determination helped him succeed.'),
    w('exhilarating', 'The roller coaster ride was exhilarating.'),
    w('independence', 'Singapore gained independence in 1965.'),
    w('miscellaneous', 'The box contained miscellaneous items.'),
    w('nevertheless', 'It rained. Nevertheless, they went out.'),
    w('professional', 'She is a professional dancer.'),
    w('significance', 'The discovery was of great significance.'),
    w('temperature', 'The temperature dropped at night.'),
    w('thoroughly', 'She cleaned the room thoroughly.'),
    w('unbelievable', 'The magician performed unbelievable tricks.'),
    w('vulnerable', 'Young birds are vulnerable to predators.'),
  ] },
  { title: 'Primary 6 commonly confused', level: 'P6', description: 'Words P6 students mix up in meaning or spelling.', words: [
    w('affect', 'The weather will affect our plans.'),
    w('effect', 'The medicine had a good effect.'),
    w('principal', 'The school principal gave a speech.'),
    w('principle', 'Honesty is an important principle.'),
    w('stationery', 'I bought new stationery for school.'),
    w('stationary', 'The bus was stationary at the stop.'),
    w('whether', 'I wonder whether it will rain.'),
    w('desert', 'The Sahara is a vast desert.'),
    w('dessert', 'We had ice cream for dessert.'),
    w('proceed', 'You may proceed to the hall.'),
    w('precede', 'Thunder does not precede lightning.'),
    w('complement', 'The colours complement each other.'),
    w('compliment', 'She received a nice compliment.'),
    w('conscience', 'Let your conscience guide you.'),
    w('conscious', 'He was conscious of his mistake.'),
  ] },

  // ═══════════════════════════════════════════════════════════════════
  //  CROSS-SUBJECT VOCABULARY
  // ═══════════════════════════════════════════════════════════════════
  { title: 'Science vocabulary (P3-P4)', level: 'P4', description: 'Science terms for lower primary students.', words: [
    w('magnet', 'A magnet attracts iron.'),
    w('shadow', 'My shadow is long in the evening.'),
    w('material', 'Wood is a natural material.'),
    w('energy', 'The Sun gives us light and energy.'),
    w('living', 'A plant is a living thing.'),
    w('observe', 'We observe the seed every day.'),
    w('measure', 'We measure the temperature with a thermometer.'),
    w('predict', 'Can you predict what will happen?'),
    w('skeleton', 'Bones make up the skeleton.'),
    w('dissolve', 'Sugar will dissolve in water.'),
    w('breathe', 'We breathe in oxygen.'),
    w('muscle', 'Your heart is a muscle.'),
    w('liquid', 'Water is a liquid.'),
    w('solid', 'Ice is a solid.'),
    w('insect', 'A butterfly is an insect.'),
  ] },
  { title: 'Science vocabulary (P5-P6)', level: 'P5', description: 'Science terms for upper primary students.', words: [
    w('evaporation', 'Heat causes evaporation of water.'),
    w('condensation', 'Condensation forms on cold glass.'),
    w('photosynthesis', 'Plants make food by photosynthesis.'),
    w('experiment', 'We did a science experiment.'),
    w('habitat', 'A pond is a habitat for frogs.'),
    w('digestion', 'Digestion breaks down food.'),
    w('oxygen', 'We breathe in oxygen.'),
    w('reproduce', 'Plants reproduce using seeds.'),
    w('electricity', 'We use electricity to power lights.'),
    w('adaptation', 'A thick fur coat is an adaptation to cold.'),
    w('pollination', 'Bees help with pollination.'),
    w('classification', 'We use classification to group animals.'),
    w('germination', 'Germination is when a seed starts to grow.'),
    w('respiration', 'Respiration releases energy from food.'),
    w('microscope', 'We used a microscope to see the cells.'),
  ] },
  { title: 'Math vocabulary', level: 'P5', description: 'Maths terms students need to spell correctly.', words: [
    w('fraction', 'One half is a fraction.'),
    w('numerator', 'The numerator is the top number.'),
    w('denominator', 'The denominator is the bottom number.'),
    w('multiply', 'Multiply 3 by 4 to get 12.'),
    w('division', 'Division means sharing equally.'),
    w('remainder', 'Seven divided by two leaves a remainder of one.'),
    w('perimeter', 'The perimeter is the distance around a shape.'),
    w('triangle', 'A triangle has three sides.'),
    w('estimate', 'Estimate the total before you calculate.'),
    w('equivalent', 'These two fractions are equivalent.'),
    w('decimal', 'Write your answer as a decimal.'),
    w('percentage', 'The percentage of boys is 60%.'),
    w('symmetry', 'A square has four lines of symmetry.'),
    w('diameter', 'The diameter passes through the centre.'),
    w('parallel', 'Parallel lines never meet.'),
  ] },
];

async function main() {
  await mongoose.connect(URI);
  const owner = await User.findOne({ email: 'demo.teacher@tianos.test' }) || await User.findOne();
  if (!owner) { console.error('No user found — run `npm run seed:foundation` first.'); process.exit(1); }

  const titles = LISTS.map((l) => l.title);
  await SpellingList.deleteMany({ title: { $in: titles }, isShared: true });

  let total = 0;
  for (const l of LISTS) {
    await SpellingList.create({ owner: owner._id, title: l.title, description: l.description, level: l.level, language: 'en', isShared: true, words: l.words });
    total += l.words.length;
  }
  console.log('✅ Spelling library seeded');
  console.log(`   ${LISTS.length} shared lists, ${total} words (owner: ${owner.email})`);
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
