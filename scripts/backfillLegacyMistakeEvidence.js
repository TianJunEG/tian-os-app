import dotenv from 'dotenv';
import fs from 'node:fs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import Mistake from '../models/Mistake.js';
import { applyLegacyMistakeEvidenceBackfill } from '../services/mathpath/legacyMistakeEvidenceAuditService.js';

dotenv.config();

async function executeQuery(query, { limit = 0 } = {}) {
  let cursor = query.sort({ occurredAt: -1, createdAt: -1 });
  if (limit) cursor = cursor.limit(limit);
  return cursor.exec();
}

export async function runBackfillLegacyMistakeEvidence({
  MistakeModel = Mistake,
  apply = false,
  module = 'MathPath',
  studentId = '',
  limit = 0,
} = {}) {
  const filter = {};
  if (module) filter.module = module;
  if (studentId) filter.studentId = studentId;
  const mistakes = await executeQuery(MistakeModel.find(filter), { limit: Number(limit || 0) });
  return applyLegacyMistakeEvidenceBackfill({ mistakes, apply });
}

function parseArgs(args = []) {
  const set = new Set(args);
  const valueArg = (prefix, fallback = '') => {
    const found = args.find((arg) => arg.startsWith(`${prefix}=`));
    return found ? found.slice(prefix.length + 1) : fallback;
  };
  return {
    apply: set.has('--apply'),
    module: valueArg('--module', 'MathPath'),
    studentId: valueArg('--studentId', ''),
    limit: Number(valueArg('--limit', '0')) || 0,
  };
}

const here = fileURLToPath(import.meta.url);
const invoked = process.argv[1] ? fs.realpathSync(process.argv[1]) : '';

if (here === invoked) {
  const options = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/tutor-match';
  await mongoose.connect(uri);
  try {
    const report = await runBackfillLegacyMistakeEvidence(options);
    console.log(JSON.stringify({
      mode: options.apply ? 'apply' : 'dry-run',
      module: options.module,
      studentId: options.studentId || null,
      limit: options.limit || null,
      scanned: report.scanned,
      wouldUpdate: report.wouldUpdate,
      updated: report.updated,
      reviewedWithoutEvidence: report.reviewedWithoutEvidence,
      masteredWithoutEvidence: report.masteredWithoutEvidence,
      progressRiskRecords: report.progressRiskRecords,
      affectedStudents: report.affectedStudents,
      affectedSkills: report.affectedSkills,
      rows: report.rows.filter((row) => row.progressRisk).slice(0, 50),
    }, null, 2));
    if (!options.apply) console.log('Dry run only. Pass --apply to update legacy mistake states.');
  } finally {
    await mongoose.disconnect();
  }
}
