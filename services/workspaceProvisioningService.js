import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';

const WORKSPACE_BY_ROLE = {
  tutor: {
    type: 'tutor',
    role: 'tutor',
    nameSuffix: 'Tutor Workspace',
  },
  parent: {
    type: 'parent',
    role: 'parent',
    nameSuffix: 'Family Workspace',
  },
};

function workspaceNameFor(user, config) {
  const name = String(user?.name || '').trim() || 'Tian OS';
  return `${name}'s ${config.nameSuffix}`;
}

export async function ensurePrivateWorkspaceForUser(user, role = user?.role) {
  const config = WORKSPACE_BY_ROLE[role];
  if (!user?._id || !config) return null;

  let membership = await WorkspaceMember.findOne({
    userId: user._id,
    role: config.role,
    status: 'active',
  });

  let workspace = membership
    ? await Workspace.findById(membership.workspaceId)
    : null;

  if (!workspace) {
    workspace = await Workspace.findOne({
      ownerUserId: user._id,
      type: config.type,
      role: config.role,
    });
  }

  if (!workspace) {
    workspace = await Workspace.create({
      type: config.type,
      role: config.role,
      name: workspaceNameFor(user, config),
      ownerUserId: user._id,
    });
  }

  membership = await WorkspaceMember.findOneAndUpdate(
    { workspaceId: workspace._id, userId: user._id },
    {
      $setOnInsert: {
        workspaceId: workspace._id,
        userId: user._id,
        role: config.role,
      },
      $set: {
        status: 'active',
        role: config.role,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (String(user.defaultWorkspace || '') !== String(workspace._id)) {
    user.defaultWorkspace = workspace._id;
  }
  if (Array.isArray(user.roles) && !user.roles.includes(role)) {
    user.roles = [...user.roles, role];
  } else if (!Array.isArray(user.roles) || !user.roles.length) {
    user.roles = [role];
  }
  await user.save({ validateBeforeSave: false });

  return { workspace, membership };
}

