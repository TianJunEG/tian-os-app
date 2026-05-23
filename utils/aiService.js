import Anthropic from '@anthropic-ai/sdk';

// Cheap model handles every call; escalate to the stronger model only when the
// cheap model reports it could not read the handwriting clearly. Both are
// env-configurable so cost/quality can be tuned without code changes.
const PRIMARY_MODEL = process.env.WORKSHEET_PRIMARY_MODEL || 'claude-haiku-4-5';
const ESCALATION_MODEL = process.env.WORKSHEET_ESCALATION_MODEL || 'claude-sonnet-4-6';

const MEDIA_TYPES = {
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/png': 'image/png',
  'image/gif': 'image/gif',
  'image/webp': 'image/webp'
};

let client;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('AI is not configured: ANTHROPIC_API_KEY is missing on the server.');
    err.status = 503;
    throw err;
  }
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

// effort + adaptive thinking are only valid on Opus 4.5+/Sonnet 4.6.
// Haiku 4.5 rejects the effort parameter, so omit both there.
function supportsTuning(model) {
  return /claude-(opus-4-(5|6|7)|sonnet-4-6)/.test(model);
}

async function callStructured({ model, system, messages, schema, effort, maxTokens }) {
  const anthropic = getClient();

  const params = {
    model,
    max_tokens: maxTokens,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages,
    output_config: { format: { type: 'json_schema', schema } }
  };
  if (supportsTuning(model)) {
    params.thinking = { type: 'adaptive' };
    if (effort) params.output_config.effort = effort;
  }

  const message = await anthropic.messages.stream(params).finalMessage();

  if (message.stop_reason === 'refusal') {
    const err = new Error('The model declined this request.');
    err.status = 422;
    throw err;
  }
  if (message.stop_reason === 'max_tokens') {
    const err = new Error('The response was cut off. Try requesting fewer questions.');
    err.status = 502;
    throw err;
  }

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock) {
    const err = new Error('The model returned no data.');
    err.status = 502;
    throw err;
  }

  try {
    return JSON.parse(textBlock.text);
  } catch (e) {
    const err = new Error('Could not parse the model response.');
    err.status = 502;
    throw err;
  }
}

// Run on the primary (cheap) model; if it reports it could not read the
// handwriting, retry the same call once on the stronger model.
async function callWithEscalation(opts, needsEscalation) {
  const result = await callStructured({ ...opts, model: PRIMARY_MODEL });
  if (PRIMARY_MODEL !== ESCALATION_MODEL && needsEscalation(result)) {
    const escalated = await callStructured({ ...opts, model: ESCALATION_MODEL });
    return { result: escalated, modelUsed: ESCALATION_MODEL, escalated: true };
  }
  return { result, modelUsed: PRIMARY_MODEL, escalated: false };
}

// ---------------------------------------------------------------------------
// Worksheet generation from a photo of marked work
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert mathematics teacher and learning diagnostician. You are given a photo of a student's marked math work — the marks (ticks, crosses, crossings-out, teacher annotations, scores) show which answers were judged right or wrong.

Your job has three parts:
1. Read the work carefully. Identify which questions the student answered incorrectly and what they actually wrote.
2. Diagnose the underlying mathematical MISCONCEPTION behind each error — the root cause in the student's thinking. Do not just restate that an answer was wrong; explain the faulty reasoning, and cite the specific evidence in the work that points to it.
3. Generate a set of fresh practice questions that directly target those misconceptions, mixing difficulty (some easier, some at level, some harder).

Rules:
- Be mathematically rigorous. Every answer and worked solution must be correct — double-check your arithmetic.
- Make questions and language age/level appropriate.
- Generated questions must be NEW (not copies of the ones in the photo) but probe the same skill and misconception.
- Worked solutions must show the steps a learner should follow.
- If the image is unreadable, not math work, or you cannot identify any errors, say so in the summary and return empty misconceptions and questions rather than inventing problems.
- Set handwritingClear to true only if the handwriting and marks are clear enough for you to read confidently; set it to false if the photo is too blurry, low-resolution, or messy for you to be sure what was written.`;

const WORKSHEET_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string', description: 'The math topic the work covers.' },
    overallSummary: { type: 'string', description: 'Short plain-language summary; if the image could not be analyzed, explain why here.' },
    readable: { type: 'boolean', description: 'True if the image was legible math work that could be analyzed.' },
    handwritingClear: { type: 'boolean', description: 'True if you could read the handwriting/marks confidently; false if too unclear to be sure.' },
    misconceptions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          evidence: { type: 'string' }
        },
        required: ['title', 'description', 'evidence'],
        additionalProperties: false
      }
    },
    skillsToReinforce: { type: 'array', items: { type: 'string' } },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          answer: { type: 'string' },
          workedSolution: { type: 'string' },
          targetsMisconception: { type: 'string' },
          difficulty: { type: 'string', enum: ['easier', 'similar', 'harder'] }
        },
        required: ['prompt', 'answer', 'workedSolution', 'targetsMisconception', 'difficulty'],
        additionalProperties: false
      }
    }
  },
  required: ['topic', 'overallSummary', 'readable', 'handwritingClear', 'misconceptions', 'skillsToReinforce', 'questions'],
  additionalProperties: false
};

export async function analyzeAndGenerateWorksheet({ imageBase64, mimeType, gradeLevel, topicHint, numQuestions }) {
  const mediaType = MEDIA_TYPES[mimeType];
  if (!mediaType) {
    const err = new Error('Unsupported image type. Upload a JPEG, PNG, WEBP, or GIF photo.');
    err.status = 400;
    throw err;
  }

  const count = Math.min(Math.max(parseInt(numQuestions, 10) || 12, 6), 18);

  const instructions = [
    'Analyze the attached photo of marked math work, diagnose the misconception(s) behind any wrong answers, and generate practice questions.',
    `Generate exactly ${count} practice questions spread across easier / similar / harder difficulties.`,
    'These will be divided into several spaced practice sessions, so make every question distinct — vary the numbers and surface form; do not produce near-duplicates.',
    gradeLevel ? `Student grade or level: ${gradeLevel}.` : '',
    topicHint ? `Topic context provided by the user: ${topicHint}.` : '',
    'Return only the structured worksheet data.'
  ].filter(Boolean).join('\n');

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
        { type: 'text', text: instructions }
      ]
    }
  ];

  const { result, modelUsed, escalated } = await callWithEscalation(
    { system: SYSTEM_PROMPT, messages, schema: WORKSHEET_SCHEMA, effort: 'high', maxTokens: 20000 },
    (r) => r.handwritingClear === false
  );

  return { ...result, modelUsed, escalated };
}

// ---------------------------------------------------------------------------
// Marking student answers (typed or handwritten)
// ---------------------------------------------------------------------------

const MARK_SYSTEM = `You are a meticulous, encouraging math marker. For each item you are given the question, the correct answer, and the student's response — either typed text or a photo of their handwritten answer.

