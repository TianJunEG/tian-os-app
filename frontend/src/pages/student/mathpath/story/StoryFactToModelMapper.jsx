export function getFactsForSentence(story = {}, sentenceIndex = -1) {
  return (story.keyFacts || []).filter((fact) => Number(fact.sentenceIndex) === Number(sentenceIndex));
}

export function getDefaultFactForSentence(story = {}, sentenceIndex = -1) {
  return getFactsForSentence(story, sentenceIndex)[0] || null;
}

export function getModelStepIndexForFact(story = {}, fact = null) {
  if (!fact || !Array.isArray(story.modelSequence)) return 0;
  const action = String(fact.modelAction || fact.modelPrompt || '').toLowerCase();
  const type = String(fact.type || '').toLowerCase();
  if (type === 'target_unknown') return Math.max(0, story.modelSequence.length - 1);
  if (type === 'quantity_known') return story.modelSequence.findIndex((step) => step.id === 'label_known');
  if (type === 'remainder') return story.modelSequence.findIndex((step) => step.id === 'subdivide_remainder');
  if (action.includes('shade')) return story.modelSequence.findIndex((step) => step.id === 'mark_removed');
  return 0;
}

export function resolveFactModelState(story = {}, activeSentenceIndex = -1, selectedFact = null) {
  const fact = selectedFact || getDefaultFactForSentence(story, activeSentenceIndex);
  const stepIndex = getModelStepIndexForFact(story, fact);
  return {
    fact,
    modelStepIndex: stepIndex >= 0 ? stepIndex : 0,
  };
}
