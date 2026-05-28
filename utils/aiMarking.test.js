// AI marking for open-ended Science answers (utils/aiMarking.js). Mocks the
// provider abstraction directly so we exercise the marking-specific logic
// (escalation predicate, blank-answer short-circuit, fallback semantics)
// without re-testing the provider transport.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const h = vi.hoisted(() => ({
  primary: 'mock-primary', escalation: 'mock-escalation',
  configured: true,
  // Each call to `complete` shifts one entry off this queue.
  queue: [],
  calls: [],
}));

vi.mock('./aiProvider.js', () => ({
  getActiveProvider: () => {
    if (!h.configured) {
      const e = new Error('no provider configured (test)');
      e.status = 503;
      throw e;
    }
    return {
      models: () => ({ primary: h.primary, escalation: h.escalation }),
      complete: async (opts) => {
        h.calls.push(opts);
        const next = h.queue.shift();
        if (!next) throw new Error('test queue empty — enqueue a response');
        if (next instanceof Error) throw next;
        return next;
      },
    };
  },
}));

import { markOpenEnded } from './aiMarking.js';

beforeEach(() => { h.queue = []; h.calls = []; h.configured = true; });

const enqueue = (obj, stop = 'ok') => h.queue.push({ text: JSON.stringify(obj), stop });

describe('markOpenEnded', () => {
  it('returns null when no provider is configured (lets callers fall back)', async () => {
    h.configured = false;
    const r = await markOpenEnded({ question: 'q', modelAnswer: 'a', keyPoints: ['k'], studentAnswer: 'something' });
    expect(r).toBeNull();
  });

  it('short-circuits a blank answer without burning a model call', async () => {
    const r = await markOpenEnded({ question: 'q', modelAnswer: 'a', keyPoints: ['k1', 'k2'], studentAnswer: '   ' });
    expect(r.correct).toBe(false);
    expect(r.partial).toBe(false);
    expect(r.missing).toEqual(['k1', 'k2']);
    expect(r.feedback).toMatch(/Have a go/i);
    expect(h.calls).toHaveLength(0);
  });

  it('high-confidence correct answer returns single primary call', async () => {
    enqueue({ correct: true, partial: false, missing: [], feedback: 'Nice work! All the key ideas are there.', confidence: 'high' });
    const r = await markOpenEnded({ question: 'Why do plants need sunlight?', modelAnswer: 'For photosynthesis to make food', keyPoints: ['photosynthesis', 'food|sugar'], studentAnswer: 'Plants need sunlight for photosynthesis to make their own food.' });
    expect(r.correct).toBe(true);
    expect(r.partial).toBe(false);
    expect(r.missing).toEqual([]);
    expect(r.aiFeedback).toMatch(/Nice work/);
    expect(r.modelUsed).toBe(h.primary);
    expect(r.escalated).toBe(false);
    expect(h.calls).toHaveLength(1);
    expect(h.calls[0].model).toBe(h.primary);
  });

  it('partial result keeps partial=true and lists what is missing', async () => {
    enqueue({ correct: false, partial: true, missing: ['oxygen exchange'], feedback: 'Good start — also mention how oxygen and CO2 swap in the alveoli.', confidence: 'high' });
    const r = await markOpenEnded({ question: 'Describe gas exchange', modelAnswer: '…', keyPoints: ['alveoli', 'oxygen exchange'], studentAnswer: 'Air goes into the alveoli.' });
    expect(r.correct).toBe(false);
    expect(r.partial).toBe(true);
    expect(r.missing).toEqual(['oxygen exchange']);
    expect(r.escalated).toBe(false);
  });

  it('escalates to the stronger model when confidence is low', async () => {
    enqueue({ correct: false, partial: true, missing: ['x'], feedback: 'Hmm, borderline — looking again.', confidence: 'low' });
    enqueue({ correct: true, partial: false, missing: [], feedback: 'On second read this does cover the idea.', confidence: 'high' });
    const r = await markOpenEnded({ question: 'q', modelAnswer: 'a', keyPoints: ['x'], studentAnswer: 'borderline answer' });
    expect(r.correct).toBe(true);
    expect(r.escalated).toBe(true);
    expect(r.modelUsed).toBe(h.escalation);
    expect(h.calls).toHaveLength(2);
    expect(h.calls[0].model).toBe(h.primary);
    expect(h.calls[1].model).toBe(h.escalation);
  });

  it('coerces correct + partial mutually exclusive even if the model returns both', async () => {
    enqueue({ correct: true, partial: true, missing: [], feedback: 'ok', confidence: 'high' });
    const r = await markOpenEnded({ question: 'q', modelAnswer: 'a', keyPoints: [], studentAnswer: 'x' });
    expect(r.correct).toBe(true);
    expect(r.partial).toBe(false);
  });

  it('propagates parse errors (caller decides whether to fall back)', async () => {
    h.queue.push({ text: 'not json', stop: 'ok' });
    await expect(markOpenEnded({ question: 'q', modelAnswer: 'a', keyPoints: ['k'], studentAnswer: 'x' })).rejects.toThrow(/parse/i);
  });
});
