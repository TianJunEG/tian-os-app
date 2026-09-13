export function copyWorkingEvidenceFields(source = {}) {
  const workingSubmitted = Boolean(source.workingSubmitted || source.fullscreenWorkingSubmitted);
  return {
    workingSubmitted,
    workingImage: source.workingImage || '',
    workingStrokes: Array.isArray(source.workingStrokes) ? source.workingStrokes : [],
    workingMathObjects: Array.isArray(source.workingMathObjects) ? source.workingMathObjects : [],
    workingSessionId: source.workingSessionId ? String(source.workingSessionId) : '',
    fullscreenWorkingSubmitted: Boolean(source.fullscreenWorkingSubmitted || source.workingSubmitted),
  };
}

export default { copyWorkingEvidenceFields };
