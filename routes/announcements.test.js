import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const announcement = { findById: vi.fn(), updateOne: vi.fn() };
const comment = { find: vi.fn(), create: vi.fn() };
const canAccessAnnouncement = vi.fn();
const notifyNewComment = vi.fn(() => Promise.resolve());

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => { req.user = { id: 'parent1', role: 'parent' }; next(); },
}));
vi.mock('../models/Announcement.js', () => ({ default: announcement }));
vi.mock('../models/AnnouncementComment.js', () => ({ default: comment }));
vi.mock('../models/StudentGuardian.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../models/ClassStudent.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../models/TutorStudentLink.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../models/User.js', () => ({ default: { findById: () => ({ select: () => Promise.resolve({ name: 'Mum' }) }) } }));
vi.mock('../services/announcements/announcementService.js', () => ({
  canAccessAnnouncement: (...a) => canAccessAnnouncement(...a),
  notifyNewComment: (...a) => notifyNewComment(...a),
  publicAnnouncement: (a) => ({ announcementId: String(a._id), title: a.title }),
  publicComment: (c) => ({ commentId: String(c._id), content: c.content }),
}));

let router;
async function request(path, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const req = { method: method.toUpperCase(), url: path, path, originalUrl: path, query: {}, body: body || {}, headers: {}, params: {} };
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      json(p) { resolve({ status: this.statusCode, data: p }); },
    };
    router.handle(req, res, (e) => (e ? reject(e) : resolve({ status: res.statusCode, data: null })));
  });
}

const A = { _id: 'a1', title: 'Field trip', authorId: 'teacher1', sourceType: 'class', sourceId: 'c1', allowComments: true };

describe('announcements router', () => {
  beforeAll(async () => { router = (await import('./announcements.js')).default; });
  afterEach(() => vi.clearAllMocks());

  it('GET /:id — 404 when missing', async () => {
    announcement.findById.mockResolvedValueOnce(null);
    expect((await request('/a1')).status).toBe(404);
  });

  it('GET /:id — 403 when the user has no access', async () => {
    announcement.findById.mockResolvedValueOnce(A);
    canAccessAnnouncement.mockResolvedValueOnce(false);
    expect((await request('/a1')).status).toBe(403);
  });

  it('GET /:id — 200 + comments when allowed', async () => {
    announcement.findById.mockResolvedValueOnce(A);
    canAccessAnnouncement.mockResolvedValueOnce(true);
    comment.find.mockReturnValueOnce({ sort: () => ({ lean: () => Promise.resolve([{ _id: 'm1', content: 'Thanks!' }]) }) });
    const res = await request('/a1');
    expect(res.status).toBe(200);
    expect(res.data.comments).toEqual([{ commentId: 'm1', content: 'Thanks!' }]);
  });

  it('POST /:id/comments — 403 when comments are off', async () => {
    announcement.findById.mockResolvedValueOnce({ ...A, allowComments: false });
    const res = await request('/a1/comments', { method: 'POST', body: { content: 'Hi' } });
    expect(res.status).toBe(403);
  });

  it('POST /:id/comments — 403 when no access', async () => {
    announcement.findById.mockResolvedValueOnce(A);
    canAccessAnnouncement.mockResolvedValueOnce(false);
    const res = await request('/a1/comments', { method: 'POST', body: { content: 'Hi' } });
    expect(res.status).toBe(403);
  });

  it('POST /:id/comments — 400 on empty content', async () => {
    announcement.findById.mockResolvedValueOnce(A);
    canAccessAnnouncement.mockResolvedValueOnce(true);
    const res = await request('/a1/comments', { method: 'POST', body: { content: '   ' } });
    expect(res.status).toBe(400);
  });

  it('POST /:id/comments — 201 creates + notifies', async () => {
    announcement.findById.mockResolvedValueOnce(A);
    canAccessAnnouncement.mockResolvedValueOnce(true);
    announcement.updateOne.mockResolvedValue({});
    comment.create.mockResolvedValueOnce({ _id: 'm2', content: 'Looks great' });
    const res = await request('/a1/comments', { method: 'POST', body: { content: 'Looks great' } });
    expect(res.status).toBe(201);
    expect(comment.create).toHaveBeenCalled();
    expect(notifyNewComment).toHaveBeenCalled();
  });
});
