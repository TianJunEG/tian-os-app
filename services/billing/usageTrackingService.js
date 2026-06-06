import BillingUsageEvent from '../../models/BillingUsageEvent.js';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import Student from '../../models/Student.js';
import Worksheet from '../../models/Worksheet.js';
import PartnerMembership from '../../models/PartnerMembership.js';
import PartnerStudent from '../../models/PartnerStudent.js';
import MathPathDiagnosticSession from '../../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAssignment from '../../models/mathpath/MathPathAssignment.js';
import PaperAnalysis from '../../models/mathpath/PaperAnalysis.js';

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function id(value) {
  return String(value || '').trim();
}

function studentIdValues(studentIds = []) {
  const strings = studentIds.map(id).filter(Boolean);
  const objectIds = strings
    .filter((value) => /^[a-f\d]{24}$/i.test(value))
    .map((value) => new mongoose.Types.ObjectId(value));
  return [...new Set([...strings, ...objectIds])];
}

async function explicitUsage({ ownerType, ownerId, from, to }) {
  const events = await BillingUsageEvent.aggregate([
    { $match: { ownerType, ownerId: id(ownerId), occurredAt: { $gte: from, $lte: to } } },
    { $group: { _id: '$eventType', total: { $sum: '$quantity' } } },
  ]);
  return Object.fromEntries(events.map((row) => [row._id, row.total]));
}

async function studentIdsForOwner({ ownerType, ownerId }) {
  if (ownerType === 'partner') {
    const links = await PartnerStudent.find({ organisationId: ownerId, status: 'active' }).select('studentId').lean();
    return links.map((link) => id(link.studentId));
  }
  const directStudents = await Student.find({
    $or: [
      { createdByUserId: ownerId },
      { userId: ownerId },
    ],
  }).select('_id').lean();
  return directStudents.map((student) => id(student._id));
}

export async function recordBillingUsage({
  ownerType,
  ownerId,
  eventType,
  quantity = 1,
  subjectId = '',
  domainId = '',
  sourceType = '',
  sourceId = '',
  metadata = {},
} = {}) {
  return BillingUsageEvent.create({
    ownerType,
    ownerId: id(ownerId),
    eventType,
    quantity,
    subjectId,
    domainId,
    sourceType,
    sourceId,
    metadata,
  });
}

export async function getUsageSummary({
  ownerType = 'user',
  ownerId = '',
  from = startOfMonth(),
  to = new Date(),
} = {}) {
  const [studentIds, explicit] = await Promise.all([
    studentIdsForOwner({ ownerType, ownerId }),
    explicitUsage({ ownerType, ownerId, from, to }),
  ]);
  const studentFilter = { studentId: { $in: studentIdValues(studentIds) } };
  const createdFilter = { createdAt: { $gte: from, $lte: to } };
  const completedFilter = { completedAt: { $gte: from, $lte: to } };
  const [staffCount, diagnostics, paperUploads, worksheets, recoveryPacks] = await Promise.all([
    ownerType === 'partner'
      ? PartnerMembership.countDocuments({ organisationId: ownerId, status: { $ne: 'removed' } })
      : User.countDocuments({ linkedTo: ownerId, role: { $ne: 'student' } }),
    MathPathDiagnosticSession.countDocuments({ ...studentFilter, status: 'completed', ...completedFilter }),
    PaperAnalysis.countDocuments({ ...studentFilter, ...createdFilter }),
    Worksheet.countDocuments({ ...studentFilter, ...createdFilter }),
    MathPathAssignment.countDocuments({ ...studentFilter, ...createdFilter }),
  ]);

  return {
    period: { from, to },
    students: studentIds.length + Number(explicit.student_added || 0),
    staff: staffCount + Number(explicit.staff_added || 0),
    diagnosticsPerMonth: diagnostics + Number(explicit.diagnostic_completed || 0),
    paperUploadsPerMonth: paperUploads + Number(explicit.paper_uploaded || 0),
    worksheetsPerMonth: worksheets + Number(explicit.worksheet_generated || 0),
    recoveryPacksPerMonth: recoveryPacks + Number(explicit.recovery_pack_assigned || 0),
    reportsPerMonth: Number(explicit.impact_report_generated || 0),
    reportsViewedPerMonth: Number(explicit.impact_report_viewed || 0),
  };
}

export function compareUsageToLimits(usage = {}, limits = {}) {
  return Object.entries({
    students: 'students',
    staff: 'staff',
    diagnosticsPerMonth: 'diagnosticsPerMonth',
    paperUploadsPerMonth: 'paperUploadsPerMonth',
    worksheetsPerMonth: 'worksheetsPerMonth',
    recoveryPacksPerMonth: 'recoveryPacksPerMonth',
    reportsPerMonth: 'reportsPerMonth',
  }).map(([usageKey, limitKey]) => {
    const limit = limits?.[limitKey];
    const used = Number(usage?.[usageKey] || 0);
    return {
      key: usageKey,
      used,
      limit,
      withinLimit: limit === null || limit === undefined || used <= Number(limit),
      percentUsed: limit === null || limit === undefined || !Number(limit) ? 0 : Math.round((used / Number(limit)) * 100),
    };
  });
}

export default {
  recordBillingUsage,
  getUsageSummary,
  compareUsageToLimits,
};
