// Runs the Fractions runtime evidence repair audit against the live DB and prints a
// before/after + pilot-claim-gate summary. Closes the gap where normalizeRecheckSnapshot
// (recheck evidence-ref repair) and buildAuditWorksheetFromAssignment (worksheet audit
// record) existed only as pure functions with no runnable entry point. Legacy-mistake
// normalization is handled separately by backfillLegacyMistakeEvidence.js — this script
// does NOT write mistakes, to avoid overlapping that one.
//
// Usage:
//   node scripts/runFractionsRuntimeEvidenceRepair.js            # dry-run report only
//   node scripts/runFractionsRuntimeEvidenceRepair.js --apply    # also persist recheck
//                                                                 # patches + seeded worksheet
//   node scripts/runFractionsRuntimeEvidenceRepair.js --limit=500
//
// Dry-run is the default. Review the printed plan before using --apply.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import MathPathDiagnosticSession from '../models/mathpath/MathPathDiagnosticSession.js';
import Worksheet from '../models/Worksheet.js';
import {
  loadFractionsRuntimeEvidenceFromDb,
  runRuntimeEvidenceRepairAudit,
} from '../services/mathpath/fractionsRuntimeEvidenceIntegrityService.js';

dotenv.config();

function parseArgs(args = []) {
  const set = new Set(args);
  const valueArg = (prefix, fallback = '') => {
    const found = args.find((arg) => arg.startsWith(`${prefix}=`));
    return found ? found.slice(prefix.length + 1) : fallback;
  };
  return { apply: set.has('--apply'), limit: Number(valueArg('--limit', '200')) || 200 };
}

export async function runFractionsRuntimeEvidenceRepair({ apply = false, limit = 200 } = {}) {
  const runtime = await loadFractionsRuntimeEvidenceFromDb({ limit });
  const result = await runRuntimeEvidenceRepairAudit(runtime);

  let appliedRecheckPatches = 0;
  let appliedWorksheetSeed = 0;
  if (apply) {
    // Persist recheck evidence-ref / target / misconception / linkage repairs.
    for (const repair of result.repairPlan.recheckRepairs) {
      if (!repair.changed || !repair.recordId) continue;
      await MathPathDiagnosticSession.updateOne({ _id: repair.recordId }, { $set: repair.patch });
      appliedRecheckPatches += 1;
    }
    // Seed a worksheet audit record only when none existed (the audit path was missing).
    if (result.repairPlan.worksheetSeededForAudit && result.repairPlan.worksheetSeedRecord) {
      const seed = result.repairPlan.worksheetSeedRecord;
      const existing = await Worksheet.findOne({ _id: seed._id }).lean();
      if (!existing) {
        await Worksheet.create(seed);
        appliedWorksheetSeed = 1;
      }
    }
  }

  return {
    mode: apply ? 'apply' : 'dry-run',
    limit,
    before: { ok: result.before.ok, issueCounts: result.before.issueCounts },
    after: { ok: result.after.ok, issueCounts: result.after.issueCounts },
    pilotClaimGate: result.pilotClaimGate,
    repairSummary: result.repairPlan.summary,
    appliedRecheckPatches,
    appliedWorksheetSeed,
    plannedRecheckPatches: result.repairPlan.recheckRepairs.filter((r) => r.changed).map((r) => ({ recordId: r.recordId, patchKeys: Object.keys(r.patch) })),
    worksheetSeedId: result.repairPlan.worksheetSeedRecord?._id || null,
  };
}

const here = fileURLToPath(import.meta.url);
const invoked = process.argv[1] ? fs.realpathSync(process.argv[1]) : '';

if (here === invoked) {
  const options = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://127.0.0.1:27017/tutor-match';
  await mongoose.connect(uri);
  try {
    const report = await runFractionsRuntimeEvidenceRepair(options);
    console.log(JSON.stringify(report, null, 2));
    if (!options.apply) {
      console.log('\nDry run only. Pass --apply to persist recheck patches and the seeded worksheet audit record.');
      console.log('Legacy mistake normalization is applied separately: node scripts/backfillLegacyMistakeEvidence.js --apply');
    }
  } finally {
    await mongoose.disconnect();
  }
}
