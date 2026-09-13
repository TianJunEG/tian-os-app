import { describe, it, expect, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { mintAttemptToken, requireAttemptToken } from './kioskAuth.js';

beforeAll(() => { process.env.JWT_SECRET = 'test-secret-kiosk'; });

function mockRes() {
  return {
    statusCode: 0,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

describe('kiosk attempt token', () => {
  it('mints a token bound to sid/stu/cds and verifies it', () => {
    const { token, jti } = mintAttemptToken({ diagnosticSessionId: 'diag_1', studentId: 'stu_1', classDiagSessionId: 'cds_1' });
    expect(typeof token).toBe('string');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.kiosk).toBe(true);
    expect(decoded.sid).toBe('diag_1');
    expect(decoded.stu).toBe('stu_1');
    expect(decoded.cds).toBe('cds_1');
    expect(decoded.jti).toBe(jti);
  });

  it('accepts a valid token and sets req.kiosk', () => {
    const { token } = mintAttemptToken({ diagnosticSessionId: 'd', studentId: 's', classDiagSessionId: 'c' });
    const req = { headers: { 'x-attempt-token': token } };
    const res = mockRes();
    let nextCalled = false;
    requireAttemptToken(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(req.kiosk.stu).toBe('s');
  });

  it('rejects a missing token (401)', () => {
    const res = mockRes();
    requireAttemptToken({ headers: {} }, res, () => {});
    expect(res.statusCode).toBe(401);
  });

  it('rejects a garbage token (401)', () => {
    const res = mockRes();
    requireAttemptToken({ headers: { 'x-attempt-token': 'not-a-jwt' } }, res, () => {});
    expect(res.statusCode).toBe(401);
  });

  it('rejects a normal user JWT (not a kiosk token)', () => {
    const userToken = jwt.sign({ id: 'u1', role: 'student' }, process.env.JWT_SECRET);
    const req = { headers: { 'x-attempt-token': userToken } };
    const res = mockRes();
    let nextCalled = false;
    requireAttemptToken(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/not a kiosk token/i);
  });

  it('rejects an expired token (401)', () => {
    const expired = jwt.sign({ kiosk: true, sid: 'd', stu: 's', cds: 'c' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = mockRes();
    requireAttemptToken({ headers: { 'x-attempt-token': expired } }, res, () => {});
    expect(res.statusCode).toBe(401);
  });
});
