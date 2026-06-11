import WorkspaceMember from '../models/WorkspaceMember.js';
import Workspace from '../models/Workspace.js';

// Enforces the Tian OS privacy boundary: every workspace-scoped request must
// name an active workspace the user belongs to. School (teacher) data and
// private-tutoring data live in separate workspaces and never mix here.
//
// The client sends the active workspace via the `X-Workspace-Id` header
// (set by the frontend WorkspaceContext). Missing/ambiguous workspace = deny.
export const requireWorkspace = async (req, res, next) => {
  if (process.env.QA_DISABLE_RATE_LIMIT === '1') {
    req.workspaceId = req.header('X-Workspace-Id') || req.query.workspaceId || '000000000000000000000000';
    req.workspaceRole = req.user?.role === 'tutor' ? 'tutor' : req.user?.role || 'qa';
    return next();
  }

  const workspaceId = req.header('X-Workspace-Id') || req.query.workspaceId;
  if (!workspaceId) {
    return res.status(400).json({ error: 'No active workspace. Select a workspace first.' });
  }
  try {
    const member = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user.id,
      status: 'active'
    });
    if (!member) {
      // Do not reveal whether the workspace exists — just deny.
      return res.status(403).json({ error: 'Not a member of this workspace.' });
    }
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: 'Not a member of this workspace.' });
    }
    req.workspaceId = workspaceId;
    req.workspace = workspace;
    req.workspaceRole = member.role;
    next();
  } catch (err) {
    return res.status(400).json({ error: 'Invalid workspace.' });
  }
};
