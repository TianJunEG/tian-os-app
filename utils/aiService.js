import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-4-7';

// Stable across requests so it can be prompt-cached. Keep volatile, per-request
// details (the image, grade level, topic hint) in the user message instead.
const SYSTEM_PROMPT = `You are an expert mathematics teacher and learning diagnostician. You are given a photo of a student's marked math work — the marks (ticks, crosses, crossings-out, teacher annotations, scores) show which answers were judged right or wrong.

Your job has three parts:
1. Read the work carefully. Identify which questions the student answered incorrectly and what they actually wrote.
2. Diagnose the underlying mathematical MISCONCEPTION behind each error — the root cause in the student's thinking (e.g. "adds numerators and denominators when adding fractions", "ignores place value when subtracting", "applies the distributive law incorrectly"). Do not just restate that an answer was wrong; explain the faulty reasoning, and cite the specific evidence in the work that points to it.
3. Generate a set of fresh practice questions that directly target those misconceptions, so the student can confront and correct the specific gap. Mix difficulty: some slightly easier to rebuild confidence, some at the same level, some slightly harder to stretch.

Rules:
- Be mathematically rigorous. Every answer and worked solution you produce must be correct — double-check your arithmetic.
- Make questions and language age/level appropriate.
- Generated questions must be NEW (not copies of the ones in the photo) but probe the same skill and misconception.
- Worked solutions must show the steps a learner should follow, not just the final answer.
- If the image is unreadable, not math work, or you cannot identify any errors, say so clearly in the summary and return an empty set of misconceptions and questions rather than inventing problems.`;

// Structured-output JSON schema. Note: the structured-output engine does not
// support array length / string length constraints, so question count and
// brevity are steered through the prompt instead.
const WORKSHEET_SCHEMA = {
  type: 'object',
  properties: {
    topic: {
      type: 'string',
      description: 'The math topic the work covers, e.g. "Adding fractions" or "Two-digit subtraction".'
    },
    overallSummary: {
      type: 'string',
      description: "A short plain-language summary of how the student did and what went wrong. If the image could not be analyzed, explain why here."
    },
    readable: {
      type: 'boolean',
      description: 'True if the image was legible math work that could be analyzed; false otherwise.'
    },
    misconceptions: {
      type: 'array',
      description: 'The distinct misconceptions diagnosed from the errors. Empty if none were found.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'A short name for the misconception.' },
          description: { type: 'string', description: 'Plain-language explanation of the faulty reasoning.' },
          evidence: { type: 'string', description: 'What in the marked work shows this misconception.' }
        },
        required: ['title', 'description', 'evidence'],
        additionalProperties: false
      }
    },
    skillsToReinforce: {
      type: 'array',
      description: 'Concrete skills the student should practice to fix the misconceptions.',
      items: { type: 'string' }
    },
    questions: {
      type: 'array',
      description: 'Fresh practice questions targeting the misconceptions.',
      items: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'The practice question for the student to solve.' },
          answer: { type: 'string', description: 'The correct final answer.' },
          workedSolution: { type: 'string', description: 'Step-by-step solution the student can learn from.' },
          targetsMisconception: { type: 'string', description: 'Which diagnosed misconception this question addresses.' },
          difficulty: { type: 'string', enum: ['easier', 'similar', 'harder'] }
        },
        required: ['prompt', 'answer', 'workedSolution', 'targetsMisconception', 'difficulty'],
        additionalProperties: false
      }
    }
  },
  required: ['topic', 'overallSummary', 'readable', 'misconceptions', 'skillsToReinforce', 'questions'],
  additionalProperties: false
};

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

/**
 * Analyze a photo of marked math work and generate targeted practice questions.
 * Returns the parsed worksheet object matching WORKSHEET_SCHEMA.
 */
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

  const anthropic = getClient();

  const message = await anthropic.messages
    .stream({
      model: MODEL,
      max_tokens: 20000,
      thinking: { type: 'adaptive' },
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }
      ],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: instructions }
          ]
        }
      ],
      output_config: {
        effort: 'high',
        format: { type: 'json_schema', schema: WORKSHEET_SCHEMA }
      }
    })
    .finalMessage();

  if (message.stop_reason === 'refusal') {
    const err = new Error('The model declined to analyze this image.');
    err.status = 422;
    throw err;
  }
  if (message.stop_reason === 'max_tokens') {
    const err = new Error('The analysis was cut off. Try requesting fewer questions.');
    err.status = 502;
    throw err;
  }

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock) {
    const err = new Error('The model returned no worksheet data.');
    err.status = 502;
    throw err;
  }

  try {
    return JSON.parse(textBlock.text);
  } catch (e) {
    const err = new Error('Could not parse the generated worksheet.');
    err.status = 502;
    throw err;
  }
}
