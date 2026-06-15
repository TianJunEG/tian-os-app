import express from 'express';
import { protect } from '../middleware/auth.js';
import ClassJoinCode from '../models/ClassJoinCode.js';
import Class from '../models/Class.js';
import ClassStudent from '../models/ClassStudent.js';
import Student from '../models/Student.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';

const router = express.Router();

function normaliseCode(raw) {
  return String(raw || '').trim().toUpperCase();
}

// Validate a code is usable; returns { code, klass } or sends an error.
async function resolveUsableCode(codeStr, res) {
  const code = await ClassJoinCode.findOne({ code: codeStr, status: 'active' });
  if (!code) { res.status(404).json({ error: 'That code is not valid.' }); return null; }
  if (code.expiresAt && new Date(code.expiresAt).getTime() < Date.now()) {
    res.status(400).json({ error: 'That code has expired.' });
    return null;
  }
  if (code.maxUses != null && code.usedCount >= code.maxUses) {
    res.status(400).json({ error: 'That code has reached its usage limit.' });
    return null;
  }
  const klass = await Class.findById(code.classId);
  if (!klass) { res.status(404).json({ error: 'The class for this code no longer exists.' }); return null; }
  return { code, klass };
}

// GET /api/join/:code — preview what a code joins (logged-in students/parents).
router.get('/:code', protect, asyncHandler(async (req, res) => {
  const resolved = await resolveUsableCode(normaliseCode(req.params.code), res);
  if (!resolved) return;
  const { klass } = resolved;
  const workspace = await Workspace.findById(klass.workspaceId).select('name');
  res.json({ className: klass.name, level: klass.level, schoolName: workspace?.name || '' });
}));

// POST /api/join/:code — redeem: enrol the current user as a student in the class.
router.post('/:code', protect, asyncHandler(async (req, res) => {
  const resolved = await resolveUsableCode(normaliseCode(req.params.code), res);
  if (!resolved) return;
  const { code, klass } = resolved;

  // Reuse an existing student record this user already owns in the class
  // workspace, otherwise create one. Keeps re-redeeming idempotent.
  let student = await Student.findOne({ workspaceId: klass.workspaceId, userId: req.user.id });
  if (!student) {
    const me = await User.findById(req.user.id).select('name');
    student = await Student.create({
      name: me?.name || 'Student',
      level: klass.level || '',
      workspaceId: klass.workspaceId,
      userId: req.user.id,
      createdByUserId: req.user.id,
      profile: { mainFocus: 'MathPath', modulesUsed: ['MathPath'] },
    });
  }

  const already = await ClassStudent.findOne({ classId: klass._id, studentId: student._id });
  if (already) {
    return res.json({ joined: true, alreadyEnrolled: true, className: klass.name });
  }

  await ClassStudent.create({ workspaceId: klass.workspaceId, classId: klass._id, studentId: student._id, status: 'active' });
  code.usedCount += 1;
  await code.save();

  res.status(201).json({ joined: true, className: klass.name });
}));

export default router;