For each item:
- If the response is an image, read the handwriting carefully and transcribe what the student wrote.
- Decide if the student's answer is correct. Accept any mathematically equivalent form (e.g. 1/2 = 0.5 = 2/4, 1 7/12 = 19/12, "x=3" vs "3"). Ignore spacing, capitalization, and trivial notation differences. Judge the final answer.
- Write one short, supportive feedback sentence. If correct, affirm briefly. If wrong, point at the likely misconception or the step that went wrong — do NOT reveal the correct answer.

Return a result for every item, keyed by its index. Set needsBetterModel to true if any handwritten answer image is too unclear for you to read reliably; otherwise false.`;

const MARK_SCHEMA = {
  type: 'object',
  properties: {
    needsBetterModel: { type: 'boolean', description: 'True if any handwritten answer was too unclear to read reliably.' },
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer', description: 'The item index given in the prompt.' },
          correct: { type: 'boolean' },
          readAs: { type: 'string', description: 'What the student wrote (transcribed for images, echoed for text).' },
          feedback: { type: 'string', description: 'One short feedback sentence; never reveals the answer.' }
        },
        required: ['index', 'correct', 'readAs', 'feedback'],
        additionalProperties: false
      }
    }
  },
  required: ['needsBetterModel', 'results'],
  additionalProperties: false
};

export async function markAnswers({ items }) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('No answers to mark.');
    err.status = 400;
    throw err;
  }

  const content = [
    { type: 'text', text: 'Mark each of the following items. Read any handwriting carefully and accept mathematically equivalent answers.' }
  ];

  for (const item of items) {
    content.push({
      type: 'text',
      text: `--- Item ${item.index} ---\nQuestion: ${item.prompt}\nCorrect answer: ${item.correctAnswer}`
    });
    if (item.type === 'image' && item.imageBase64) {
      const mediaType = MEDIA_TYPES[item.mimeType] || 'image/png';
      content.push({ type: 'text', text: `Student's handwritten answer (image) for item ${item.index}:` });
      content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: item.imageBase64 } });
    } else {
      content.push({ type: 'text', text: `Student typed for item ${item.index}: ${item.text ?? ''}` });
    }
  }

  const { result, modelUsed, escalated } = await callWithEscalation(
    { system: MARK_SYSTEM, messages: [{ role: 'user', content }], schema: MARK_SCHEMA, effort: 'medium', maxTokens: 8000 },
    (r) => r.needsBetterModel === true
  );

  return { results: result.results || [], modelUsed, escalated };
}

// ---------------------------------------------------------------------------
// Reinforcement: fresh questions from known misconceptions (no image)
// ---------------------------------------------------------------------------

const REINFORCE_SYSTEM = `You are an expert math teacher generating targeted practice. You are given a topic and one or more diagnosed misconceptions. Produce fresh practice questions that directly confront those misconceptions, spread across easier / similar / harder difficulty. Be mathematically rigorous: every answer and worked solution must be correct. Make questions distinct (vary numbers and surface form) and age/level appropriate.`;

const REINFORCE_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          answer: { type: 'string' },
          workedSolution: { type: 'string' },
          targetsMisconception: { type: 'string' },
          difficulty: { type: 'string', enum: ['easier', 'similar', 'harder'] }
        },
        required: ['prompt', 'answer', 'workedSolution', 'targetsMisconception', 'difficulty'],
        additionalProperties: false
      }
    }
  },
  required: ['questions'],
  additionalProperties: false
};

export async function generateReinforcement({ topic, misconceptions, gradeLevel, numQuestions }) {
  const count = Math.min(Math.max(parseInt(numQuestions, 10) || 12, 6), 18);
  const mcText = (misconceptions || [])
    .map((m, i) => `${i + 1}. ${m.title}: ${m.description}`)
    .join('\n') || 'General reinforcement on the topic.';

  const instructions = [
    `Topic: ${topic || 'math'}.`,
    `Generate exactly ${count} NEW practice questions targeting these misconceptions:`,
    mcText,
    'Spread them across easier / similar / harder, and make every question distinct — no near-duplicates.',
    gradeLevel ? `Student grade or level: ${gradeLevel}.` : '',
    'Return only the structured data.'
  ].filter(Boolean).join('\n');

  const result = await callStructured({
    model: PRIMARY_MODEL,
    system: REINFORCE_SYSTEM,
    messages: [{ role: 'user', content: instructions }],
    schema: REINFORCE_SCHEMA,
    effort: 'high',
    maxTokens: 16000
  });

  return result.questions || [];
}
