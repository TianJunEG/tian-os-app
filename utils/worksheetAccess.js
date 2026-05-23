// Access rules for worksheets.
// - Creator (parent/tutor) can view and manage.
// - Assigned student can view (and answer) but not manage.

export function canViewWorksheet(worksheet, userId) {
  const uid = String(userId);
  if (String(worksheet.userId) === uid) return true;
  if (worksheet.studentId && String(worksheet.studentId) === uid) return true;
  return false;
}

export function canManageWorksheet(worksheet, userId) {
  return String(worksheet.userId) === String(userId);
}
