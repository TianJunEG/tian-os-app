import dotenv from 'dotenv';
import fs from 'node:fs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import GeneratedQuestion from '../models/mathpath/GeneratedQuestion.js';
import MathPathAssignment from '../models/mathpath/MathPathAssignment.js';
import MathPathDiagnosticSession from '../models/mathpath/MathPathDiagnosticSession.js';
import Worksheet from '../models/Worksheet.js';
import {
  FRACTION_CANONICAL_SKILL_ROWS,
  getCanonicalFractionSkill,
  getCanonicalFractionSkillBySlug,
} from '../frontend/src/mathpath/curriculum/fractionCanonicalSkillMap.js';

dotenv.config();

const CANONICAL_IDS = new Set(FRACTION_CANONICAL_SKILL_ROWS.map((row) => row.frameworkSkillId));
const SLUG_TO_ID = new Map(FRACTION_CANONICAL_SKILL_ROWS.map((row) => [row.slug, row.frameworkSkillId]));

function clean(value = '') {
  return String(value || '').trim();
}

export function normaliseFractionSkillRef(value = '') {
  const raw = clean(value);
  const upper = raw.toUpperCase();
  if (CANONICAL_IDS.has(upper)) return { original: raw, canonical: upper, valid: true, changed: raw !== upper, reason: raw !== upper ? 'case_normalised' : '' };
  if (SLUG_TO_ID.has(raw)) return { original: raw, canonical: SLUG_TO_ID.get(raw), valid: true, changed: true, reason: 'slug_alias' };
  const canonicalBySlug = getCanonicalFractionSkillBySlug(raw);
  if (canonicalBySlug) return { original: raw, canonical: canonicalBySlug.frameworkSkillId, valid: true, changed: true, reason: 'slug_alias' };
  return { original: raw, canonical: raw, valid: false, changed: false, reason: raw ? 'unknown_skill' : 'missing_skill' };
}

