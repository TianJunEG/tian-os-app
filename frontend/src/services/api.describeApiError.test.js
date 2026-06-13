import { describe, expect, it } from 'vitest';
import { describeApiError } from './api.js';

describe('describeApiError (consistent user-facing API error messages)', () => {
  it('prefers the server-provided message for a 400', () => {
    expect(describeApiError({ response: { status: 400, data: { error: 'Skill is required.' } } }))
      .toBe('Skill is required.');
  });

  it('falls back to a friendly message for a 400 with no server message', () => {
    expect(describeApiError({ response: { status: 400, data: {} } }))
      .toMatch(/go through/i);
  });

  it('reports an expired session for 401', () => {
    expect(describeApiError({ response: { status: 401 } })).toMatch(/session has expired/i);
  });

  it('reports no access for 403', () => {
    expect(describeApiError({ response: { status: 403 } })).toMatch(/access/i);
  });

  it('reports rate-limiting for 429', () => {
    expect(describeApiError({ response: { status: 429 } })).toMatch(/going a bit fast/i);
  });

  it('reports a server-side problem for any 5xx', () => {
    expect(describeApiError({ response: { status: 500 } })).toMatch(/our end/i);
    expect(describeApiError({ response: { status: 503 } })).toMatch(/our end/i);
  });

  it('reports a timeout for ECONNABORTED', () => {
    expect(describeApiError({ code: 'ECONNABORTED' })).toMatch(/took too long/i);
  });

  it('reports a connectivity problem when there is no response (network error)', () => {
    expect(describeApiError({ message: 'Network Error' })).toMatch(/reach the server/i);
  });
});
