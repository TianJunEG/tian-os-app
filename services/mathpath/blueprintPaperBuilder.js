// Pure helpers for generating a paper from an AssessmentBlueprint's sections[].
//
// A blueprint section is richer than our flat generator: it names a section,
// fixes its marks + questionCount, lists allowed questionTypes (a wider enum than
// the question bank's 'mcq'|'short_answer'|'open_ended'), and carries a
// difficultyMix. These helpers turn that into a concrete "section plan" the route
// fills by selecting questions; the question selection itself (DB) stays in the
// route, but everything structural/derivable lives here and is unit-tested.

// Map a blueprint's questionTypes to the question bank's `type` values. Returns
// an empty array to mean "no type constraint" (mixed/diagram/graph/table can't be
// filtered precisely, so we don't over-constrain and risk an empty section).
export function mapBlueprintTypesToQuestionTypes(bpTypes = []) {
  const types = Array.isArray(bpTypes) ? bpTypes : [];
  if (!types.length || types.includes('mixed')) return [];
  const out = new Set();
  for (const t of types) {
    if (t === 'mcq') out.add('mcq');
    else if (t === 'short_answer') out.add('short_answer');
    else if (['open_ended', 'word_problem', 'multi_step'].includes(t)) out.add('open_ended');
    // diagram / graph / table → no clean mapping; leave unconstrained for that type
  }
  return [...out];
}

// Which paper a section belongs to: read it from the section name when present
// (PSLE blueprints name "Paper 1 …" / "Paper 2 …"), else default to Paper 1.
export function sectionPaper(section = {}) {
  const name = String(section.name || '');
  if (/paper\s*2/i.test(name)) return 2;
  return 1;
}

// Calculator rule for a section: Paper 2 conventionally allows a calculator;
// other sections inherit the blueprint's flag.
export function sectionCalculatorAllowed(section = {}, blueprint = {}) {
  if (sectionPaper(section) === 2) return true;
  return Boolean(blueprint.calculatorAllowed);
}

// Normalize a blueprint's difficultyMix sub-doc to the { easy, medium, hard }
// shape our sampler expects, dropping the richer bands a blueprint may carry.
export function blueprintDifficultyMix(section = {}) {
  const mix = section.difficultyMix || {};
  const easy = Number(mix.easy || mix.beginner || mix.basic || 0);
  const medium = Number(mix.medium || mix.standard || 0);
  const hard = Number(mix.hard || mix.advanced || mix.challenge || 0);
  if (easy + medium + hard <= 0) return { easy: 40, medium: 40, hard: 20 };
  return { easy, medium, hard };
}

// Turn a blueprint into an ordered list of section plans (no DB access). Each plan
// carries everything needed to select + label a section. Skips zero-count sections.
export function buildBlueprintSectionPlan(blueprint = {}) {
  const sections = Array.isArray(blueprint.sections) ? blueprint.sections : [];
  return sections
    .map((section, index) => {
      const questionCount = Math.max(0, Number(section.questionCount || 0));
      return {
        index,
        id: `bp${index}`,
        name: section.name || `Section ${index + 1}`,
        paper: sectionPaper(section),
        marks: Math.max(0, Number(section.marks || 0)),
        questionCount,
        questionTypes: mapBlueprintTypesToQuestionTypes(section.questionTypes),
        difficultyMix: blueprintDifficultyMix(section),
        calculatorAllowed: sectionCalculatorAllowed(section, blueprint),
      };
    })
    .filter((plan) => plan.questionCount > 0);
}
