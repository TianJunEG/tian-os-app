// Backfill private tutor workspaces for legacy tutor accounts created before
// registration provisioned Workspace + WorkspaceMember records.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import { ensurePrivateWorkspaceForUser } from '../services/workspaceProvisioningService.js';

dotenv.config();

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';

async function main() {
  await mongoose.connect(URI);

  const tutors = await User.find({
    $or: [
      { role: 'tutor' },
      { roles: 'tutor' },
    ],
  });

  let createdOrLinked = 0;
  for (const tutor of tutors) {
    const activeMembership = await WorkspaceMember.findOne({
      userId: tutor._id,
      role: 'tutor',
      status: 'active',
    });
    if (activeMembership) continue;

    const provisioned = await ensurePrivateWorkspaceForUser(tutor, 'tutor');
    if (provisioned?.workspace) {
      createdOrLinked += 1;
      console.log(`Provisioned tutor workspace for ${tutor.email}: ${provisioned.workspace._id}`);
    }
  }

  console.log(`Backfill complete. Tutor workspaces provisioned: ${createdOrLinked}`);
  await mongoose.disconnect();
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

