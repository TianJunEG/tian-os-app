import crypto from 'crypto';
import User from '../../models/User.js';
import StudentGuardian from '../../models/StudentGuardian.js';
import Workspace from '../../models/Workspace.js';
import WorkspaceMember from '../../models/WorkspaceMember.js';

// Ensure the user holds the 'parent' role + a family workspace to land in.
// (Mirrors routes/parentInvites.js ensureParentWorkspace.)
async function ensureParentWorkspace(user) {
  if (!Array.isArray(user.roles) || !user.roles.includes('parent')) {
    user.roles = [...new Set([...(user.roles || [user.role]), 'parent'])];
    await user.save();
  }
  let ws = await Workspace.findOne({ ownerUserId: user._id, type: 'parent' });
  if (!ws) {
    ws = await Workspace.create({ type: 'parent', name: 'Family workspace', role: 'parent', ownerUserId: user._id });
    await WorkspaceMember.create({ workspaceId: ws._id, userId: user._id, role: 'parent', status: 'active' });
  }
  if (!user.defaultWorkspace) { user.defaultWorkspace = ws._id; await user.save(); }
  return ws;
}

// Quick direct guardian link by email — no email-invite roundtrip. If the email
// belongs to an existing account, link it; otherwise create a parent account
// (random password — they set one via "forgot password"). Creates the view-only,
// school-sourced StudentGuardian link in the teacher/tutor's workspace (idempotent).
export async function linkGuardianByEmail({ studentId, workspaceId, email, name = '' }) {
  const cleanEmail = String(email || '').toLowerCase().trim();
  if (!cleanEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    const err = new Error('A valid parent email is required.'); err.status = 400; throw err;
  }
  let user = await User.findOne({ email: cleanEmail });
  let created = false;
  if (!user) {
    user = await User.create({
      name: String(name).trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: crypto.randomBytes(12).toString('hex'), // random — parent uses "forgot password"
      role: 'parent',
      roles: ['parent'],
    });
    created = true;
  }
  await ensureParentWorkspace(user);

  await StudentGuardian.updateOne(
    { studentId, guardianUserId: user._id, workspaceId },
    {
      $setOnInsert: {
        studentId, guardianUserId: user._id, workspaceId,
        relation: 'parent', accessLevel: 'view_only', source: 'school_invite',
      },
    },
    { upsert: true },
  );

  return { linked: true, created, parentName: user.name, parentEmail: user.email };
}

export default { linkGuardianByEmail };
