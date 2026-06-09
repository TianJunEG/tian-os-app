import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const linkFindOne = vi.fn();
const studentFindById = vi.fn();
const recFindById = vi.fn();
const recCreate = vi.fn();
const recDeleteOne = vi.fn();
const inkInsertMany = vi.fn();
const inkFind = vi.fn();
const inkDeleteMany = vi.fn();
const canAccessPartner = vi.fn();
const r2Signed = vi.fn();
const r2Put = vi.fn();
const r2Delete = vi.fn();

function inkChain(items) {
  return { sort: vi.fn().mockResolvedValue(items) };
}

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => { req.user = req.mockUser || { id: 'tutor_1', role: 'tutor' }; next(); },
}));
vi.mock('../middleware/workspace.js', () => ({
  requireWorkspace: (req, _res, next) => { req.workspaceId = 'ws1'; req.workspaceRole = 'tutor'; next(); },
}));
vi.mock('../models/Student.js', () => ({ default: { findById: (...a) => studentFindById(...a) } }));
vi.mock('../models/TutorStudentLink.js', () => ({ default: { findOne: (...a) => linkFindOne(...a) } }));
vi.mock('../models/LessonRecording.js', () => ({
  default: { findById: (...a) => recFindById(...a), create: (...a) => recCreate(...a), deleteOne: (...a) => recDeleteOne(...a) },
}));
vi.mock('../models/LessonInkEvent.js', () => ({
  default: { insertMany: (...a) => inkInsertMany(...a), find: (...a) => inkFind(...a), deleteMany: (...a) => inkDeleteMany(...a) },
}));
vi.mock('../services/partners/partnerAccessService.js', () => ({
  userCanAccessPartnerStudent: (...a) => canAccessPartner(...a),
}));
vi.mock('../services/storage/r2.js', () => ({
  default: { putAudioObject: (...a) => r2Put(...a), getSignedDownloadUrl: (...a) => r2Signed(...a), deleteObject: (...a) => r2Delete(...a) },
}));

let router;
async function request(path, { method = 'GET', body = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = { method: method.toUpperCase(), url: path, path, originalUrl: path, query: {}, body, headers: {}, params: {} };
    const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(p) { resolve({ status: this.statusCode, data: p }); } };
    router.handle(req, res, (e) => e ? reject(e) : resolve({ status: res.statusCode, data: null }));
  });
}

describe('tutor recording routes', () => {
  beforeAll(async () => { router = (await import('./recordings.js')).default; });
  afterEach(() => { vi.clearAllMocks(); canAccessPartner.mockResolvedValue(false); });

  it('creates a recording for a linked student', async () => {
    linkFindOne.mockResolvedValueOnce({ _id: 'link1' });
    studentFindById.mockResolvedValueOnce({ _id: 'stu1', name: 'Sarah' });
    recCreate.mockResolvedValueOnce({ _id: 'rec1', status: 'recording' });
    const res = await request('/', { method: 'POST', body: { studentId: 'stu1' } });
    expect(res.status).toBe(201);
    expect(recCreate).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 'ws1', tutorUserId: 'tutor_1', studentId: 'stu1' }));
  });

  it('rejects creating a recording for an unlinked student', async () => {
    linkFindOne.mockResolvedValueOnce(null);
    canAccessPartner.mockResolvedValueOnce(false);
    const res = await request('/', { method: 'POST', body: { studentId: 'stranger' } });
    expect(res.status).toBe(403);
    expect(recCreate).not.toHaveBeenCalled();
  });

  it('requires studentId on create', async () => {
    const res = await request('/', { method: 'POST', body: {} });
    expect(res.status).toBe(400);
  });

  it('appends ink events', async () => {
    recFindById.mockResolvedValueOnce({ _id: 'rec1', tutorUserId: 'tutor_1', workspaceId: 'ws1' });
    inkInsertMany.mockResolvedValueOnce([]);
    const res = await request('/rec1/ink', { method: 'POST', body: { events: [{ tStartMs: 0, seq: 0, stroke: {} }, { tStartMs: 100, seq: 1, stroke: {} }] } });
    expect(res.status).toBe(200);
    expect(res.data.appended).toBe(2);
  });

  it('finalise sets status ready and an expiry ~30 days out', async () => {
    const rec = { _id: 'rec1', tutorUserId: 'tutor_1', workspaceId: 'ws1', durationMs: 0, pageCount: 1, save: vi.fn().mockResolvedValue(true) };
    recFindById.mockResolvedValueOnce(rec);
    const res = await request('/rec1/finalise', { method: 'POST', body: { durationMs: 5000 } });
    expect(res.status).toBe(200);
    expect(rec.status).toBe('ready');
    const days = (rec.expiresAt.getTime() - Date.now()) / 86400000;
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThan(31);
  });

  it("blocks access to another tutor's recording", async () => {
    recFindById.mockResolvedValueOnce({ _id: 'rec1', tutorUserId: 'other_tutor', workspaceId: 'ws1' });
    const res = await request('/rec1');
    expect(res.status).toBe(404);
  });

  it('returns a manifest with a signed audio url and sorted ink', async () => {
    recFindById.mockResolvedValueOnce({ _id: 'rec1', tutorUserId: 'tutor_1', workspaceId: 'ws1', audioStorageKey: 'recordings/rec1/audio.webm' });
    inkFind.mockReturnValueOnce(inkChain([{ seq: 0 }, { seq: 1 }]));
    r2Signed.mockResolvedValueOnce('https://signed.example/audio');
    const res = await request('/rec1');
    expect(res.status).toBe(200);
    expect(res.data.audioUrl).toBe('https://signed.example/audio');
    expect(res.data.ink).toHaveLength(2);
  });

  it('delete removes audio, ink and the recording', async () => {
    recFindById.mockResolvedValueOnce({ _id: 'rec1', tutorUserId: 'tutor_1', workspaceId: 'ws1', audioStorageKey: 'k' });
    r2Delete.mockResolvedValueOnce(true);
    inkDeleteMany.mockResolvedValueOnce(true);
    recDeleteOne.mockResolvedValueOnce(true);
    const res = await request('/rec1', { method: 'DELETE' });
    expect(res.status).toBe(200);
    expect(r2Delete).toHaveBeenCalledWith('k');
    expect(inkDeleteMany).toHaveBeenCalledWith({ recordingId: 'rec1' });
  });
});
