// AI marking for open-ended Science answers — primary (cheap) model judges
// the student's response against the canonical model answer + required key
// points, escalating to the stronger model only on low confidence. Uses the
// existing provider abstraction so it works against either Anthropic or
// OpenAI depending on which API key is configured.
//
// Returns the same shape callers got from utils/answerCheck.js → checkKeyPoints
// (so practice.js can plug it in with minimal change), plus an `aiFeedback`
// string and `modelUsed`/`escalated` metadata. Throws on hard provider errors;
// returns null when no provider is configured so the caller can fall back to
// the keyword match path without seeing an exception.
import { getActiveProvider } from './aiProvider.js';
import { callWithEscalation } from './aiService.js';

// JSON schema the model fills in. Strict-object so Anthropic structured
// output + OpenAI json_schema (strict mode) both accept it.
const MARKING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['correct', 'partial', 'missing', 'feedback', 'confidence'],
  properties: {
    correct: { type: 'boolean', description: 'true if the answer fully covers the model answer and all required key points.' },
    partial: { type: 'boolean', description: 'true if the answer covers SOME but not all key points (mutually exclusive with correct).' },
    missing: {
      type: 'array',
      items: { type: 'string' },
      description: 'Required key points the student did not address. Empty when correct.',
    },
    feedback: {
      type: 'string',
      description: 'One or two sentences of warm, age-appropriate feedback for a primary-school student. Mention what they got right and what to add. Plain text, no markdown.',
    },
    confidence: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
      description: 'How confident you are in this judgement. Use "low" when the answer is borderline or ambiguous.',
    },
  },
};

const SYSTEM_PROMPT = `You are a primary-school Science teacher marking a short open-ended answer.

You will be given the question, the canonical model answer the student should aim for, the list of required key points, and the student's answer.

Mark fairly. The student does NOT need to use the exact wording of the model answer — a synonym, a correct paraphrase, or a reasonable alternative phrasing that captures the same idea is a hit. Spelling slips are fine if the meaning is clear.

Rules:
- Set correct=true only when ALL required key points are covered in some form.
- Set partial=true when SOME but not all are covered. correct and partial are never both true.
- "missing" lists ONLY the key points that were not addressed. Empty when correct.
- "feedback" is warm and encouraging, 1–2 short sentences, written to a 10–12 year old. Acknowledge what they got right, then nudge them on what to add. No markdown, no lists, no headings.
- Set confidence="low" when the answer is borderline (e.g. very short, off-topic, or you genuinely can't tell whether a key point was addressed) so a stronger model can take a second look.

Return ONLY the JSON object that matches the schema. Do not include any other text.`;

// Build the user prompt — one structured block so caching works on the static
// system prompt; the per-question/per-answer details vary.
function buildMessages(question, modelAnswer, keyPoints, studentAnswer) {
  const kpBlock = (keyPoints || []).map((kp, i) => `  ${i + 1}. ${kp}`).join('\n') || '(none)';
  return [{
    role: 'user',
    content: [{
      type: 'text',
      text: `Question:\n${question}\n\nModel answer:\n${modelAnswer}\n\nRequired key points (a synonym/paraphrase counts):\n${kpBlock}\n\nStudent's answer:\n${String(studentAnswer || '').trim() || '(blank)'}`,
    }],
  }];
}

/**
 * Mark one open-ended answer with the active AI provider. Returns null when no
 * provider is configured so callers can fall back to keyword matching without
 * needing a try/catch.
 */
export async function markOpenEnded({ question, modelAnswer, keyPoints, studentAnswer }) {
  try { getActiveProvider(); } catch { return null; }
  if (!String(studentAnswer || '').trim()) {
    // Don't burn a model call on a blank answer.
    return {
      correct: false, partial: false, missing: keyPoints || [],
      feedback: 'Have a go! Write down what you remember about this concept.',
      confidence: 'high', aiFeedback: 'Have a go! Write down what you remember about this concept.',
      modelUsed: null, escalated: false,
    };
  }

  const messages = buildMessages(question, modelAnswer, keyPoints, studentAnswer);
  const { result, modelUsed, escalated } = await callWithEscalation(
    { system: SYSTEM_PROMPT, messages, schema: MARKING_SCHEMA, effort: 'low', maxTokens: 600 },
    (r) => r?.confidence === 'low',
  );

  // Belt-and-braces: ensure missing is an array, partial+correct are sane.
  const correct = !!result?.correct;
  const partial = !correct && !!result?.partial;
  const missing = Array.isArray(result?.missing) ? result.missing : [];
  return {
    correct, partial, missing,
    feedback: String(result?.feedback || ''),
    confidence: result?.confidence || 'medium',
    aiFeedback: String(result?.feedback || ''),
    modelUsed, escalated,
  };
}
