import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const getAdminBillingOverview = vi.fn();
const getPartnerBillingSummary = vi.fn();
const setBillingSubscription = vi.fn();

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = { id: 'admin_1', role: req.headers?.role || 'admin' };
    next();
  },
  authorize: (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  },
}));

vi.mock('../services/billing/billingAdminService.js', () => ({
  getAdminBillingOverview: (...args) => getAdminBillingOverview(...args),
  getPartnerBillingSummary: (...args) => getPartnerBillingSummary(...args),
  setBillingSubscription: (...args) => setBillingSubscription(...args),
}));

async function loadRouter() {
  const mod = await import('./admin.js');
  return mod.default;
}

async function request(router, path, { method = 'GET', query = {}, body = {}, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method: String(method || 'GET').toUpperCase(),
      url: path,
      path,
      originalUrl: path,
      query,
      body,
      headers,
      params: {},
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
      send(payload) {
        resolve({ status: this.statusCode, data: payload });
      },
    };
    router.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: res.statusCode, data: null });
    });
  });
}

describe('admin billing routes', () => {
  let router;

  beforeAll(async () => {
    router = await loadRouter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns admin billing overview', async () => {
    getAdminBillingOverview.mockResolvedValueOnce({ summary: { owners: 2 }, rows: [] });

    const res = await request(router, '/billing', { query: { ownerType: 'partner' } });

    expect(res.status).toBe(200);
    expect(getAdminBillingOverview).toHaveBeenCalledWith({ ownerType: 'partner', limit: 30 });
    expect(res.data.summary.owners).toBe(2);
  });

  it('blocks billing overview for non-admin users', async () => {
    const res = await request(router, '/billing', { headers: { role: 'parent' } });

    expect(res.status).toBe(403);
    expect(getAdminBillingOverview).not.toHaveBeenCalled();
  });

  it('returns partner billing summary', async () => {
    getPartnerBillingSummary.mockResolvedValueOnce({ ownerId: 'partner_1', plan: { planType: 'centre_pro' } });

    const res = await request(router, '/billing/partner/partner_1');

    expect(res.status).toBe(200);
    expect(getPartnerBillingSummary).toHaveBeenCalledWith('partner_1');
    expect(res.data.billing.plan.planType).toBe('centre_pro');
  });

  it('upserts subscription with pilot override', async () => {
    setBillingSubscription.mockResolvedValueOnce({ ownerId: 'partner_1', status: 'trial' });

    const res = await request(router, '/billing/subscriptions', {
      method: 'POST',
      body: {
        ownerType: 'partner',
        ownerId: 'partner_1',
        planType: 'student_care_pilot',
        pilotOverride: { type: 'free_pilot', reason: 'Paid pilot readiness' },
      },
    });

    expect(res.status).toBe(201);
    expect(setBillingSubscription).toHaveBeenCalledWith(expect.objectContaining({
      ownerType: 'partner',
      ownerId: 'partner_1',
      planType: 'student_care_pilot',
      updatedByUserId: 'admin_1',
      pilotOverride: expect.objectContaining({ type: 'free_pilot' }),
    }));
  });
});
