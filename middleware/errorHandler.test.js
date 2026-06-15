// Verifies the global error handler maps Multer upload errors to friendly 400s.
// Regression guard: multer 2.x emits 'LIMIT_FILE_SIZE' (not 'FILE_TOO_LARGE')
// for oversized uploads — using the wrong code makes that branch dead and lets
// oversized files fall through to the generic 500.
import { describe, it, expect } from 'vitest';
import multer from 'multer';
import { errorHandler } from './errorHandler.js';

// Minimal Express req/res doubles.
function makeReqRes() {
  const req = { path: '/upload', method: 'POST' };
  const res = {
    statusCode: 200, body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  return { req, res };
}

describe('errorHandler — Multer upload errors', () => {
  it('returns 400 with a "too large" message for an oversized file', () => {
    const { req, res } = makeReqRes();
    // The error multer actually throws when a file exceeds the size limit.
    const err = new multer.MulterError('LIMIT_FILE_SIZE', 'photo');

    errorHandler(err, req, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/too large/i);
  });

  it('returns 400 with a "too many files" message when the file count limit is hit', () => {
    const { req, res } = makeReqRes();
    const err = new multer.MulterError('LIMIT_FILE_COUNT', 'photos');

    errorHandler(err, req, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/too many files/i);
  });
});
