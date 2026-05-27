// student.js — minimal learner identity for the slice (no real auth yet).

import { collections } from './db.js';

export async function ensureStudent(studentId, displayName) {
  const { students } = await collections();
  const existing = await students.findOne({ _id: studentId });
  if (existing) return existing;
  const doc = {
    _id: studentId,
    tianos_user_id: studentId,
    display_name: displayName || 'Learner',
    level_band: 'P3',
    active_curriculum: 'sg-p3',
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
  };
  await students.insertOne(doc);
  return doc;
}
