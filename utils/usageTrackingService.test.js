import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import BillingUsageEvent from '../models/BillingUsageEvent.js';
import PartnerOrganisation from '../models/PartnerOrganisation.js';
import PartnerMembership from '../models/PartnerMembership.js';
import PartnerStudent from '../models/PartnerStudent.js';
import Student from '../models/Student.js';
import Worksheet from '../models/Worksheet.js';
import MathPathDiagnosticSession from '../models/mathpath/MathPathDiagnosticSession.js';
import MathPathAssignment from '../models/mathpath/MathPathAssignment.js';
import PaperAnalysis from '../models/mathpath/PaperAnalysis.js';
import {
  compareUsageToLimits,
  getUsageSummary,
  recordBillingUsage,
} from '../services/billing/usageTrackingService.js';

let mongo;
let partner;
let student;
let userId;
let workspaceId;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([
    BillingUsageEvent.deleteMany({}),
    PartnerOrganisation.deleteMany({}),
    PartnerMembership.deleteMany({}),
    PartnerStudent.deleteMany({}),
    Student.deleteMany({}),
    Worksheet.deleteMany({}),
    MathPathDiagnosticSession.deleteMany({}),
    MathPathAssignment.deleteMany({}),
    PaperAnalysis.deleteMany({}),
  ]);
  userId = new mongoose.Types.ObjectId();
  workspaceId = new mongoose.Types.ObjectId();
  partner = await PartnerOrganisation.create({ name: 'Pilot Centre', type: 'student_care', status: 'pilot' });
  student = await Student.create({ name: 'Pilot Student', workspaceId, createdByUserId: userId });
  await PartnerStudent.create({ organisationId: partner._id, studentId: student._id, status: 'active' });
  await PartnerMembership.create({ organisationId: partner._id, userId, role: 'manager', status: 'active' });
});

describe('usageTrackingService', () => {
  it('counts partner usage from current persisted learning records', async () => {
    await MathPathDiagnosticSession.create({
      diagnosticSessionId: 'diag_1',
      studentId: String(student._id),
      subjectId: 'math',
      domainId: 'fractions',
      status: 'completed',
      completedAt: new Date(),
    });
    await PaperAnalysis.create({
      studentId: String(student._id),
      uploadedByUserId: String(userId),
      uploadedByRole: 'student_care',
      uploadType: 'marked_script',
      status: 'reviewed',
    });
    await Worksheet.create({
      userId,
      studentId: student._id,
      generatedByUserId: userId,
      generatedByRole: 'student_care',
      sourceMode: 'intervention',
      worksheetType: 'recovery_worksheet',
      generatedContent: { title: 'Recovery Worksheet' },
    });
    await MathPathAssignment.create({
      studentId: String(student._id),
      assignedByUserId: String(userId),
      assignedByRole: 'student_care',
      sourceType: 'system',
      sourceId: 'source_1',
      skillIds: ['F025'],
    });
    await recordBillingUsage({
      ownerType: 'partner',
      ownerId: partner._id,
      eventType: 'impact_report_generated',
    });
    await recordBillingUsage({
      ownerType: 'partner',
      ownerId: partner._id,
      eventType: 'worksheet_generated',
    });

    const usage = await getUsageSummary({ ownerType: 'partner', ownerId: partner._id });

    expect(usage.students).toBe(1);
    expect(usage.staff).toBe(1);
    expect(usage.diagnosticsPerMonth).toBe(1);
    expect(usage.paperUploadsPerMonth).toBe(1);
    expect(usage.worksheetsPerMonth).toBe(1);
    expect(usage.recoveryPacksPerMonth).toBe(1);
    expect(usage.reportsPerMonth).toBe(1);
  });

  it('compares usage with limits', () => {
    const rows = compareUsageToLimits(
      { students: 6, worksheetsPerMonth: 8 },
      { students: 5, worksheetsPerMonth: 10 }
    );

    expect(rows.find((row) => row.key === 'students')).toMatchObject({ withinLimit: false, percentUsed: 120 });
    expect(rows.find((row) => row.key === 'worksheetsPerMonth')).toMatchObject({ withinLimit: true, percentUsed: 80 });
  });
});
