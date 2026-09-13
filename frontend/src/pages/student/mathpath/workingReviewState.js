export function resolveMistakeWorkingState(mistake = {}) {
  const hasStrokes = Array.isArray(mistake.workingStrokes) && mistake.workingStrokes.length > 0;
  const hasMathObjects = Array.isArray(mistake.workingMathObjects) && mistake.workingMathObjects.length > 0;
  const hasWorking = Boolean(
    mistake.workingSubmitted
    || mistake.fullscreenWorkingSubmitted
    || mistake.workingId
    || mistake.workingPreviewImage
    || mistake.workingImage
    || mistake.extractedWorkingText
    || hasStrokes
    || hasMathObjects
  );
  if (hasWorking) {
    return {
      status: 'saved',
      label: 'Working saved',
      explanation: 'Your written working was saved with this mistake.',
      previewImage: mistake.workingPreviewImage || mistake.workingImage || '',
    };
  }
  if (mistake.workingNotNeeded) {
    return {
      status: 'not_needed',
      label: 'Working marked not needed',
      explanation: 'You marked this question as not needing written working.',
      previewImage: '',
    };
  }
  if (mistake.workingExpected || mistake.workingRequired || mistake.workingRequirementLevel === 'HIGH') {
    return {
      status: 'missing',
      label: 'Working missing',
      explanation: 'This question expected working, but no working was submitted.',
      previewImage: '',
    };
  }
  return {
    status: 'unavailable',
    label: 'Working unavailable',
    explanation: 'No working evidence was recorded for this mistake.',
    previewImage: '',
  };
}
