// AI worksheet service (utils/aiService.js) — pure logic, no live API key.
// The @anthropic-ai/sdk client is mocked: each test enqueues the "final message"
// the model would return (or an error), and we assert how aiService validates
// input, maps stop-reasons/parse failures to HTTP statuses, gates model tuning
// (effort/thinking) by model, and escalates from the cheap to the strong model.
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// Shared mock state, hoisted so the vi.mock factory can close over it.
const h = vi.hoisted(() => ({ state: { calls: [], queue: [] } }));

vi.mock('@anthropic-ai/sdk', () => {
  function Anthropic() {
    return {
      messages: {
        stream: (params) => {
          h.state.calls.push(params);
          return {
            finalMessage: async () => {
              const next = h.state.queue.shift();
              if (next instanceof Error) throw next;
              if (!next) throw new Error('test queue empty — enqueue a message');
              return next;
            },
          };
        },
      },
    };
  }
  return { default: Anthropic };
});

// A successful structured response: one text block holding JSON.
const ok = (obj, stop_reason = 'end_turn') => ({ stop_reason, content: [{ type: 'text', text: JSON.stringify(obj) }] });

let svc;
beforeAll(async () => {
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
  process.env.WORKSHEET_PRIMARY_MODEL = 'claude-haiku-4-5';
  process.env.WORKSHEET_ESCALATION_MODEL = 'claude-sonnet-4-6';
  delete process.env.WORKSHEET_AI_PROVIDER; // auto-select → Anthropic (key present)
  delete process.env.OPENAI_API_KEY;
  svc = await import('./aiService.js');
});
beforeEach(() => { h.state.calls = []; h.state.queue = []; });

describe('configuration & input guards', () => {
  it('throws 503 when no provider key is configured', async () => {
    const savedA = process.env.ANTHROPIC_API_KEY, savedO = process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    await expect(svc.generateReinforcement({ topic: 'fractions', misconceptions: [] }))
      .rejects.toMatchObject({ status: 503 });
    expect(h.state.calls).toHaveLength(0); // never reached the model
    process.env.ANTHROPIC_API_KEY = savedA;
    if (savedO === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = savedO;
  });

  it('rejects an unsupported image type with 400 before calling the model', async () => {
    await expect(svc.analyzeAndGenerateWorksheet({ imageBase64: 'x', mimeType: 'image/tiff', numQuestions: 10 }))
      .rejects.toMatchObject({ status: 400 });
    expect(h.state.calls).toHaveLength(0);
  });

  it('rejects empty mark batches with 400', async () => {
    await expect(svc.markAnswers({ items: [] })).rejects.toMatchObject({ status: 400 });
  });
});

describe('callStructured — response handling (via generateReinforcement)', () => {
  it('parses a successful structured response', async () => {
    const qs = [{ prompt: '2+2', answer: '4', workedSolution: '2+2=4', targetsMisconception: 'x', difficulty: 'easier' }];
    h.state.queue.push(ok({ questions: qs }));
    const out = await svc.generateReinforcement({ topic: 'addition', misconceptions: [] });
    expect(out).toEqual(qs);
  });

  it('maps a refusal stop_reason to 422', async () => {
    h.state.queue.push({ stop_reason: 'refusal', content: [] });
    await expect(svc.generateReinforcement({ topic: 't', misconceptions: [] })).rejects.toMatchObject({ status: 422 });
  });

  it('maps a max_tokens cutoff to 502', async () => {
    h.state.queue.push({ stop_reason: 'max_tokens', content: [{ type: 'text', text: '{}' }] });
    await expect(svc.generateReinforcement({ topic: 't', misconceptions: [] })).rejects.toMatchObject({ status: 502 });
  });

  it('maps a missing text block to 502', async () => {
    h.state.queue.push({ stop_reason: 'end_turn', content: [{ type: 'tool_use' }] });
    await expect(svc.generateReinforcement({ topic: 't', misconceptions: [] })).rejects.toMatchObject({ status: 502 });
  });

  it('maps unparseable JSON to 502', async () => {
    h.state.queue.push({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'not json at all' }] });
    await expect(svc.generateReinforcement({ topic: 't', misconceptions: [] })).rejects.toMatchObject({ status: 502 });
  });
});

describe('model tuning (effort / adaptive thinking) is gated by model', () => {
  it('omits thinking and effort on the cheap haiku model', async () => {
    h.state.queue.push(ok({ questions: [] }));
    await svc.generateReinforcement({ topic: 't', misconceptions: [], numQuestions: 6 });
    const params = h.state.calls[0];
    expect(params.model).toBe('claude-haiku-4-5');
    expect(params.thinking).toBeUndefined();
    expect(params.output_config.effort).toBeUndefined();
    expect(params.output_config.format.type).toBe('json_schema');
  });
});

