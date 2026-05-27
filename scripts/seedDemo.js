// Demo seed for the launch video. Creates a parent with two children and realistic cross-app
// progress (Spelling + Math + Science) engineered to land in varied readiness bands — so the
// Tian OS dashboards show rich, multi-coloured rings on camera.
//
//   node scripts/seedDemo.js
//   login: demo.parent@tianos.test / Passw0rd!  → film /children
//
// Idempotent: only touches the demo account (re-running resets its data).
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import SpellingAttempt from '../models/SpellingAttempt.js';
import LearningResult from '../models/LearningResult.js';
import { buildSpellingAttempts, buildResults, ETHAN_WORDS, MAYA_WORDS, ETHAN_RESULTS, MAYA_RESULTS } from './seedData.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const EMAIL = 'demo.parent@tianos.test';
const PASSWORD = 'Passw0rd!';

async function main() {
  await mongoose.connect(URI);
  let parent = await User.findOne({ email: EMAIL });
  if (!parent) parent = new User({ name: 'Demo Parent', email: EMAIL, role: 'parent' });
  parent.password = PASSWORD; // pre-save hook hashes it; guarantees the documented login works
  parent.children = [{ name: 'Ethan', level: 'Secondary 1' }, { name: 'Maya', level: 'Primary 4' }];
  await parent.save();
  const [ethan, maya] = parent.children;

  await SpellingAttempt.deleteMany({ user: parent._id });
  await LearningResult.deleteMany({ user: parent._id });

  await SpellingAttempt.insertMany([
    ...buildSpellingAttempts(ETHAN_WORDS, { user: parent._id, child: ethan._id }),
    ...buildSpellingAttempts(MAYA_WORDS, { user: parent._id, child: maya._id }),
  ]);
  await LearningResult.insertMany([
    ...buildResults({ user: parent._id, child: ethan._id }, ETHAN_RESULTS),
    ...buildResults({ user: parent._id, child: maya._id }, MAYA_RESULTS),
  ]);

  console.log(`✅ Seeded ${EMAIL} (password: ${PASSWORD})`);
  console.log(`   Children: Ethan (${ethan._id}), Maya (${maya._id})`);
  console.log('   Log in, open "My Children", and film /children → tap a child.');
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
