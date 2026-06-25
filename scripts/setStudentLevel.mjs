// One-off: set a student's level (e.g. so a kindergarten demo account resolves to
// the K2 home). Updates BOTH sources resolveStudentLevel() reads — the denormalised
// User.studentLevel and every linked Student.level — so they don't drift.
//
// Usage (run from the repo root with the target DB's URI):
//   MONGODB_URI="<prod uri>" node scripts/setStudentLevel.mjs "Kyle" "K2"
//   MONGODB_URI="<prod uri>" node scripts/setStudentLevel.mjs "kyle@example.com" "K2"
//
// The first arg matches by email if it contains "@", otherwise by exact name
// (case-insensitive). The second arg is the level string (default "K2").
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';

dotenv.config({ quiet: true });

const [, , who = 'Kyle', level = 'K2'] = process.argv;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set.');
  await mongoose.connect(uri);

  const query = who.includes('@')
    ? { role: 'student', email: who.trim().toLowerCase() }
    : { role: 'student', name: new RegExp(`^${who.trim()}$`, 'i') };

  const users = await User.find(query);
  if (!users.length) throw new Error(`No student account matched "${who}".`);
  if (users.length > 1) {
    console.warn(`⚠️  ${users.length} student accounts matched "${who}" — updating all of them.`);
  }

  for (const u of users) {
    await User.updateOne({ _id: u._id }, { $set: { studentLevel: level } });
    const res = await Student.updateMany({ userId: u._id }, { $set: { level } });
    console.log(`✓ ${u.name} <${u.email}> (${u._id}): User.studentLevel="${level}", Student records updated=${res.modifiedCount}`);
  }

  await mongoose.disconnect();
  console.log(`Done. Have the student log out and back in to pick up the new level.`);
}

main().catch((err) => { console.error('Failed:', err.message); process.exit(1); });
