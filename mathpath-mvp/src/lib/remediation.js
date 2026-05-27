// remediation.js — build a calm reteach for a diagnosed miss.
//
// Returns: the named misconception, a short warm message, a worked example (step lines that
// may be plain text or LaTeX), and a guided "now you try" sibling question. The message uses
// Anthropic (Haiku, cached) when ANTHROPIC_API_KEY is set, else a deterministic template — so
// the flow always runs. Worked example + sibling are deterministic either way.

import Anthropic from '@anthropic-ai/sdk';
import { getSkill } from './graph.js';
import { reconstruct, diagnose, siblingParams } from './questions.js';
import { ALL_MESSAGES as MESSAGES } from './engines.js';

async function aiMessage(skill, question, misconception, given) {
  const fallback = MESSAGES[misconception.tag] || "Let's look at this one together.";
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 90,
      system: [{
        type: 'text',
        text: 'You are a calm primary-maths coach in Tian OS. A child made one mistake. Reply with one or two short, warm sentences naming the misconception gently and pointing to the fix. No emojis, under 35 words, addressed to the child.',
        cache_control: { type: 'ephemeral' },
      }],
      messages: [{ role: 'user', content: `Skill: ${skill.skill_name}. Prompt: ${question.prompt_text}. Answer: ${question.answer}. Child answered: ${given}. Misconception: ${misconception.label}.` }],
    });
    return resp.content?.map((c) => c.text || '').join('').trim() || fallback;
  } catch {
    return fallback;
  }
}

function asTry(q) {
  return {
    question_type: q.question_type,
    prompt_latex: q.prompt_latex || null,
    prompt_text: q.prompt_text || null,
    visual: q.visual || null,
    choices: q.choices || null,
    answer: q.answer,
  };
}

// `routeTo` (optional) is the weakest non-mastered prerequisite skill_id. For concept skills
// with a weak foundation, the guided "now you try" comes from that prerequisite instead of the
// missed skill — falling back to the foundation that broke (SKILL.md §8).
export async function buildRemediation(skillId, params, given, routeTo = null) {
  const skill = getSkill(skillId);
  const question = reconstruct(skillId, params);
  const misconception = diagnose(skillId, params, given);
  let message = await aiMessage(skill, question, misconception, given);

  const usePrereq = skill.mastery_type === 'concept' && routeTo && getSkill(routeTo);
  const guidedSkillId = usePrereq ? routeTo : skillId;
  const sib = usePrereq
    ? reconstruct(routeTo) // a fresh foundational item from the prerequisite
    : reconstruct(skillId, siblingParams(skillId, params));

  if (usePrereq) {
    message += ` This builds on ${getSkill(routeTo).skill_name} — let's shore that up first.`;
  }

  return {
    misconception,
    message,
    route_to: usePrereq ? routeTo : null,
    worked_example: {
      prompt_latex: question.prompt_latex || null,
      prompt_text: question.prompt_text || null,
      visual: question.visual || null,
      steps: question.worked_solution,
    },
    guided: {
      from_prerequisite: usePrereq ? getSkill(routeTo).skill_name : null,
      try_question: { ...asTry(sib), skill_id: guidedSkillId },
    },
  };
}
