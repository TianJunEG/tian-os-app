// AI provider abstraction for the worksheet service. Both Anthropic (Claude) and
// OpenAI (GPT) can drive the same flows; the active provider is chosen from which
// API key is configured. Anthropic stays the default (its prompts/schemas are
// tuned for Claude); OpenAI is used when it is the only key present, or when
// WORKSHEET_AI_PROVIDER explicitly selects it.
//
// Each adapter exposes:
//   isConfigured()  – is its API key set?
//   models()        – { primary, escalation } model ids (env-overridable)
//   complete(opts)  – run one structured call; returns { text, stop } where
//                     stop ∈ 'ok' | 'refusal' | 'truncated' | 'empty'.
//
// Adapters receive messages in the Anthropic content-block shape (text blocks +
// { type:'image', source:{ type:'base64', media_type, data } }); the OpenAI
// adapter translates those into OpenAI content parts. Transport errors carry a
// `.status` from each SDK and are allowed to propagate (routes/worksheets.js
// maps them to safe HTTP responses).
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

let anthropicClient, openaiClient;

// Current OpenAI chat models (gpt-4o / gpt-4o-mini) cap completion tokens at
// 16384. The worksheet flows request more (tuned for Claude's larger ceiling),
// so the OpenAI adapter clamps to this limit — the worksheet outputs (≤18
// questions) fit comfortably within it.
const OPENAI_MAX_OUTPUT_TOKENS = 16384;

// effort + adaptive thinking are only valid on Opus 4.5+/Sonnet 4.6; Haiku 4.5
// rejects them, so omit both there.
const anthropicSupportsTuning = (model) => /claude-(opus-4-(5|6|7)|sonnet-4-6)/.test(model);

const anthropic = {
  name: 'anthropic',
  isConfigured: () => !!process.env.ANTHROPIC_API_KEY,
  models: () => ({
    primary: process.env.WORKSHEET_PRIMARY_MODEL || 'claude-haiku-4-5',
    escalation: process.env.WORKSHEET_ESCALATION_MODEL || 'claude-sonnet-4-6',
  }),
  async complete({ model, system, messages, schema, effort, maxTokens }) {
    anthropicClient ||= new Anthropic();
    const params = {
      model,
      max_tokens: maxTokens,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages,
      output_config: { format: { type: 'json_schema', schema } },
    };
    if (anthropicSupportsTuning(model)) {
      params.thinking = { type: 'adaptive' };
      if (effort) params.output_config.effort = effort;
    }
    const message = await anthropicClient.messages.stream(params).finalMessage();
    if (message.stop_reason === 'refusal') return { stop: 'refusal' };
    if (message.stop_reason === 'max_tokens') return { stop: 'truncated' };
    const block = message.content.find((b) => b.type === 'text');
    return block ? { text: block.text, stop: 'ok' } : { stop: 'empty' };
  },
};

// Translate message content into OpenAI chat form. A plain string passes through
// (both SDKs accept string content); an Anthropic content-block array maps to
// OpenAI text / image_url parts.
const toOpenAiParts = (content) =>
  typeof content === 'string'
    ? content
    : content.map((b) =>
        b.type === 'image'
          ? { type: 'image_url', image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` } }
          : { type: 'text', text: b.text });

const openai = {
  name: 'openai',
  isConfigured: () => !!process.env.OPENAI_API_KEY,
  models: () => ({
    primary: process.env.WORKSHEET_OPENAI_PRIMARY_MODEL || 'gpt-4o-mini',
    escalation: process.env.WORKSHEET_OPENAI_ESCALATION_MODEL || 'gpt-4o',
  }),
  // OpenAI has no Anthropic-style adaptive-thinking knob on these vision models,
  // so `effort` is intentionally ignored here. Structured output is enforced with
  // a strict json_schema (the worksheet schemas already satisfy strict mode).
  async complete({ model, system, messages, schema, maxTokens }) {
    openaiClient ||= new OpenAI();
    const oaMessages = [
      { role: 'system', content: system },
      ...messages.map((m) => ({ role: m.role, content: toOpenAiParts(m.content) })),
    ];
    const resp = await openaiClient.chat.completions.create({
      model,
      max_completion_tokens: Math.min(maxTokens, OPENAI_MAX_OUTPUT_TOKENS),
      messages: oaMessages,
      response_format: { type: 'json_schema', json_schema: { name: 'worksheet', schema, strict: true } },
    });
    const choice = resp.choices?.[0];
    if (choice?.message?.refusal) return { stop: 'refusal' };
    if (choice?.finish_reason === 'length') return { stop: 'truncated' };
    const text = choice?.message?.content;
    return text ? { text, stop: 'ok' } : { stop: 'empty' };
  },
};

const PROVIDERS = { anthropic, openai };

// Pick the provider: an explicit WORKSHEET_AI_PROVIDER override wins; otherwise
// prefer Anthropic and fall back to OpenAI when only its key is present. Throws
// a 503-tagged error when neither is configured (callers surface it safely).
export function getActiveProvider() {
  const forced = (process.env.WORKSHEET_AI_PROVIDER || '').trim().toLowerCase();
  if (forced) {
    const p = PROVIDERS[forced];
    if (!p) { const e = new Error(`Unknown WORKSHEET_AI_PROVIDER "${forced}" (use "anthropic" or "openai").`); e.status = 500; throw e; }
    if (!p.isConfigured()) { const e = new Error(`AI is not configured: the ${forced} API key is missing on the server.`); e.status = 503; throw e; }
    return p;
  }
  if (anthropic.isConfigured()) return anthropic;
  if (openai.isConfigured()) return openai;
  const e = new Error('AI is not configured: set ANTHROPIC_API_KEY or OPENAI_API_KEY on the server.');
  e.status = 503;
  throw e;
}

export { PROVIDERS };
