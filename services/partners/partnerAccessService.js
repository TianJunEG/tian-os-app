import PartnerMembership from '../../models/PartnerMembership.js';
import PartnerStudent from '../../models/PartnerStudent.js';

function text(value) {
  return String(value || '').trim();
}

export async function getUserPartnerMemberships(userId) {
  return PartnerMembership.find({
    userId,
    status: 'active',
  }).lean();
}

export async function userCanAccessPartnerStudent({ userId, studentId } = {}) {
  const memberships = await getUserPartnerMemberships(userId);
  if (!memberships.length) return false;
  const organisationIds = memberships.map((membership) => membership.organisationId);
  const link = await PartnerStudent.findOne({
    organisationId: { $in: organisationIds },
    studentId,
    status: 'active',
  }).lean();
  return Boolean(link);
}

export async function assertPartnerStudentAccess({ userId, studentId } = {}) {
  const allowed = await userCanAccessPartnerStudent({ userId, studentId });
  if (!allowed) {
    const err = new Error('Student is not linked to your partner organisation.');
    err.status = 403;
    throw err;
  }
  return true;
}

export async function listPartnerStudentIdsForUser(userId) {
  const memberships = await getUserPartnerMemberships(userId);
  if (!memberships.length) return [];
  const organisationIds = memberships.map((membership) => membership.organisationId);
  const links = await PartnerStudent.find({
    organisationId: { $in: organisationIds },
    status: 'active',
  }).lean();
  return [...new Set(links.map((link) => text(link.studentId)).filter(Boolean))];
}

export default {
  getUserPartnerMemberships,
  userCanAccessPartnerStudent,
  assertPartnerStudentAccess,
  listPartnerStudentIdsForUser,
};
