import StudentGuardian from '../models/StudentGuardian.js';

export function requireGuardianAccess({ write = false } = {}) {
  return async (req, res, next) => {
    try {
      const studentId = req.params.studentId || req.params.childId || req.body?.studentId;
      if (!studentId) return next();

      const link = await StudentGuardian.findOne({
        guardianUserId: req.user.id,
        studentId,
      }).lean();

      if (!link) {
        return res.status(403).json({ error: 'No guardian link to this student' });
      }

      if (write && link.accessLevel === 'view_only') {
        return res.status(403).json({ error: 'View-only access does not permit this action' });
      }

      req.guardianLink = link;
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

export default requireGuardianAccess;
