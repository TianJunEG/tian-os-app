import express from 'express';
import { protect } from '../middleware/auth.js';
import { requireWorkspace } from '../middleware/workspace.js';
import { requireEntitlement } from '../middleware/entitlements.js';
import Class from '../models/Class.js';
import ClassStudent from '../models/ClassStudent.js';
import Student from '../models/Student.js';
import ClassJoinCode from '../models/ClassJoinCode.js';
import {
  createJoinCode,
  createStudentRecord,
  importRoster,
  parseRosterCsv,
} from '../services/school/schoolAdminService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
router.use(protect, requireWorkspace, requireEntitlement('schoolAdminConsole'));

// Only a school administrator (HOD/IT) — or the school workspace owner — may
// manage the school's accounts. Keeps the console out of plain teachers' hands.
function ensureSchoolAdmin(req, res) {
  const isAdminRole = req.workspaceRole === 'school_admin' || req.workspaceRole === 'admin';
  const isOwner = req.workspace && String(req.workspace.ownerUserId) === String(req.user.id);
  if (!isAdminRole && !isOwner) {
    res.status(403).json({ error: 'School administrator access required.' });
    return false;
  }
  return true;
}

// Overview: classes with roster counts + seat usage vs the plan limit.
router.get('/overview', asyncHandler(async (req, res) => {
  if (!ensureSchoolAdmin(req, res)) return;
  const classes = await Class.find({ workspaceId: req.workspaceId }).sort({ createdAt: 1 }).lean();
  const totalStudents = await Student.countDocuments({ workspaceId: req.workspaceId });
  const out = await Promise.all(classes.map(async (c) => ({
    classId: c._id, name: c.name, level: c.level, modules: c.modules, academicYear: c.academicYear,
    studentCount: await ClassStudent.countDocuments({ classId: c._id, status: 'active' }),
  })));
  const studentLimit = req.entitlements?.limits?.students ?? null;
  res.json({
    workspace: { id: req.workspaceId, name: req.workspace?.name || '' },
    tier: req.entitlements?.tier,
    planName: req.entitlements?.planName,
    seatUsage: { students: totalStudents, studentLimit },
    classes: out,
  });
}));

// Create a class.
router.post('/classes', asyncHandler(async (req, res) => {
  if (!ensureSchoolAdmin(req, res)) return;
  const { name, level = '', modules = ['MathPath'], academicYear = '', teacherUserId } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Class name is required.' });
  const cls = await Class.create({
    workspaceId: req.workspaceId, teacherUserId: teacherUserId || req.user.id,
    name: String(name).trim(), level, modules, academicYear, status: 'active',
  });
  res.status(201).json({ class: { classId: cls._id, name: cls.name, level: cls.level } });
}));

// Create one student (optionally with a login + class enrolment).
router.post('/students', asyncHandler(async (req, res) => {
  if (!ensureSchoolAdmin(req, res)) return;
  const { name, level = '', classId = null, email = '', password = '', createLogin = false } = req.body || {};
  try {
    const out = await createStudentRecord({
      workspaceId: req.workspaceId, createdByUserId: req.user.id,
      name, level, classId, email, password, createLogin: Boolean(createLogin),
    });
    res.status(201).json({
      student: { studentId: out.student._id, name: out.student.name, level: out.student.level },
      enrolled: out.enrolled,
      loginCreated: Boolean(out.user),
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not create student.' });
  }
}));

// Bulk roster import. Accepts either { csv } text or { rows: [...] }.
// Gated additionally on the bulkOnboarding capability.
router.post('/students/bulk', requireEntitlement('bulkOnboarding'), asyncHandler(async (req, res) => {
  if (!ensureSchoolAdmin(req, res)) return;
  const { csv = '', rows: bodyRows, defaultClassId = null, createLogins = false, createMissingClasses = true } = req.body || {};
  let rows = Array.isArray(bodyRows) ? bodyRows : [];
  let parseErrors = [];
  if (!rows.length && csv) {
    const parsed = parseRosterCsv(csv);
    rows = parsed.rows;
    parseErrors = parsed.errors;
  }
  if (!rows.length) return res.status(400).json({ error: 'No rows to import.', parseErrors });
  try {
    const result = await importRoster({
      workspaceId: req.workspaceId, createdByUserId: req.user.id, teacherUserId: req.user.id,
      rows, defaultClassId, createLogins: Boolean(createLogins), createMissingClasses: Boolean(createMissingClasses),
    });
    res.json({ ...result, parseErrors });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Import failed.' });
  }
}));

// Generate / fetch a class join code.
router.post('/classes/:id/join-code', asyncHandler(async (req, res) => {
  if (!ensureSchoolAdmin(req, res)) return;
  const cls = await Class.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
  if (!cls) return res.status(404).json({ error: 'Class not found.' });
  const { expiresInDays = 30, maxUses = null } = req.body || {};
  const expiresAt = expiresInDays ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000) : null;
  try {
    await ClassJoinCode.updateMany({ classId: cls._id, status: 'active' }, { $set: { status: 'revoked' } });
    const codeDoc = await createJoinCode({
      workspaceId: req.workspaceId, classId: cls._id, createdByUserId: req.user.id, expiresAt, maxUses,
    });
    res.status(201).json({ joinCode: { code: codeDoc.code, expiresAt: codeDoc.expiresAt, maxUses: codeDoc.maxUses } });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not create join code.' });
  }
}));

router.get('/classes/:id/join-code', asyncHandler(async (req, res) => {
  if (!ensureSchoolAdmin(req, res)) return;
  const active = await ClassJoinCode.findOne({ classId: req.params.id, workspaceId: req.workspaceId, status: 'active' }).sort({ createdAt: -1 }).lean();
  res.json({ joinCode: active ? { code: active.code, expiresAt: active.expiresAt, maxUses: active.maxUses, usedCount: active.usedCount } : null });
}));

export default router;
