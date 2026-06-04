const HIGH_CONFIDENCE = new Set(['high', 'confident', 'very_confident', 'very confident', 'i_know_this', 'i know this', 'know']);
const LOW_CONFIDENCE = new Set(['low', 'dont_know', "don't know", 'i_dont_know', "i don't know", 'guess', 'not confident']);
const MEDIUM_CONFIDENCE = new Set(['medium', 'not_sure', "i'm not sure", 'im not sure', 'unsure']);

function clean(value, fallback = '') {
  return String(value || fallback || '').trim();
}

function plural(count, singular, pluralValue = `${singular}s`) {
  return Number(count) === 1 ? singular : pluralValue;
}

export function normalizeConfidence(value = '') {
  const raw = clean(value).toLowerCase().replace(/\s+/g, '_');
  const spaced = raw.replace(/_/g, ' ');
  if (HIGH_CONFIDENCE.has(raw) || HIGH_CONFIDENCE.has(spaced)) return 'high';
  if (LOW_CONFIDENCE.has(raw) || LOW_CONFIDENCE.has(spaced)) return 'low';
  if (MEDIUM_CONFIDENCE.has(raw) || MEDIUM_CONFIDENCE.has(spaced)) return 'medium';
  return raw || 'unknown';
}

const INSIGHT_TEMPLATES = {
  concept_gap: {
    observation: 'The answer was not secure yet.',
    interpretation: 'This suggests the concept needs another guided explanation before independent practice.',
    recommendation: 'Review the concept with a worked example, then try a short guided set.',
  },
  careless_error: {
    observation: 'The method looks mostly on track, but the final answer was incorrect.',
    interpretation: 'This may be a checking or calculation slip rather than a full concept gap.',
    recommendation: 'Slow down for the final check and compare the answer with the question.',
  },
  repeated_error: {
    observation: 'The same error pattern has appeared more than once.',
    interpretation: 'Repeated errors usually mean the student is applying an incorrect rule consistently.',
    recommendation: 'Pause new practice and reteach the rule with a visual or concrete model.',
  },
  high_confidence_wrong: {
    observation: 'The student was confident but answered incorrectly.',
    interpretation: 'This may indicate a misconception rather than a lack of effort or a random mistake.',
    recommendation: 'Prioritise conceptual reteaching before assigning more independent practice.',
  },
  low_confidence_wrong: {
    observation: 'The student was unsure and answered incorrectly.',
    interpretation: 'This points to a knowledge gap that is ready for supportive review.',
    recommendation: 'Use a guided example and one or two easier success questions before moving on.',
  },
  missing_working: {
    observation: 'No working evidence was submitted for this question.',
    interpretation: 'Without working, it is harder to tell whether the issue was method, calculation, or reading.',
    recommendation: 'Ask the student to show the method on the next similar question.',
  },
  incomplete_working: {
    observation: 'The working evidence is incomplete or hard to follow.',
    interpretation: 'The student may know parts of the method but is not recording enough steps to verify it.',
    recommendation: 'Model a complete working layout and ask for each step to be written clearly.',
  },
  incorrect_method: {
    observation: 'The working suggests an incorrect method was used.',
    interpretation: 'The student may be applying a rule from a different type of question.',
    recommendation: 'Compare the incorrect method with the correct one, then practise two guided examples.',
  },
  slow_but_correct: {
    observation: 'The student answered correctly, but took longer than expected.',
    interpretation: 'The concept may be understood, but it is not automatic yet.',
    recommendation: 'Use short fluency practice to build speed without adding pressure.',
  },
  strong_improvement: {
    observation: 'Recent performance is improving.',
    interpretation: 'The student is responding well to practice and feedback.',
    recommendation: 'Keep the current routine and add a short review later to make the learning stick.',
  },
  correct_clear_working: {
    observation: 'The student answered correctly and showed usable working.',
    interpretation: 'This is a strong sign that the method is understood, not just guessed.',
    recommendation: 'Continue with the next question or a slightly harder version.',
  },
  no_working_correct: {
    observation: 'The student answered correctly without needing working.',
    interpretation: 'This can be a positive automaticity signal when the question is suitable for mental work.',
    recommendation: 'Keep tracking speed and confidence to confirm fluency.',
  },
};

export function getInsightTemplate(type = 'concept_gap') {
  return INSIGHT_TEMPLATES[type] || INSIGHT_TEMPLATES.concept_gap;
}

