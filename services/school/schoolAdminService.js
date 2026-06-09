import Class from '../../models/Class.js';
import ClassStudent from '../../models/ClassStudent.js';
import Student from '../../models/Student.js';
import User from '../../models/User.js';
import ClassJoinCode from '../../models/ClassJoinCode.js';

// Unambiguous alphabet (no 0/O/1/I) so codes are easy to read out and type.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateJoinCodeString(length = 6) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

// Parse a roster CSV (header row required) into normalised rows. Pure + testable.
// Recognised headers (case-insensitive): name, level, class, email, parent_email.
// Returns { rows, errors } — errors carry the 1-based source line for feedback.
export function parseRosterCsv(text = '') {
  const lines = String(text).split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return { rows: [], errors: [{ line: 0, message: 'File is empty.' }] };

  // Quote-aware splitter: commas inside "double quotes" stay in the field, and
  // doubled quotes ("") become a literal quote. Handles real rosters like
  //   "Tan, Wei",Primary 6
  const splitLine = (line) => {
    const cells = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c += 1) {
      const ch = line[c];
      if (ch === '"') {
        if (inQuotes && line[c + 1] === '"') { cur += '"'; c += 1; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells.map((x) => x.trim());
  };
  const header = splitLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (key) => header.indexOf(key);
  const nameAt = idx('name');
  if (nameAt === -1) return { rows: [], errors: [{ line: 1, message: 'Missing required "name" column.' }] };

  const rows = [];
  const errors = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitLine(lines[i]);
    const name = (cells[nameAt] || '').trim();
    if (!name) { errors.push({ line: i + 1, message: 'Row has no name; skipped.' }); continue; }
    rows.push({
      name,
      level: idx('level') > -1 ? (cells[idx('level')] || '').trim() : '',
      class: idx('class') > -1 ? (cells[idx('class')] || '').trim() : '',
      email: idx('email') > -1 ? (cells[idx('email')] || '').trim().toLowerCase() : '',
      parentEmail: idx('parent_email') > -1 ? (cells[idx('parent_email')] || '').trim().toLowerCase() : '',
    });
  }
  return { rows, errors };
}

// Create one unique, active join code for a class.
export async function createJoinCode({ workspaceId, classId, createdByUserId, expiresAt = null, maxUses = null } = {}) {
  let code;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateJoinCodeString(6);
    const clash = await ClassJoinCode.findOne({ code: candidate });
    if (!clash) { code = candidate; break; }
  }
  if (!code) throw new Error('Could not generate a unique join code.');
  return ClassJoinCode.create({ workspaceId, classId, code, createdByUserId, expiresAt, maxUses, status: 'active' });
}

// Create a single school Student in a workspace, optionally with a login + class
// enrolment. Returns { student, user, enrolled }.
export async function createStudentRecord({
  workspaceId, createdByUserId, name, level = '', classId = null, email = '', password = '', createLogin = false,
} = {}) {
  if (!name || !String(name).trim()) throw new Error('Student name is required.');

  let user = null;
  if (createLogin && email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      user = existing; // link an existing login rather than fail the whole import
    } else {
      user = await User.create({
        name, email: email.toLowerCase(), password: password || generateJoinCodeString(10),
        role: 'student', linkedTo: createdByUserId,
      });
    }
  }

  const student = await Student.create({
    name: String(name).trim(),
    level,
    workspaceId,
    userId: user?._id || null,
    createdByUserId,
    profile: { mainFocus: 'MathPath', modulesUsed: ['MathPath'] },
  });

  let enrolled = false;
  if (classId) {
    await ClassStudent.updateOne(
      { classId, studentId: student._id },
      { $setOnInsert: { workspaceId, classId, studentId: student._id, status: 'active' } },
      { upsert: true }
    );
    enrolled = true;
  }
  return { student, user, enrolled };
}

// Resolve a class by id or (within the workspace) by name, creating it if asked.
async function resolveClass({ workspaceId, teacherUserId, classId, className, createMissing, cache }) {
  if (classId) return classId;
  const key = (className || '').toLowerCase();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key);
  let cls = await Class.findOne({ workspaceId, name: new RegExp(`^${className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (!cls && createMissing) {
    cls = await Class.create({ workspaceId, teacherUserId, name: className, level: '', modules: ['MathPath'], status: 'active' });
  }
  const id = cls?._id || null;
  cache.set(key, id);
  return id;
}

// Bulk import a roster. Dedupes by (name + class) within the workspace so a
// re-run doesn't duplicate students. Returns per-row results + a summary.
export async function importRoster({
  workspaceId, createdByUserId, teacherUserId, rows = [], defaultClassId = null,
  createLogins = false, createMissingClasses = true,
} = {}) {
  const results = [];
  const cache = new Map();
  let created = 0; let skipped = 0; let failed = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] || {};
    const rowNum = i + 1;
    try {
      const name = String(row.name || '').trim();
      if (!name) { failed += 1; results.push({ rowNum, name: '', status: 'error', message: 'Missing name.' }); continue; }

      const classId = defaultClassId || await resolveClass({
        workspaceId, teacherUserId: teacherUserId || createdByUserId,
        classId: row.classId, className: row.class, createMissing: createMissingClasses, cache,
      });

      // Dedupe: same name already in this class?
      if (classId) {
        const existingStudents = await Student.find({ workspaceId, name }).select('_id').lean();
        if (existingStudents.length) {
          const ids = existingStudents.map((s) => s._id);
          const already = await ClassStudent.findOne({ classId, studentId: { $in: ids } });
          if (already) { skipped += 1; results.push({ rowNum, name, status: 'skipped', message: 'Already enrolled in this class.' }); continue; }
        }
      }

      await createStudentRecord({
        workspaceId, createdByUserId, name, level: row.level || '',
        classId, email: row.email || '', createLogin: createLogins,
      });
      created += 1;
      results.push({ rowNum, name, status: 'created', message: classId ? 'Created and enrolled.' : 'Created (no class).' });
    } catch (err) {
      failed += 1;
      results.push({ rowNum, name: row.name || '', status: 'error', message: err.message || 'Failed.' });
    }
  }

  return { summary: { total: rows.length, created, skipped, failed }, results };
}

export default {
  generateJoinCodeString,
  parseRosterCsv,
  createJoinCode,
  createStudentRecord,
  importRoster,
};
