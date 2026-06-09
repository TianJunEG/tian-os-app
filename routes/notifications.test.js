import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const notificationFind = vi.fn();
const notificationCountDocuments = vi.fn();
const notificationFindOneAndUpdate = vi.fn();

function findChain(items) {
  return {
    sort: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue(items),
    }),
  };
}

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = req.mockUser || { id: 'parent_1', role: 'parent' };
    next();
  },
}));

vi.mock('../models/Notification.js', () => ({
  default: {
    find: (...args) => notificationFind(...args),
    countDocuments: (...args) => notificationCountDocuments(...args),
    findOneAndUpdate: (...args) => notificationFindOneAndUpdate(...args),
  },
}));

let router;

async function request(path, { method = 'GET', body = {}, query = {}, user } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method: String(method).toUpperCase(),
      url: path,
      path,
      originalUrl: path,
      query,
      body,
      headers: {},
      params: {},
      mockUser: user,
    };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ status: this.statusCode, data: payload });
      },
    };
    router.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: res.statusCode, data: null });
    });
  });
}

describe('notifications routes', () => {
  beforeAll(async () => {
    const mod = await import('./notifications.js');
    router = mod.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists only the caller\'s notifications, newest first', async () => {
    notificationFind.mockReturnValueOnce(findChain([{ _id: 'n1', title: 'Hi' }]));

    const res = await request('/');

    expect(res.status).toBe(200);
    expect(notificationFind).toHaveBeenCalledWith({ recipientUserId: 'parent_1' });
    expect(res.data.notifications).toHaveLength(1);
  });

  it('returns the unread count for the caller', async () => {
    notificationCountDocuments.mockResolvedValueOnce(4);

    const res = await request('/unread-count');

    expect(res.status).toBe(200);
    expect(notificationCountDocuments).toHaveBeenCalledWith({
      recipientUserId: 'parent_1',
      readAt: null,
    });
    expect(res.data.count).toBe(4);
  });

  it('marks a notification read', async () => {
    notificationFindOneAndUpdate.mockResolvedValueOnce({ _id: 'n1', readAt: new Date() });

    const res = await request('/n1/read', { method: 'POST' });

    expect(res.status).toBe(200);
    expect(notificationFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'n1', recipientUserId: 'parent_1' },
      { $set: { readAt: expect.any(Date) } },
      { new: true }
    );
    expect(res.data.notification._id).toBe('n1');
  });

  it('returns 404 (not 403) when marking another user\'s notification read', async () => {
    notificationFindOneAndUpdate.mockResolvedValueOnce(null);

    const res = await request('/someone_elses/read', { method: 'POST' });

    expect(res.status).toBe(404);
    expect(res.data.error).toMatch(/not found/i);
  });
});