export function interpretConfidence({ correct = null, confidence = '' } = {}) {
  const normalized = normalizeConfidence(confidence);
  if (correct === false && normalized === 'high') {
    return {
      pattern: 'high_confidence_wrong',
      student: 'You were confident but answered incorrectly. That usually means part of the idea makes sense, but the method needs a reset.',
      parent: 'Your child appears confident but is making errors, which may indicate a misconception rather than a careless mistake.',
      tutor: 'Prioritise conceptual reteaching before additional independent practice.',
    };
  }
  if (correct === false && normalized === 'low') {
    return {
      pattern: 'low_confidence_wrong',
      student: "It's okay not to know this yet. Let's review the idea step by step.",
      parent: 'Your child knows this is difficult, so supportive guided practice is likely to help.',
      tutor: 'Use a worked example and scaffolded questions before independent practice.',
    };
  }
  if (correct === true && normalized === 'low') {
    return {
      pattern: 'low_confidence_correct',
      student: 'You got it right even though you were unsure. Let’s build confidence with a few similar questions.',
      parent: 'Your child may know more than they feel confident about. Short success streaks can help.',
      tutor: 'Use quick confidence-building checks; reteaching may not be necessary.',
    };
  }
  if (correct === true && normalized === 'high') {
    return {
      pattern: 'confident_correct',
      student: 'Your confidence matched your answer. Keep using the same clear method.',
      parent: 'Confidence and accuracy are aligned on this evidence.',
      tutor: 'This skill may be ready for fluency or retention checks.',
    };
  }
  return {
    pattern: 'confidence_building',
    student: 'Your confidence data is still building. Keep choosing how sure you are.',
    parent: 'More completed questions will make confidence patterns clearer.',
    tutor: 'Collect more confidence-rated attempts before making a confidence-based intervention decision.',
  };
}

function methodLabel(input = {}) {
  return clean(
    input.methodDetected
    || input.detectedMethod
    || input.method
    || input.mistakeType
    || input.mistakeName
    || input.mistakeCode
    || ''
  );
}

export function explainWorkingAnalysis(input = {}) {
  const method = methodLabel(input);
  const text = [
    input.analysisSummary,
    input.detectedIssue,
    input.workingPattern,
    input.ocrText,
    method,
  ].filter(Boolean).join(' ').toLowerCase();

  if (input.missingWorking || input.workingNotNeeded === false && !input.workingSubmitted) {
    return {
      type: 'missing_working',
      observation: 'No working evidence was available for this question.',
      interpretation: 'The answer alone does not show whether the method was understood.',
      recommendation: 'Ask for working on the next similar question so the method can be checked.',
    };
  }

  if (/denominator|common denominator|same denominator|direct.*denominator|denominators directly/.test(text)) {
    return {
      type: 'incorrect_method',
      observation: 'From the working, it looks like the denominator step was handled incorrectly.',
      interpretation: 'This often happens when students treat fraction parts like whole numbers or change only one part of the fraction.',
      recommendation: 'Use a visual model to show why equivalent parts must keep the same value before continuing.',
    };
  }

  if (/incomplete|unclear|unreadable|missing step|not enough/.test(text)) {
    return {
      type: 'incomplete_working',
      ...INSIGHT_TEMPLATES.incomplete_working,
    };
  }

  if (method) {
    return {
      type: 'incorrect_method',
      observation: `The working suggests this method was used: ${method}.`,
      interpretation: 'The selected method may not match what the question is asking.',
      recommendation: 'Compare the method with a worked example, then retry a similar question.',
    };
  }

  return {
    type: 'correct_clear_working',
    observation: 'The working evidence is available for review.',
    interpretation: 'This gives a clearer view of the student’s method than the answer alone.',
    recommendation: 'Use the working evidence when deciding whether to reteach or move on.',
  };
}

export function explainRemediation(input = {}) {
  const skill = clean(input.skillName || input.remediationSkillName || input.recommendedSkillName, 'the recommended skill');
  const reason = clean(input.reason || input.recommendationReason || input.rootCause || input.mistakeName);
  const attempts = Number(input.occurrences || input.frequency || input.mistakeCount || 0);
  return {
    observation: attempts
      ? `${attempts} ${plural(attempts, 'piece')} of recent evidence point to ${skill}.`
      : `The current evidence points to ${skill}.`,
    interpretation: reason
      ? `${reason} is the reason this review was selected.`
      : 'This review was selected because it is the closest next step to the observed gap.',
    recommendation: `Practise ${skill} with guided examples before moving to harder questions.`,
    nextStep: `Start a short ${skill} review.`,
  };
}

function chooseTemplateType(input = {}) {
  const confidence = normalizeConfidence(input.confidence || input.confidenceLevel || input.reflection);
  if (input.correct === true && input.workingSubmitted) return 'correct_clear_working';
  if (input.correct === true && input.workingNotNeeded) return 'no_working_correct';
  if (input.correct === true && Number(input.timeTakenSeconds || input.timeTaken || 0) > Number(input.targetSeconds || input.benchmarkSeconds || 45)) return 'slow_but_correct';
  if (input.correct === false && confidence === 'high') return 'high_confidence_wrong';
  if (input.correct === false && confidence === 'low') return 'low_confidence_wrong';
  if (input.repeated || Number(input.occurrences || input.frequency || 0) >= 3) return 'repeated_error';
  if (input.missingWorking) return 'missing_working';
  if (input.incompleteWorking) return 'incomplete_working';
  if (input.methodDetected || input.detectedMethod) return 'incorrect_method';
  if (input.correct === false) return 'concept_gap';
  if (input.improved || input.strongImprovement) return 'strong_improvement';
  return 'concept_gap';
}

