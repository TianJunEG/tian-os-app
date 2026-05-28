// Delete MasteryRecord rows whose skillId no longer exists in the Skill
// collection. These are created when a seed script replaces a subject's
// skill catalog (e.g. seedScience.js swapping the 5-topic placeholder for
// the legacy bank in PR #31): the new Skills get fresh ObjectIds, the old
// MasteryRecords keep pointing at the deleted ones. The orphans inflate
// the per-subject totals in routes/family.js's `masterySummary` while
// being invisible to routes/skills.js (which joins through Skill).
//
//   node scripts/cleanupOrphanMastery.js               (dry run — default)
//   node scripts/cleanupOrphanMastery.js --execute     (actually deletes)
//   node scripts/cleanupOrphanMastery.js --execute --subject=Science
//
// Also exported as cleanupOrphanMastery() so seedScience.js can run a
// scoped cleanup at the end of its import.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import MasteryRecord from '../models/MasteryRecord.js';
import Skill from '../models/Skill.js';

dotenv.config();

export async function cleanupOrphanMastery({ deleteOrphans = false, subject = null } = {}) {
  const skillIds = new Set((await Skill.find({}).select('_id').lean()).map((s) => String(s._id)));
  const filter = subject ? { subject } : {};
  const records = await MasteryRecord.find(filter).select('_id skillId studentId subject score status').lean();
  const orphans = records.filter((r) => !skillIds.has(String(r.skillId)));
  if (deleteOrphans && orphans.length) {
    await MasteryRecord.deleteMany({ _id: { $in: orphans.map((o) => o._id) } });
  }
  return { totalChecked: records.length, orphans };
}

// CLI runner — only fires when invoked directly, not when imported. Realpath
// both sides so macOS's /tmp → /private/tmp symlink doesn't fool the check.
const here = fileURLToPath(import.meta.url);
const invoked = process.argv[1] ? fs.realpathSync(process.argv[1]) : '';
if (here === invoked) {
  const args = new Set(process.argv.slice(2));
  const execute = args.has('--execute');
  const subjArg = [...args].find((a) => a.startsWith('--subject='));
  const subject = subjArg ? subjArg.slice('--subject='.length) : null;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
  await mongoose.connect(uri);
  const { totalChecked, orphans } = await cleanupOrphanMastery({ deleteOrphans: execute, subject });
  console.log(`Checked ${totalChecked} MasteryRecords${subject ? ` (subject=${subject})` : ''}`);
  console.log(`Orphans found: ${orphans.length}`);
  for (const o of orphans.slice(0, 10)) {
    console.log(`  studentId=${o.studentId} skillId=${o.skillId} subject=${o.subject} score=${o.score} status=${o.status}`);
  }
  if (orphans.length > 10) console.log(`  …and ${orphans.length - 10} more`);
  console.log(execute ? '✅ Deleted.' : '(dry run — pass --execute to delete)');
  await mongoose.disconnect();
}
