// Blueprint → question bank assembler.
// Accepts a plain-object spec (domainId list + per-topic count/level/difficulty)
// and returns a flat question list assembled from registered diagnostic domains.
// Separate from assessmentBlueprintEngine.js which handles blueprint metadata/validation.

import { selectQuestionsForLevel } from './questionBankSelector.js';

// Assemble questions from one or more domain topics in parallel.
// spec shape:
//   {
//     title: string,
//     level: 'Primary N',            // paper-level default (overrideable per topic)
//     topics: [{
//       domainId: string,
//       subjectId?: string,           // default 'math'
//       level?: 'Primary N',          // overrides paper level for this topic
//       skillIds?: string[],          // restrict to specific skill slugs
//       count: number,
//       difficultyMix?: { easy, medium, hard },  // percentages (needn't sum to 100)
//       includePrior?: boolean,       // default true
//     }],
//   }
export async function buildQuestionBank(spec = {}) {
  const { title = 'Assessment', level: paperLevel = 'Primary 3', topics = [] } = spec;

  const settled = await Promise.all(
    topics.map(async (topic) => {
      const {
        domainId,
        subjectId = 'math',
        level = paperLevel,
        skillIds = [],
        count = 5,
        difficultyMix = { easy: 40, medium: 40, hard: 20 },
        includePrior = true,
      } = topic;

      try {
        const questions = await selectQuestionsForLevel({
          domainId, subjectId, targetLevel: level,
          count, skillIds, includePrior, difficultyMix,
        });
        return { domainId, questions, error: null };
      } catch (err) {
        return { domainId, questions: [], error: err.message };
      }
    }),
  );

  const questions = settled.flatMap((r) => r.questions);
  const domainBreakdown = Object.fromEntries(
    settled.map((r) => [r.domainId, { count: r.questions.length, error: r.error }]),
  );

  return {
    questions,
    meta: {
      title,
      level: paperLevel,
      totalCount: questions.length,
      requested: topics.reduce((s, t) => s + (t.count || 5), 0),
      domainBreakdown,
    },
  };
}
