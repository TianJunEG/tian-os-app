// AI provider abstraction (utils/aiProvider.js): provider selection + the OpenAI
// adapter, exercised through the worksheet service. The openai SDK is mocked
// (no key, no spend); we enqueue the chat-completion each call should return and
// assert request translation (Anthropic blocks → OpenAI parts, strict json_schema),
// finish_reason → status mapping, escalation, and key-based provider choice.
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

const h = vi.hoisted(() => ({ state: { calls: [], queue: [] } }));

// Mock both SDKs: OpenAI is the one under test; Anthropic is stubbed so an
// accidental selection can't reach the real client.
vi.mock('openai', () => ({
  default: function OpenAI() {
    return {
      chat: {
        completions: {
          create: async (params) => {
            h.state.calls.push(params);
            const next = h.state.queue.shift();
            if (next instanceof Error) throw next;
            if (!next) throw new Error('test queue empty — enqueue a completion');
            return next;
          },
        },
      },
    };
  },
}));
vi.mock('@anthropic-ai/sdk', () => ({ default: function Anthropic() { return { messages: { stream: () => ({ finalMessage: async () => ({}) }) } }; } }));

// An OpenAI chat completion carrying structured JSON in message.content.
const oaOk = (obj, finish_reason = 'stop') => ({ choices: [{ finish_reason, message: { content: JSON.stringify(obj), refusal: null } }] });

let svc, prov;
beforeAll(async () => {
  process.env.OPENAI_API_KEY = 'sk-openai-test';
  process.env.WORKSHEET_AI_PROVIDER = 'openai';
  delete process.env.WORKSHEET_OPENAI_PRIMARY_MODEL;
  delete process.env.WORKSHEET_OPENAI_ESCALATION_MODEL;
  prov = await import('./aiProvider.js');
  svc = await import('./aiService.js');
});
beforeEach(() => { h.state.calls = []; h.state.queue = []; });

describe('getActiveProvider — selection by configured key', () => {
  const snap = () => ({ a: process.env.ANTHROPIC_API_KEY, o: process.env.OPENAI_API_KEY, f: process.env.WORKSHEET_AI_PROVIDER });
  const restore = (s) => {
    s.a === undefined ? delete process.env.ANTHROPIC_API_KEY : (process.env.ANTHROPIC_API_KEY = s.a);
    s.o === undefined ? delete process.env.OPENAI_API_KEY : (process.env.OPENAI_API_KEY = s.o);
    s.f === undefined ? delete process.env.WORKSHEET_AI_PROVIDER : (process.env.WORKSHEET_AI_PROVIDER = s.f);
  };

  it('prefers Anthropic when both keys are present and nothing is forced', () => {
    const s = snap(); delete process.env.WORKSHEET_AI_PROVIDER;
    process.env.ANTHROPIC_API_KEY = 'sk-ant-x'; process.env.OPENAI_API_KEY = 'sk-openai-x';
    expect(prov.getActiveProvider().name).toBe('anthropic');
    restore(s);
  });

  it('falls back to OpenAI when only its key is present', () => {
    const s = snap(); delete process.env.WORKSHEET_AI_PROVIDER;
    delete process.env.ANTHROPIC_API_KEY; process.env.OPENAI_API_KEY = 'sk-openai-x';
    expect(prov.getActiveProvider().name).toBe('openai');
    restore(s);
  });

  it('throws 503 when neither key is configured', () => {
    const s = snap(); delete process.env.WORKSHEET_AI_PROVIDER;
    delete process.env.ANTHROPIC_API_KEY; delete process.env.OPENAI_API_KEY;
    expect(() => prov.getActiveProvider()).toThrowError(/not configured/);
    try { prov.getActiveProvider(); } catch (e) { expect(e.status).toBe(503); }
    restore(s);
  });

  it('honours an explicit WORKSHEET_AI_PROVIDER override', () => {
    const s = snap();
    process.env.WORKSHEET_AI_PROVIDER = 'openai';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-x'; process.env.OPENAI_API_KEY = 'sk-openai-x';
    expect(prov.getActiveProvider().name).toBe('openai'); // OpenAI even though Anthropic is set
    restore(s);
  });

  it('throws 503 when the forced provider has no key, and 500 for an unknown one', () => {
    const s = snap();
    process.env.WORKSHEET_AI_PROVIDER = 'openai'; delete process.env.OPENAI_API_KEY;
    try { prov.getActiveProvider(); } catch (e) { expect(e.status).toBe(503); }
    process.env.WORKSHEET_AI_PROVIDER = 'gemini';
    try { prov.getActiveProvider(); } catch (e) { expect(e.status).toBe(500); }
    restore(s);
  });
});

