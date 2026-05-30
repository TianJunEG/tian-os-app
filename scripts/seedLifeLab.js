// Seed the LifeLab activity library — real-life Math & Science applied tasks
// (isLibrary: true, no workspace) that teachers can assign to a class and
// students complete with a data + reflection response. Math and Science only
// (MVP). Idempotent: library activities are matched by title and upserted.
//
//   node scripts/seedLifeLab.js     (or: npm run seed:lifelab)
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import LifeLabActivity from '../models/LifeLabActivity.js';
import { LIFE_LAB_SAMPLE_ACTIVITIES } from '../data/lifelabSampleActivities.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

const ACTIVITIES = LIFE_LAB_SAMPLE_ACTIVITIES;

async function main() {
  await mongoose.connect(URI);
  let created = 0;
  let updated = 0;
  for (const a of ACTIVITIES) {
    const doc = { ...a, isLibrary: true, workspaceId: null, createdByUserId: null };
    const existing = await LifeLabActivity.findOne({ libraryKey: a.libraryKey, isLibrary: true });
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
