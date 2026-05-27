// Phase 6 spelling seed: shared library word lists (isShared) for Spelling
// Practice. Reuses the existing SpellingList model. Run after seed:foundation.
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
  { title: 'Primary 3 common words', level: 'P3', description: 'Everyday words for Primary 3.', words: [
    w('because', 'I stayed home because it rained.'), w('friend', 'My friend sits beside me.'),
    w('school', 'We walk to school together.'), w('water', 'Please drink some water.'),
    w('people', 'Many people came to the fair.'), w('little', 'A little bird sang.'),
    w('animal', 'A dog is a friendly animal.'), w('family', 'My family eats dinner together.'),
    w('garden', 'Flowers grow in the garden.'), w('morning', 'We exercise in the morning.'),
  ] },
  { title: 'Primary 4 common words', level: 'P4', description: 'Common Primary 4 vocabulary.', words: [
    w('different', 'The twins like different food.'), w('important', 'Sleep is important.'),
    w('beautiful', 'The sunset was beautiful.'), w('favourite', 'Blue is my favourite colour.'),
    w('library', 'We borrowed books from the library.'), w('weather', 'The weather is sunny today.'),
    w('breakfast', 'I had eggs for breakfast.'), w('special', 'Today is a special day.'),
    w('decided', 'She decided to help.'), w('suddenly', 'Suddenly, the lights went out.'),
  ] },
  { title: 'Primary 5 commonly misspelled', level: 'P5', description: 'Tricky words students often get wrong.', words: [
    w('necessary', 'It is necessary to revise.'), w('separate', 'Keep the colours separate.'),
    w('definitely', 'I will definitely come.'), w('embarrass', "Don't embarrass yourself."),
    w('rhythm', 'The drum kept a steady rhythm.'), w('occasion', 'A birthday is a happy occasion.'),
    w('privilege', 'It is a privilege to lead.'), w('recommend', 'I recommend this book.'),
    w('government', 'The government built a park.'), w('environment', 'We protect the environment.'),
  ] },
  { title: 'Science vocabulary', level: 'P5', description: 'Spelling for science terms.', words: [
    w('evaporation', 'Heat causes evaporation.'), w('condensation', 'Condensation forms on cold glass.'),
    w('photosynthesis', 'Plants make food by photosynthesis.'), w('temperature', 'We measured the temperature.'),
    w('experiment', 'We did a science experiment.'), w('magnet', 'A magnet attracts iron.'),
    w('skeleton', 'Bones make up the skeleton.'), w('digestion', 'Digestion breaks down food.'),
    w('oxygen', 'We breathe in oxygen.'), w('habitat', 'A pond is a habitat.'),
  ] },
  { title: 'Math vocabulary', level: 'P5', description: 'Spelling for maths terms.', words: [
    w('fraction', 'One half is a fraction.'), w('numerator', 'The numerator is on top.'),
    w('denominator', 'The denominator is below.'), w('multiply', 'Multiply 3 by 4.'),
    w('division', 'Division shares equally.'), w('remainder', 'Seven divided by two has a remainder.'),
    w('perimeter', 'The perimeter is the distance around.'), w('triangle', 'A triangle has three sides.'),
    w('estimate', 'Estimate the total.'), w('equivalent', 'These fractions are equivalent.'),
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