export function buildStudentInsight(input = {}) {
  const type = chooseTemplateType(input);
  const base = getInsightTemplate(type);
  const confidence = interpretConfidence({ correct: input.correct, confidence: input.confidence || input.confidenceLevel || input.reflection });
  const working = explainWorkingAnalysis(input.workingAnalysis || input);
  const remediation = input.remediation || input.recommendedSkillName || input.remediationSkillName
    ? explainRemediation(input)
    : null;

  const whatHappened = type === 'incorrect_method' ? working.observation : base.observation;
  const whyItHappened = confidence.pattern !== 'confidence_building' && input.correct === false
    ? confidence.student
    : type === 'incorrect_method'
      ? working.interpretation
      : base.interpretation;
  const howToFixIt = remediation?.recommendation || (type === 'incorrect_method' ? working.recommendation : base.recommendation);
  const nextStep = remediation?.nextStep || input.nextStep || howToFixIt;

  return {
    audience: 'student',
    type,
    observation: whatHappened,
    interpretation: whyItHappened,
    recommendation: howToFixIt,
    whatHappened,
    whyItHappened,
    howToFixIt,
    nextStep,
    confidenceInsight: confidence.student,
    workingInsight: working,
  };
}

export function buildParentInsight(input = {}) {
  const student = buildStudentInsight(input);
  const confidence = interpretConfidence({ correct: input.correct, confidence: input.confidence || input.confidenceLevel || input.reflection });
  const severity = clean(input.severity || input.priorityBand || (student.type === 'high_confidence_wrong' || student.type === 'repeated_error' ? 'high' : 'medium'));
  const issue = clean(input.skillName || input.currentFocus || input.recommendedSkillName || input.mistakeName, 'the current topic');
  return {
    audience: 'parent',
    severity,
    observation: student.observation,
    interpretation: confidence.parent || student.interpretation,
    recommendation: input.parentAction || `Spend 10 minutes reviewing ${issue}, then assign a short practice set.`,
    whatIsTheIssue: student.observation,
    howSerious: severity === 'high' ? 'Needs attention soon' : severity === 'low' ? 'Monitor' : 'Worth reviewing',
    whatCanIDo: input.parentAction || `Review ${issue} together and ask your child to explain each step aloud.`,
  };
}

export function buildTutorInsight(input = {}) {
  const student = buildStudentInsight(input);
  const confidence = interpretConfidence({ correct: input.correct, confidence: input.confidence || input.confidenceLevel || input.reflection });
  const count = Number(input.occurrences || input.frequency || input.mistakeCount || 0);
  const skill = clean(input.skillName || input.recommendedSkillName || input.rootCauseSkillName || 'the focus skill');
  return {
    audience: 'tutor',
    observation: count ? `${student.observation} Occurrences: ${count}.` : student.observation,
    interpretation: input.likelyCause || confidence.tutor || student.interpretation,
    recommendation: input.tutorAction || `Reteach ${skill}, then use guided practice and an exit check.`,
    evidenceSummary: [
      count ? `${count} ${plural(count, 'occurrence')}.` : '',
      input.evidenceSummary || '',
      student.workingInsight?.observation || '',
    ].filter(Boolean),
    suggestedIntervention: input.tutorAction || `Use visual models, guided examples, and an independent check for ${skill}.`,
  };
}

export function buildPositiveInsight(input = {}) {
  if (input.correct && input.workingSubmitted) {
    return {
      type: 'correct_clear_working',
      message: 'You solved this correctly and showed clear working.',
      observation: INSIGHT_TEMPLATES.correct_clear_working.observation,
      interpretation: INSIGHT_TEMPLATES.correct_clear_working.interpretation,
      recommendation: INSIGHT_TEMPLATES.correct_clear_working.recommendation,
    };
  }
  if (input.correct && input.workingNotNeeded) {
    return {
      type: 'no_working_correct',
      message: 'You completed this without needing working and answered correctly.',
      observation: INSIGHT_TEMPLATES.no_working_correct.observation,
      interpretation: INSIGHT_TEMPLATES.no_working_correct.interpretation,
      recommendation: INSIGHT_TEMPLATES.no_working_correct.recommendation,
    };
  }
  if (input.improved || input.strongImprovement) {
    return {
      type: 'strong_improvement',
      message: 'You improved compared with your previous attempt.',
      ...INSIGHT_TEMPLATES.strong_improvement,
    };
  }
  return null;
}

export function buildInsightSet(input = {}) {
  return {
    student: buildStudentInsight(input),
    parent: buildParentInsight(input),
    tutor: buildTutorInsight(input),
    confidence: interpretConfidence({ correct: input.correct, confidence: input.confidence || input.confidenceLevel || input.reflection }),
    working: explainWorkingAnalysis(input.workingAnalysis || input),
    remediation: explainRemediation(input),
    positive: buildPositiveInsight(input),
  };
}

export default {
  buildInsightSet,
  buildParentInsight,
  buildPositiveInsight,
  buildStudentInsight,
  buildTutorInsight,
  explainRemediation,
  explainWorkingAnalysis,
  getInsightTemplate,
  interpretConfidence,
  normalizeConfidence,
};
