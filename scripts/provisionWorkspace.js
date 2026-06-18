// One-off script: create a workspace for an existing user who registered before
// the auto-workspace fix landed.
//
// Usage:
//   node scripts/provisionWorkspace.js pypteltd@gmail.com tutor
//   node scripts/provisionWorkspace.js someone@email.com parent
//
// Safe to re-run: skips creation if the user already has a workspace of that role.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';

dotenv.config();

const [email, role = 'tutor'] = process.argv.slice(2);
if (!email) {
  console.error('Usage: node scripts/provisionWorkspace.js <email> [tutor|parent]');
  process.exit(1);
}
if (!['tutor', 'parent', 'teacher'].includes(role)) {
  console.error('Role must be one of: tutor, parent, teacher');
  process.exit(1);
}

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

const WS_DEFAULTS = {
  tutor:   { type: 'tutor',   name: 'My Tuition',        role: 'tutor'   },
  parent:  { type: 'parent',  name: 'Family workspace',   role: 'parent'  },
  teacher: { type: 'school',  name: 'My Class',           role: 'teacher' },
};

async function main() {
  await mongoose.connect(URI);

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const existing = await Workspace.findOne({ ownerUserId: user._id, role });
  if (existing) {
    console.log(`✅ User already has a ${role} workspace: ${existing.name} (${existing._id})`);
    if (!user.defaultWorkspace) {
      user.defaultWorkspace = existing._id;
      await user.save();
      console.log('   → Set as defaultWorkspace (was missing).');
    }
    await mongoose.disconnect();
    return;
  }

  const ws = await Workspace.create({ ...WS_DEFAULTS[role], ownerUserId: user._id });
  await WorkspaceMember.create({ workspaceId: ws._id, userId: user._id, role, status: 'active' });

  if (!user.roles?.includes(role)) {
    user.roles = [...(user.roles || []), role];
  }
  if (!user.role) user.role = role;
  user.defaultWorkspace = ws._id;
  await user.save();

  console.log(`✅ Workspace created for ${email}`);
  console.log(`   Role: ${role}`);
  console.log(`   Workspace: ${ws.name} (${ws._id})`);

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
