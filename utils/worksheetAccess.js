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

// Returns a plain worksheet object safe to send to `userId`. The owner
// (parent/tutor) sees everything; a non-owner viewer (an assigned student)
// must not receive the answer key for questions they haven't attempted yet,
// or they could read it from the API response before answering. Answers for
// already-marked questions are kept so post-attempt review still works.
export function redactWorksheetForViewer(worksheet, userId) {
  const obj = typeof worksheet?.toObject === 'function' ? worksheet.toObject() : worksheet;
  if (canManageWorksheet(obj, userId)) return obj;

  for (const session of obj.practiceSessions || []) {
    for (const q of session.questions || []) {
      if (q.markedAt == null) {
        delete q.answer;
        delete q.workedSolution;
      }
    }
  }
  return obj;
}
