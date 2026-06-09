// Retention cron: delete lesson recordings whose 1-month window has elapsed,
// along with their R2 audio object and ink events.
//
//   node scripts/purgeExpiredRecordings.js            (delete expired)
//   node scripts/purgeExpiredRecordings.js --dry-run  (report only)
//
// Intended to run daily (wire to the host scheduler / cron). Idempotent.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import LessonRecording from '../models/LessonRecording.js';
import LessonInkEvent from '../models/LessonInkEvent.js';
import r2 from '../services/storage/r2.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const DRY_RUN = process.argv.includes('--dry-run');

async function run() {
  await mongoose.connect(URI);
  const now = new Date();
  const expired = await LessonRecording.find({ expiresAt: { $ne: null, $lt: now } });
  console.log(`${expired.length} expired recording(s) found.${DRY_RUN ? ' (dry run)' : ''}`);

  let purged = 0;
  for (const rec of expired) {
    console.log(`  ${DRY_RUN ? 'would purge' : 'purging'} ${rec._id} (expired ${rec.expiresAt.toISOString()})`);
    if (DRY_RUN) continue;
    if (rec.audioStorageKey) {
      try { await r2.deleteObject(rec.audioStorageKey); }
      catch (e) { console.warn(`    R2 delete failed for ${rec.audioStorageKey}: ${e.message}`); }
    }
    await LessonInkEvent.deleteMany({ recordingId: rec._id });
    await LessonRecording.deleteOne({ _id: rec._id });
    purged++;
  }

  console.log(DRY_RUN ? 'Dry run complete.' : `Purged ${purged} recording(s).`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
