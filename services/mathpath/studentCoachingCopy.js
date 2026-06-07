export const STUDENT_COACHING_WORDS = Object.freeze({
  stillPractising: 'still practising',
  gettingStronger: 'getting stronger',
  tryThisNext: 'try this next',
  needsMorePractice: 'needs more practice',
});

export function safeStudentPhrase(text = '') {
  return String(text || '')
    .replace(/\bfailed\b/gi, 'is still practising')
    .replace(/\bweak\b/gi, 'still practising')
    .replace(/\bintervention\b/gi, 'next practice')
    .replace(/\brecommended intervention\b/gi, 'try this next')
    .replace(/\bdiagnostic jargon\b/gi, 'learning check');
}

export function encouragementForImprovement(improvement = 0) {
  const amount = Number(improvement || 0);
  if (amount >= 20) return 'Great work. Your practice is showing clear progress.';
  if (amount > 0) return 'Nice progress. You are getting stronger step by step.';
  return 'You completed the recheck. This gives Tian OS a clearer idea of what to practise next.';
}

export function nextActionCopy(action = {}) {
  const type = action.type || 'continue_practice';
  const reason = action.reason || 'it will help you keep building confidence.';
  const labels = {
    continue_recovery_pack: 'Continue Recovery Pack',
    start_next_learning_path: 'Start Next Learning Path',
    guided_practice: 'Try More Guided Practice',
    run_recheck_later: 'Run Another Recheck Later',
    move_on: 'Move On to Next Skill',
    ask_adult: 'Ask an Adult for Help',
    continue_practice: 'Continue Practice',
  };
  return {
    type,
    label: labels[type] || labels.continue_practice,
    reason: safeStudentPhrase(reason),
  };
}

export default {
  STUDENT_COACHING_WORDS,
  safeStudentPhrase,
  encouragementForImprovement,
  nextActionCopy,
};
