// Persist the misconceptions the AI diagnosed from a photo of marked work as
// per-student DiagnosedMisconception rows. Pure shaping (buildMisconceptionDocs)
// is split from the DB write (logDiagnosedMisconceptions) so it can be unit-tested
// without a database, and so callers can treat logging as best-effort (a failure
// here must never fail the worksheet itself).
import DiagnosedMisconception from '../models/DiagnosedMisconception.js';

// A stable key for aggregating the same misconception across students: topic +
// title, lowercased and whitespace-collapsed. Used by the common-mistakes view.
export function normalizeKey(topic, title) {
  const clean = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return `${clean(topic)}::${clean(title)}`;
}

// Shape an AI analyze result into DiagnosedMisconception documents (no DB).
export function buildMisconceptionDocs({ result, ownerUserId, studentUserId = null, studentName = '', worksheetId = null }) {
  const list = Array.isArray(result?.misconceptions) ? result.misconceptions : [];
  const topic = result?.topic || '';
  const skills = Array.isArray(result?.skillsToReinforce) ? result.skillsToReinforce : [];
  return list
    .filter((m) => m && (m.title || m.description))
    .map((m) => {
      const title = String(m.title || 'Misconception').slice(0, 200);
      return {
        ownerUserId,
        studentUserId,
        studentName,
        worksheetId,
        subject: 'Math',
        topic,
        title,
        description: m.description || '',
        evidence: m.evidence || '',
        skills,
        normalizedKey: normalizeKey(topic, title),
        source: 'worksheet-photo',
      };
    });
}

// Persist the diagnosed misconceptions for a student. Returns the created docs
// (empty array when there is nothing to log).
export async function logDiagnosedMisconceptions(opts) {
  const docs = buildMisconceptionDocs(opts);
  if (!docs.length) return [];
  return DiagnosedMisconception.insertMany(docs);
}