describe('escalation from cheap to strong model', () => {
  it('escalates when the marker reports it needs a better model', async () => {
    h.state.queue.push(ok({ needsBetterModel: true, results: [{ index: 0, correct: false, readAs: '?', feedback: 'try again' }] }));
    h.state.queue.push(ok({ needsBetterModel: false, results: [{ index: 0, correct: true, readAs: '4', feedback: 'nice' }] }));
    const out = await svc.markAnswers({ items: [{ index: 0, type: 'text', prompt: '2+2', correctAnswer: '4', text: '4' }] });
    expect(out.escalated).toBe(true);
    expect(out.modelUsed).toBe('claude-sonnet-4-6');
    expect(h.state.calls).toHaveLength(2);
    // the escalation model supports tuning, so the 2nd call carries thinking + effort
    expect(h.state.calls[1].model).toBe('claude-sonnet-4-6');
    expect(h.state.calls[1].thinking).toEqual({ type: 'adaptive' });
    expect(h.state.calls[1].output_config.effort).toBe('medium');
  });

  it('does not escalate when the cheap model is confident', async () => {
    h.state.queue.push(ok({ needsBetterModel: false, results: [{ index: 0, correct: true, readAs: '4', feedback: 'nice' }] }));
    const out = await svc.markAnswers({ items: [{ index: 0, type: 'text', prompt: '2+2', correctAnswer: '4', text: '4' }] });
    expect(out.escalated).toBe(false);
    expect(out.modelUsed).toBe('claude-haiku-4-5');
    expect(h.state.calls).toHaveLength(1);
  });

  it('analyzeAndGenerateWorksheet escalates when handwriting is unclear', async () => {
    h.state.queue.push(ok({ topic: 'frac', overallSummary: 's', readable: true, handwritingClear: false, misconceptions: [], skillsToReinforce: [], questions: [] }));
    h.state.queue.push(ok({ topic: 'frac', overallSummary: 's', readable: true, handwritingClear: true, misconceptions: [], skillsToReinforce: [], questions: [] }));
    const out = await svc.analyzeAndGenerateWorksheet({ imageBase64: 'abc', mimeType: 'image/png', numQuestions: 10 });
    expect(out.escalated).toBe(true);
    expect(out.modelUsed).toBe('claude-sonnet-4-6');
    expect(out.handwritingClear).toBe(true); // result carries the escalated payload
  });
});

describe('request shaping', () => {
  it('clamps the question count into [6, 18]', async () => {
    h.state.queue.push(ok({ topic: 't', overallSummary: 's', readable: true, handwritingClear: true, misconceptions: [], skillsToReinforce: [], questions: [] }));
    await svc.analyzeAndGenerateWorksheet({ imageBase64: 'abc', mimeType: 'image/jpeg', numQuestions: 100 });
    const instructionText = h.state.calls[0].messages[0].content.find((c) => c.type === 'text').text;
    expect(instructionText).toMatch(/exactly 18 practice questions/);
  });

  it('attaches the photo as a base64 image block', async () => {
    h.state.queue.push(ok({ topic: 't', overallSummary: 's', readable: true, handwritingClear: true, misconceptions: [], skillsToReinforce: [], questions: [] }));
    await svc.analyzeAndGenerateWorksheet({ imageBase64: 'PHOTODATA', mimeType: 'image/jpg', numQuestions: 8 });
    const imageBlock = h.state.calls[0].messages[0].content.find((c) => c.type === 'image');
    expect(imageBlock.source).toMatchObject({ type: 'base64', media_type: 'image/jpeg', data: 'PHOTODATA' });
  });

  it('marks typed answers as text and image answers as image blocks', async () => {
    h.state.queue.push(ok({ needsBetterModel: false, results: [] }));
    await svc.markAnswers({ items: [
      { index: 0, type: 'text', prompt: 'q0', correctAnswer: '1', text: 'one' },
      { index: 1, type: 'image', prompt: 'q1', correctAnswer: '2', imageBase64: 'IMG', mimeType: 'image/png' },
    ] });
    const content = h.state.calls[0].messages[0].content;
    expect(content.some((c) => c.type === 'text' && /Student typed for item 0: one/.test(c.text))).toBe(true);
    expect(content.some((c) => c.type === 'image' && c.source.data === 'IMG')).toBe(true);
  });
});
