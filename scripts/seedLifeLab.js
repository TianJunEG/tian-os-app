// Seed the LifeLab activity library — real-life Math & Science applied tasks
// (isLibrary: true, no workspace) that teachers can assign to a class and
// students complete with a data + reflection response. Math and Science only
// (MVP). Idempotent: library activities are matched by title and upserted.
//
//   node scripts/seedLifeLab.js     (or: npm run seed:lifelab)
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import LifeLabActivity from '../models/LifeLabActivity.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

const ACTIVITIES = [
  {
    title: 'Kitchen Fractions', subject: 'Math', activityType: 'parent_home', topic: 'Fractions',
    realLifeContext: 'Recipes are written for a set number of servings — cooking for a different number means scaling the amounts up or down.',
    instructions: 'Pick a simple recipe at home. Halve it, then double it, writing each ingredient amount as a fraction of the original.',
    materials: ['A recipe', 'Measuring cups or a kitchen scale', 'Pen and paper'],
    dataRecording: 'For three ingredients, record the original amount, the halved amount, and the doubled amount.',
    reflectionQuestions: [
      'Which ingredient was hardest to halve, and why?',
      'How did you handle an amount that did not divide evenly?',
    ],
  },
  {
    title: 'Supermarket Best Buy', subject: 'Math', activityType: 'home', topic: 'Ratio & rate',
    realLifeContext: 'Shops sell the same product in different pack sizes. The cheapest pack is not always the best value.',
    instructions: 'Find one product sold in two or three different sizes. Work out the price per 100 g (or per item) for each and decide which is the best buy.',
    materials: ['A shop or online store', 'A calculator'],
    dataRecording: 'For each pack: the size, the price, and your calculated unit price (price per 100 g or per item).',
    reflectionQuestions: [
      'Was the largest pack the best value? Explain.',
      'When might you NOT buy the best-value pack in real life?',
    ],
  },
  {
    title: 'Measure Your Room', subject: 'Math', activityType: 'home', topic: 'Area & perimeter',
    realLifeContext: 'Tilers, painters and carpet fitters all need the area of a room before they can quote a price.',
    instructions: 'Measure the length and width of a room in metres. Calculate its perimeter and floor area, then estimate how much it would cost to carpet at $25 per square metre.',
    materials: ['A tape measure or ruler', 'Pen and paper', 'A calculator'],
    dataRecording: 'The room length, width, calculated perimeter, calculated area, and estimated carpet cost.',
    reflectionQuestions: [
      'Why might the real carpet cost be higher than your estimate?',
      'How would the area change if the room were twice as long?',
    ],
  },
  {
    title: 'Shadow Clock', subject: 'Science', activityType: 'home', topic: 'Light & shadows',
    realLifeContext: 'Before clocks, people told the time using the changing position and length of shadows cast by the Sun.',
    instructions: 'Stand a stick upright outdoors. Every hour, mark where its shadow falls and measure the shadow length. Do this across a morning or afternoon.',
    materials: ['A straight stick or pole', 'Chalk or markers', 'A ruler or tape measure'],
    dataRecording: 'A table of time vs. shadow length, with a note on the shadow direction each hour.',
    reflectionQuestions: [
      'When was the shadow longest and when was it shortest? Why?',
      'How does this explain how a sundial works?',
    ],
  },
  {
    title: 'Float or Sink', subject: 'Science', activityType: 'group', topic: 'Materials & density',
    realLifeContext: 'Whether an object floats depends on its density compared with water — the same idea that keeps huge steel ships afloat.',
    instructions: 'Collect five small objects made of different materials. Predict whether each will float or sink, then test each one in a bowl of water.',
    materials: ['A bowl of water', 'Five small objects of different materials', 'A towel'],
    dataRecording: 'For each object: the material, your prediction, and the actual result (float / sink).',
    reflectionQuestions: [
      'Which prediction surprised you, and why?',
      'A steel nail sinks but a steel ship floats — how can that be?',
    ],
  },
  {
    title: 'Plant Growth Diary', subject: 'Science', activityType: 'holiday', topic: 'Life cycles',
    realLifeContext: 'Farmers and gardeners track how fast crops grow to know when to water, feed and harvest them.',
    instructions: 'Plant a fast-growing seed (such as a bean) in a cup of soil near a window. Measure its height every two days for two weeks.',
    materials: ['A bean or other fast seed', 'A cup with soil', 'A ruler', 'Water'],
    dataRecording: 'A table of date vs. height in centimetres, plus a note on each new feature (root, shoot, leaves).',
    reflectionQuestions: [
      'On which days did the plant grow the fastest?',
      'What conditions did your plant need to grow well?',
    ],
  },
];

async function main() {
  await mongoose.connect(URI);
  let created = 0;
  let updated = 0;
  for (const a of ACTIVITIES) {
    const doc = { ...a, isLibrary: true, workspaceId: null, createdByUserId: null };
    const existing = await LifeLabActivity.findOne({ title: a.title, isLibrary: true });
    if (existing) {
      await LifeLabActivity.updateOne({ _id: existing._id }, { $set: doc });
      updated++;
    } else {
      await LifeLabActivity.create(doc);
      created++;
    }
  }
  console.log('✅ LifeLab activity library seeded');
  console.log(`   ${created} created, ${updated} updated · ${ACTIVITIES.length} total (Math + Science)`);
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