describe('OpenAI adapter via the worksheet flow', () => {
  beforeEach(() => { process.env.OPENAI_API_KEY = 'sk-openai-test'; process.env.WORKSHEET_AI_PROVIDER = 'openai'; });

  it('uses the cheap model + strict json_schema and parses the result', async () => {
    const qs = [{ prompt: '2+2', answer: '4', workedSolution: '2+2=4', targetsMisconception: 'x', difficulty: 'easier' }];
    h.state.queue.push(oaOk({ questions: qs }));
    const out = await svc.generateReinforcement({ topic: 'addition', misconceptions: [], numQuestions: 6 });
    expect(out).toEqual(qs);
    const p = h.state.calls[0];
    expect(p.model).toBe('gpt-4o-mini');
    expect(p.messages[0].role).toBe('system');
    expect(p.response_format).toMatchObject({ type: 'json_schema', json_schema: { strict: true } });
    expect(typeof p.max_completion_tokens).toBe('number');
  });

  it('maps finish_reason "length" to 502 and a refusal to 422', async () => {
    h.state.queue.push(oaOk({ questions: [] }, 'length'));
    await expect(svc.generateReinforcement({ topic: 't', misconceptions: [] })).rejects.toMatchObject({ status: 502 });
    h.state.queue.push({ choices: [{ finish_reason: 'stop', message: { refusal: 'cannot help', content: null } }] });
    await expect(svc.generateReinforcement({ topic: 't', misconceptions: [] })).rejects.toMatchObject({ status: 422 });
  });

  it('maps empty content to 502', async () => {
    h.state.queue.push({ choices: [{ finish_reason: 'stop', message: { content: null, refusal: null } }] });
    await expect(svc.generateReinforcement({ topic: 't', misconceptions: [] })).rejects.toMatchObject({ status: 502 });
  });

  it('translates the photo into an OpenAI image_url data URL', async () => {
    h.state.queue.push(oaOk({ topic: 't', overallSummary: 's', readable: true, handwritingClear: true, misconceptions: [], skillsToReinforce: [], questions: [] }));
    await svc.analyzeAndGenerateWorksheet({ imageBase64: 'PHOTO', mimeType: 'image/png', numQuestions: 8 });
    const userMsg = h.state.calls[0].messages.find((m) => m.role === 'user');
    const img = userMsg.content.find((c) => c.type === 'image_url');
    expect(img.image_url.url).toBe('data:image/png;base64,PHOTO');
  });

  it('escalates from the cheap to the strong OpenAI model when handwriting is unclear', async () => {
    h.state.queue.push(oaOk({ topic: 't', overallSummary: 's', readable: true, handwritingClear: false, misconceptions: [], skillsToReinforce: [], questions: [] }));
    h.state.queue.push(oaOk({ topic: 't', overallSummary: 's', readable: true, handwritingClear: true, misconceptions: [], skillsToReinforce: [], questions: [] }));
    const out = await svc.analyzeAndGenerateWorksheet({ imageBase64: 'PHOTO', mimeType: 'image/jpeg', numQuestions: 8 });
    expect(out.escalated).toBe(true);
    expect(out.modelUsed).toBe('gpt-4o');
    expect(h.state.calls.map((c) => c.model)).toEqual(['gpt-4o-mini', 'gpt-4o']);
  });

  it('marks typed answers as text parts', async () => {
    h.state.queue.push(oaOk({ needsBetterModel: false, results: [{ index: 0, correct: true, readAs: '4', feedback: 'nice' }] }));
    await svc.markAnswers({ items: [{ index: 0, type: 'text', prompt: '2+2', correctAnswer: '4', text: 'four' }] });
    const parts = h.state.calls[0].messages.find((m) => m.role === 'user').content;
    expect(parts.some((c) => c.type === 'text' && /Student typed for item 0: four/.test(c.text))).toBe(true);
  });
});
