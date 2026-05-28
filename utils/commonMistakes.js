// Cross-student "common mistakes" view: aggregate the per-student
// DiagnosedMisconception rows into the misconceptions that recur most across a
// parent/tutor/teacher's students. Computed on demand from the rows we already
// store (grouped by normalizedKey) — no separate materialised collection, which
// keeps it always-fresh and avoids premature counters at MVP scale.
import mongoose from 'mongoose';
import DiagnosedMisconception from '../models/DiagnosedMisconception.js';

const toId = (v) => (v instanceof mongoose.Types.ObjectId ? v : new mongoose.Types.ObjectId(String(v)));

// Returns [{ key, topic, title, description, exampleEvidence, skills, count,
// studentCount, lastSeen }] sorted by frequency. `count` is total occurrences;
// `studentCount` is how many distinct students showed it.
export async function commonMistakes({ ownerUserId, studentUserId = null, topic = null, limit = 50 } = {}) {
  if (!ownerUserId) return [];
  const match = { ownerUserId: toId(ownerUserId) };
  if (studentUserId) match.studentUserId = toId(studentUserId);
  if (topic) match.topic = topic;

  return DiagnosedMisconception.aggregate([
    { $match: match },
    { $group: {
        _id: '$normalizedKey',
        count: { $sum: 1 },
        students: { $addToSet: '$studentUserId' },
        topic: { $first: '$topic' },
        title: { $first: '$title' },
        description: { $first: '$description' },
        exampleEvidence: { $first: '$evidence' },
        skills: { $first: '$skills' },
        lastSeen: { $max: '$createdAt' },
    } },
    { $project: {
        _id: 0,
        key: '$_id',
        topic: 1, title: 1, description: 1, exampleEvidence: 1, skills: 1,
        count: 1, lastSeen: 1,
        // distinct, non-null students who showed this misconception
        studentCount: { $size: { $filter: { input: '$students', cond: { $ne: ['$$this', null] } } } },
    } },
    { $sort: { count: -1, lastSeen: -1 } },
    { $limit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200) },
  ]);
}