function refsFromArray(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function classifyRefs(values = []) {
  return refsFromArray(values).map(normaliseFractionSkillRef);
}

function recordRow({ collection, id, field, refs = [] }) {
  const classified = classifyRefs(refs);
  const invalid = classified.filter((row) => !row.valid);
  const repairs = classified.filter((row) => row.valid && row.changed);
  return {
    collection,
    id: clean(id),
    field,
    refs: classified,
    invalidRefs: invalid,
    proposedRepairs: repairs,
    riskLevel: invalid.length ? 'high' : repairs.length ? 'medium' : 'low',
  };
}

function compactRows(rows = []) {
  return rows.filter((row) => row.invalidRefs.length || row.proposedRepairs.length);
}

async function execQuery(query, { limit = 0 } = {}) {
  let cursor = query;
  if (limit && cursor?.limit) cursor = cursor.limit(limit);
  if (cursor?.lean) cursor = cursor.lean();
  if (cursor?.exec) return cursor.exec();
  return cursor;
}

async function maybeUpdate(Model, id, patch, apply = false) {
  if (!apply || !Object.keys(patch).length || !Model?.updateOne) return false;
  await Model.updateOne({ _id: id }, { $set: patch });
  return true;
}

function canonicaliseArray(values = []) {
  return refsFromArray(values).map((value) => normaliseFractionSkillRef(value).canonical);
}

export async function auditAndRepairFractionSkillMappings({
  models = {
    GeneratedQuestion,
    MathPathAssignment,
    MathPathDiagnosticSession,
    Worksheet,
  },
  apply = false,
  limit = 0,
} = {}) {
  const report = {
    mode: apply ? 'apply' : 'dry-run',
    canonicalSkillCount: CANONICAL_IDS.size,
    scanned: {
      generatedQuestions: 0,
      assignments: 0,
      diagnostics: 0,
      worksheets: 0,
    },
    invalidRecords: 0,
    repairableRecords: 0,
    updatedRecords: 0,
    rows: [],
  };

  const generatedQuestions = models.GeneratedQuestion?.find
    ? await execQuery(models.GeneratedQuestion.find({ domainId: 'fractions' }), { limit })
    : [];
  report.scanned.generatedQuestions = generatedQuestions.length;
  for (const question of generatedQuestions) {
    const row = recordRow({
      collection: 'GeneratedQuestion',
      id: question._id || question.questionId || question.sourceQuestionId,
      field: 'skillId',
      refs: [question.skillId],
    });
    if (row.invalidRefs.length || row.proposedRepairs.length) {
      report.rows.push(row);
      if (row.proposedRepairs.length && !row.invalidRefs.length) {
        const updated = await maybeUpdate(models.GeneratedQuestion, question._id, { skillId: row.proposedRepairs[0].canonical }, apply);
        if (updated) report.updatedRecords += 1;
      }
    }
  }

  const assignments = models.MathPathAssignment?.find
    ? await execQuery(models.MathPathAssignment.find({ domainId: 'fractions' }), { limit })
    : [];
  report.scanned.assignments = assignments.length;
  for (const assignment of assignments) {
    const row = recordRow({
      collection: 'MathPathAssignment',
      id: assignment._id,
      field: 'skillIds',
      refs: assignment.skillIds || [],
    });
    if (row.invalidRefs.length || row.proposedRepairs.length) {
      report.rows.push(row);
      if (row.proposedRepairs.length && !row.invalidRefs.length) {
        const updated = await maybeUpdate(models.MathPathAssignment, assignment._id, { skillIds: canonicaliseArray(assignment.skillIds) }, apply);
        if (updated) report.updatedRecords += 1;
      }
    }
  }

  const diagnostics = models.MathPathDiagnosticSession?.find
    ? await execQuery(models.MathPathDiagnosticSession.find({ domainId: 'fractions' }), { limit })
    : [];
  report.scanned.diagnostics = diagnostics.length;
  for (const diagnostic of diagnostics) {
    const refs = [
      ...(diagnostic.targetSkillIds || []),
      ...(diagnostic.assignedPracticeSkillIds || []),
      ...((diagnostic.perSkillSnapshot || []).map((row) => row.skillId)),
      ...((diagnostic.result?.weakSkillIds || []).map((row) => row.skillId || row)),
      ...((diagnostic.result?.masteredSkillIds || []).map((row) => row.skillId || row)),
    ];
    const row = recordRow({
      collection: 'MathPathDiagnosticSession',
      id: diagnostic._id || diagnostic.diagnosticSessionId,
      field: 'target/assigned/snapshot/result skill refs',
      refs,
    });
    if (row.invalidRefs.length || row.proposedRepairs.length) report.rows.push(row);
  }

  const worksheets = models.Worksheet?.find
    ? await execQuery(models.Worksheet.find({ $or: [{ domainId: 'fractions' }, { subject: 'Math' }, { subject: 'Mathematics' }] }), { limit })
    : [];
  report.scanned.worksheets = worksheets.length;
  for (const worksheet of worksheets) {
    const row = recordRow({
      collection: 'Worksheet',
      id: worksheet._id,
      field: 'skillIds',
      refs: worksheet.skillIds || worksheet.targetSkills || [],
    });
    if (row.invalidRefs.length || row.proposedRepairs.length) {
      report.rows.push(row);
      if (row.proposedRepairs.length && !row.invalidRefs.length && Array.isArray(worksheet.skillIds)) {
        const updated = await maybeUpdate(models.Worksheet, worksheet._id, { skillIds: canonicaliseArray(worksheet.skillIds) }, apply);
        if (updated) report.updatedRecords += 1;
      }
    }
  }

  const flagged = compactRows(report.rows);
  report.invalidRecords = flagged.filter((row) => row.invalidRefs.length).length;
  report.repairableRecords = flagged.filter((row) => row.proposedRepairs.length && !row.invalidRefs.length).length;
  report.rows = flagged;
  report.ok = report.invalidRecords === 0;
  report.recommendation = report.invalidRecords
    ? 'Review high-risk invalid skill references before pilot reporting.'
    : report.repairableRecords
      ? 'Run with --apply only after reviewing proposed alias/case repairs.'
      : 'No fraction skill mapping repairs needed.';
  return report;
}

function parseArgs(args = []) {
  const set = new Set(args);
  const valueArg = (prefix, fallback = '') => {
    const found = args.find((arg) => arg.startsWith(`${prefix}=`));
    return found ? found.slice(prefix.length + 1) : fallback;
  };
  return {
    apply: set.has('--apply'),
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
    const report = await auditAndRepairFractionSkillMappings(options);
    console.log(JSON.stringify(report, null, 2));
    if (!options.apply) console.log('Dry run only. Pass --apply to write repairable alias/case changes.');
  } finally {
    await mongoose.disconnect();
  }
}
