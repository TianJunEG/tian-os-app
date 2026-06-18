export function buildDomainWorkingSessionId({ domainId = 'mathpath', practiceSessionId = '', questionId = '' } = {}) {
  const safe = (value) => String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const sessionPart = safe(practiceSessionId) || 'session';
  const questionPart = safe(questionId) || 'question';
  return `working_${safe(domainId) || 'mathpath'}_${sessionPart}_${questionPart}`;
}

export function workingEvidenceFromSavedWorking(working = {}) {
  if (!working.workingSubmitted) return [];
  return [{
    source: 'fullscreen_working',
    image: working.workingImage || '',
    strokes: Array.isArray(working.workingStrokes) ? working.workingStrokes : [],
    mathObjects: Array.isArray(working.workingMathObjects) ? working.workingMathObjects : [],
    submittedAt: working.workingSubmittedAt || new Date().toISOString(),
  }];
}

