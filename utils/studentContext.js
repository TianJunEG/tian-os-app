// Resolve which Student a request acts on, and the workspace that scopes it.
//
// A student user is NOT a workspace member (the child record lives in the
// parent's workspace). So student-facing routes resolve the Student by the
// logged-in user, and derive workspaceId from the Student record. Adult callers
// (parent/tutor/teacher) pass studentId and must be a guardian or workspace
// member. This keeps the privacy boundary without forcing students into a
// workspace membership.
import Student from '../models/Student.js';
import StudentGuardian from '../models/StudentGuardian.js';
import TutorStudentLink from '../models/TutorStudentLink.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import { userCanAccessPartnerStudent } from '../services/partners/partnerAccessService.js';

// Throws { status, message } on no access. Returns the Student doc.
export async function resolveStudent(req, explicitId) {
  const studentId = explicitId || req.body?.studentId || req.query?.studentId;

  if (studentId) {
    const student = await Student.findById(studentId);
    if (!student) throw { status: 404, message: 'Student not found.' };
    // The student themselves:
    if (student.userId && String(student.userId) === String(req.user.id)) return student;
    // A guardian of the student:
    const guardian = await StudentGuardian.findOne({ studentId: student._id, guardianUserId: req.user.id });
    if (guardian) return student;
    // A tutor explicitly assigned to this student in the active tutor workspace:
    const tutorLink = await TutorStudentLink.findOne({
      studentId: student._id,
      tutorUserId: req.user.id,
      ...(req.workspaceId ? { workspaceId: req.workspaceId } : {}),
      status: 'active',
    });
    if (tutorLink) return student;
    // A member of the student's workspace (tutor/teacher):
    const member = await WorkspaceMember.findOne({ workspaceId: student.workspaceId, userId: req.user.id, status: 'active' });
    if (member) return student;
    // Partner/centre staff explicitly linked to this student:
    if (await userCanAccessPartnerStudent({ userId: req.user.id, studentId: student._id })) return student;
    throw { status: 403, message: 'No access to this student.' };
  }

  // No id → the logged-in student's own record.
  const own = await Student.findOne({ userId: req.user.id });
  if (!own) throw { status: 400, message: 'No student profile for this user. Pass studentId.' };
  return own;
}
