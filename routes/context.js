import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';

const router = express.Router();

// @route   GET /api/context
// @desc    Roles + workspaces available to the current user, for the role and
//          workspace switchers. Role controls features; workspace controls
//          visible students/records.
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email role roles defaultWorkspace');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const memberships = await WorkspaceMember.find({ userId: user._id, status: 'active' });
    const workspaceIds = memberships.map((m) => m.workspaceId);
    const workspaces = await Workspace.find({ _id: { $in: workspaceIds } });

    // Roles available = roles[] if present, else fall back to the legacy single role.
    const roles = (user.roles && user.roles.length) ? user.roles : [user.role];

    const wsList = workspaces.map((w) => ({
      id: w._id,
      type: w.type,
      name: w.name,
      role: w.role
    }));

    res.json({
      user: { id: user._id, name: user.name, email: user.email, roles },
      workspaces: wsList,
      defaultWorkspaceId: user.defaultWorkspace || (wsList[0] && wsList[0].id) || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load context' });
  }
});

// @route   POST /api/context/switch
// @desc    Validate the user may enter a workspace; client persists the choice
//          and sends it as X-Workspace-Id on subsequent requests.
// @access  Private
router.post('/switch', protect, async (req, res) => {
  const { workspaceId } = req.body;
  if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' });
  try {
    const member = await WorkspaceMember.findOne({
      workspaceId, userId: req.user.id, status: 'active'
    });
    if (!member) return res.status(403).json({ error: 'Not a member of this workspace.' });
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(403).json({ error: 'Not a member of this workspace.' });
    res.json({ activeWorkspace: { id: workspace._id, type: workspace.type, name: workspace.name, role: workspace.role } });
  } catch (err) {
    res.status(400).json({ error: 'Invalid workspace.' });
  }
});

export default router;
