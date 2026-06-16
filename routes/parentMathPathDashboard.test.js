import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const resolveStudentMock = vi.fn();
const hasDomainMock = vi.fn();
const buildDashboardMock = vi.fn();
const listDomainsMock = vi.fn();

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = req.mockUser || { id: 'parent_1', role: 'parent' };
    next();
  },
}));

vi.mock('../utils/studentContext.js', () => ({
  resolveStudent: (...args) => resolveStudentMock(...args),
}));

vi.mock('../services/domains/domainRegistry.js', () => ({
  hasDomain: (...args) => hasDomainMock(...args),
}));

vi.mock('../services/mathpath/parentDashboardAggregator.js', () => ({
  buildParentMathPathDashboard: (...args) => buildDashboardMock(...args),
  listChildMathPathDomains: (...args) => listDomainsMock(...args),
}));

let router;

async function request(path, { query = {}, user } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method: 'GET',
      url: path,
      path,
      originalUrl: path,
      query,
      body: {},
      headers: {},
      params: {},
      mockUser: user,
    };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, data: payload }); },
    };
    router.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: res.statusCode, data: null });
    });
  });
}

describe('parent MathPath dashboard routes', () => {
  beforeAll(async () => {
    const mod = await import('./parentMathPathDashboard.js');
    router = mod.default;
  });

  afterEach(() => { vi.clearAllMocks(); });

  it('blocks dashboard data for an unrelated child before touching the domain', async () => {
    resolveStudentMock.mockRejectedValueOnce({ status: 403, message: 'No access to this student.' });

    const res = await request('/unrelated_child/mathpath/dashboard', { query: { domainId: 'fractions' } });

    expect(res.status).toBe(403);
    expect(res.data.error).toBe('No access to this student.');
    expect(hasDomainMock).not.toHaveBeenCalled();
    expect(buildDashboardMock).not.toHaveBeenCalled();
  });

  it('returns 404 DOMAIN_NOT_FOUND for an unregistered domain', async () => {
    resolveStudentMock.mockResolvedValueOnce({ _id: 'stu_1' });
    hasDomainMock.mockReturnValueOnce(false);

    const res = await request('/stu_1/mathpath/dashboard', { query: { domainId: 'klingon' } });

    expect(res.status).toBe(404);
    expect(res.data.code).toBe('DOMAIN_NOT_FOUND');
    expect(buildDashboardMock).not.toHaveBeenCalled();
  });

  it('defaults to the fractions domain and returns the aggregated payload', async () => {
    resolveStudentMock.mockResolvedValueOnce({ _id: 'stu_1' });
    hasDomainMock.mockReturnValueOnce(true);
    buildDashboardMock.mockResolvedValueOnce({ domainId: 'fractions', overallStatus: 'developing' });

    const res = await request('/stu_1/mathpath/dashboard');

    expect(res.status).toBe(200);
    expect(res.data.domainId).toBe('fractions');
    expect(hasDomainMock).toHaveBeenCalledWith({ subjectId: 'math', domainId: 'fractions' });
    expect(buildDashboardMock).toHaveBeenCalledWith({ student: { _id: 'stu_1' }, subjectId: 'math', domainId: 'fractions' });
  });

  it('passes a non-fractions domain through to the aggregator', async () => {
    resolveStudentMock.mockResolvedValueOnce({ _id: 'stu_1' });
    hasDomainMock.mockReturnValueOnce(true);
    buildDashboardMock.mockResolvedValueOnce({ domainId: 'percentage' });

    const res = await request('/stu_1/mathpath/dashboard', { query: { domainId: 'percentage' } });

    expect(res.status).toBe(200);
    expect(res.data.domainId).toBe('percentage');
    expect(buildDashboardMock).toHaveBeenCalledWith({ student: { _id: 'stu_1' }, subjectId: 'math', domainId: 'percentage' });
  });

  it('lists only the domains the child has activity in', async () => {
    resolveStudentMock.mockResolvedValueOnce({ _id: 'stu_1' });
    listDomainsMock.mockResolvedValueOnce([
      { subjectId: 'math', domainId: 'fractions', displayName: 'MathPath Fractions', friendlyName: 'Fractions', hasActivity: true },
    ]);

    const res = await request('/stu_1/mathpath/domains');

    expect(res.status).toBe(200);
    expect(res.data.domains).toHaveLength(1);
    expect(res.data.domains[0].domainId).toBe('fractions');
  });

  it('blocks the domains listing for an unrelated child', async () => {
    resolveStudentMock.mockRejectedValueOnce({ status: 403, message: 'No access to this student.' });

    const res = await request('/unrelated_child/mathpath/domains');

    expect(res.status).toBe(403);
    expect(listDomainsMock).not.toHaveBeenCalled();
  });
});
