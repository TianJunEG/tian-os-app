import { getQuestionFamily } from '../fractions/fractionQuestionFamilies.js';

const WORKING_SESSION_STORE = new Map();
const WORKING_SUBMISSION_STORE = new Map();
const QUESTION_WORKING_MAP_STORE = new Map();
const NO_WORKING_REQUIRED_STORE = new Map();

const SESSION_STATUS = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  MAPPED: 'mapped',
  ANALYSIS_READY: 'analysisReady',
};

const SUBMISSION_STATUS = {
  STORED: 'stored',
  LINKED: 'linked',
};

const MAPPING_STATUS = {
  UNMAPPED: 'unmapped',
  AUTO_MAPPED: 'autoMapped',
  MANUALLY_MAPPED: 'manuallyMapped',
  MISSING: 'missing',
};

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateInputMethod(inputMethod) {
  const allowed = new Set(['paper', 'stylus', 'hybrid']);
  return allowed.has(String(inputMethod || '').toLowerCase())
    ? String(inputMethod).toLowerCase()
    : 'paper';
}

function isAllowedNoWorking({ questionFamily, systemAllowsNoWorking = false }) {
  if (systemAllowsNoWorking) return true;
  if (!questionFamily) return false;
  if (questionFamily.mentalMathEligible) return true;
  if (!questionFamily.workingRequired) return true;
  return false;
}

function getSession(workingSessionId) {
  return WORKING_SESSION_STORE.get(workingSessionId) || null;
}

function setSession(session) {
  WORKING_SESSION_STORE.set(session.workingSessionId, session);
  return session;
}

function getMapsForSession(workingSessionId) {
  return QUESTION_WORKING_MAP_STORE.get(workingSessionId) || [];
}

function setMapsForSession(workingSessionId, maps) {
  QUESTION_WORKING_MAP_STORE.set(workingSessionId, maps);
  return maps;
}

export function createWorkingSession(options = {}) {
  const {
    studentId,
    practiceSessionId = null,
    assessmentSessionId = null,
    domainId = 'fractions',
    skillIds = [],
    questionIds = [],
    inputMethod = 'paper',
  } = options;

  if (!studentId) throw new Error('studentId is required.');

  const session = {
    workingSessionId: makeId('workingsession'),
    studentId,
    practiceSessionId,
    assessmentSessionId,
    domainId,
    skillIds: [...new Set(skillIds)],
    questionIds: [...new Set(questionIds)],
    inputMethod: validateInputMethod(inputMethod),
    status: SESSION_STATUS.PENDING,
    createdAt: nowIso(),
    submittedAt: null,
  };

  setSession(session);
  return clone(session);
}

export function markWorkingExpected(questionId, questionFamily) {
  const family = typeof questionFamily === 'string' ? getQuestionFamily(questionFamily) : questionFamily;
  const workingRequired = Boolean(family?.workingRequired) && !Boolean(family?.mentalMathEligible);
  const reason = workingRequired
    ? 'Question family requires visible mathematical working.'
    : 'Mental math or non-working family.';
  return { questionId, workingRequired, reason };
}

function storeSubmissionAndLinkSession(submission) {
  WORKING_SUBMISSION_STORE.set(submission.workingSubmissionId, submission);
  const session = getSession(submission.workingSessionId);
  if (session) {
    session.status = SESSION_STATUS.SUBMITTED;
    session.submittedAt = nowIso();
    setSession(session);
  }
  return submission;
}

export function submitPaperWorking(options = {}) {
  const { workingSessionId, studentId, fileUrls = [], pageCount = 0 } = options;
  const session = getSession(workingSessionId);
  if (!session) throw new Error('Invalid workingSessionId.');
  if (session.studentId !== studentId) throw new Error('studentId does not match working session.');

  const submission = {
    workingSubmissionId: makeId('workingsub'),
    workingSessionId,
    studentId,
    inputMethod: 'paper',
    fileUrls: Array.isArray(fileUrls) ? fileUrls : [],
    digitalInkData: null,
    uploadedAt: nowIso(),
    pageCount: Number(pageCount || 0),
    status: SUBMISSION_STATUS.STORED,
  };

  return clone(storeSubmissionAndLinkSession(submission));
}

export function submitStylusWorking(options = {}) {
  const { workingSessionId, studentId, digitalInkData = null } = options;
  const session = getSession(workingSessionId);
  if (!session) throw new Error('Invalid workingSessionId.');
  if (session.studentId !== studentId) throw new Error('studentId does not match working session.');

  const pages = Array.isArray(digitalInkData?.pages) ? digitalInkData.pages.length : 0;
  const submission = {
    workingSubmissionId: makeId('workingsub'),
    workingSessionId,
    studentId,
    inputMethod: 'stylus',
    fileUrls: [],
    digitalInkData,
    uploadedAt: nowIso(),
    pageCount: pages,
    status: SUBMISSION_STATUS.STORED,
  };

  return clone(storeSubmissionAndLinkSession(submission));
}

export function createQuestionWorkingMap(options = {}) {
  const { workingSessionId, questionIds = [], workingRequiredMap = {} } = options;
  const session = getSession(workingSessionId);
  if (!session) throw new Error('Invalid workingSessionId.');

  const existing = getMapsForSession(workingSessionId);
  const existingByQ = new Map(existing.map((m) => [m.questionId, m]));

  const maps = questionIds.map((questionId, idx) => {
    const prior = existingByQ.get(questionId);
    if (prior) return prior;

    const requiredInfo = workingRequiredMap[questionId] || { workingRequired: false };
    return {
      questionId,
      workingSessionId,
      workingSubmissionId: null,
      pageNumber: idx + 1,
      detectedLabel: null,
      mappingStatus: MAPPING_STATUS.UNMAPPED,
      workingRequired: Boolean(requiredInfo.workingRequired),
      noWorkingRequiredChecked: false,
    };
  });

  setMapsForSession(workingSessionId, maps);
  return clone(maps);
}

export function markNoWorkingRequired(questionId, reason, options = {}) {
  const { questionFamilyId = null, systemAllowsNoWorking = false } = options;
  const family = questionFamilyId ? getQuestionFamily(questionFamilyId) : null;
  const allowed = isAllowedNoWorking({ questionFamily: family, systemAllowsNoWorking });
  if (!allowed) {
    return {
      accepted: false,
      questionId,
      reason: 'No-working-required not allowed for this question family.',
    };
  }

  NO_WORKING_REQUIRED_STORE.set(questionId, {
    questionId,
    reason: reason || 'No written working needed.',
    markedAt: nowIso(),
    questionFamilyId,
  });

  for (const [sessionId, maps] of QUESTION_WORKING_MAP_STORE.entries()) {
    const next = maps.map((map) =>
      map.questionId === questionId
        ? { ...map, noWorkingRequiredChecked: true, mappingStatus: MAPPING_STATUS.MANUALLY_MAPPED }
        : map
    );
    setMapsForSession(sessionId, next);
  }

  return {
    accepted: true,
    questionId,
    reason: reason || 'No written working needed.',
  };
}

function mapSubmissionsToQuestions(workingSessionId) {
  const maps = getMapsForSession(workingSessionId);
  const submissions = [...WORKING_SUBMISSION_STORE.values()].filter((s) => s.workingSessionId === workingSessionId);
  const primarySubmission = submissions[submissions.length - 1] || null;

  const next = maps.map((map, idx) => {
    const flaggedNoWorking = NO_WORKING_REQUIRED_STORE.has(map.questionId) || map.noWorkingRequiredChecked;
    if (!map.workingRequired || flaggedNoWorking) {
      return {
        ...map,
        noWorkingRequiredChecked: true,
        mappingStatus: map.mappingStatus === MAPPING_STATUS.UNMAPPED ? MAPPING_STATUS.MANUALLY_MAPPED : map.mappingStatus,
      };
    }

    if (!primarySubmission) {
      return { ...map, mappingStatus: MAPPING_STATUS.MISSING, workingSubmissionId: null };
    }

    const hasPage = Number(primarySubmission.pageCount || 0) >= idx + 1;
    return {
      ...map,
      workingSubmissionId: primarySubmission.workingSubmissionId,
      pageNumber: idx + 1,
      mappingStatus: hasPage ? MAPPING_STATUS.AUTO_MAPPED : MAPPING_STATUS.MISSING,
    };
  });

  setMapsForSession(workingSessionId, next);
  return next;
}

export function getMissingWorkingQuestions(workingSession) {
  const session = typeof workingSession === 'string' ? getSession(workingSession) : workingSession;
  if (!session) return [];
  const maps = getMapsForSession(session.workingSessionId);
  return maps
    .filter((map) => map.workingRequired && !map.noWorkingRequiredChecked && map.mappingStatus === MAPPING_STATUS.MISSING)
    .map((map) => map.questionId);
}

export function prepareWorkingForAnalysis(workingSessionId) {
  const session = getSession(workingSessionId);
  if (!session) throw new Error('Invalid workingSessionId.');

  const mapped = mapSubmissionsToQuestions(workingSessionId);
  const missingWorkingQuestions = mapped
    .filter((map) => map.workingRequired && !map.noWorkingRequiredChecked && map.mappingStatus === MAPPING_STATUS.MISSING)
    .map((map) => map.questionId);
  const mappedQuestions = mapped
    .filter((map) => [MAPPING_STATUS.AUTO_MAPPED, MAPPING_STATUS.MANUALLY_MAPPED].includes(map.mappingStatus))
    .map((map) => map.questionId);

  session.status = SESSION_STATUS.ANALYSIS_READY;
  setSession(session);

  return {
    workingSessionId,
    status: SESSION_STATUS.ANALYSIS_READY,
    mappedQuestions,
    missingWorkingQuestions,
  };
}

export function validateWorkingUploadWorkflow() {
  const session = createWorkingSession({
    studentId: 'student_work_1',
    practiceSessionId: 'practice_1',
    domainId: 'fractions',
    skillIds: ['F003', 'F010'],
    questionIds: ['Q1', 'Q2', 'Q3'],
    inputMethod: 'hybrid',
  });

  const mentalMark = markWorkingExpected('Q1', 'QF_F001_001');
  const requiredMark = markWorkingExpected('Q2', 'QF_F003_002');

  const map = createQuestionWorkingMap({
    workingSessionId: session.workingSessionId,
    questionIds: ['Q1', 'Q2', 'Q3'],
    workingRequiredMap: {
      Q1: mentalMark,
      Q2: requiredMark,
      Q3: requiredMark,
    },
  });

  const paperSubmission = submitPaperWorking({
    workingSessionId: session.workingSessionId,
    studentId: session.studentId,
    fileUrls: ['https://example.com/page1.jpg', 'https://example.com/page2.jpg'],
    pageCount: 2,
  });

  const stylusSession = createWorkingSession({
    studentId: 'student_work_2',
    practiceSessionId: 'practice_2',
    domainId: 'fractions',
    skillIds: ['F016'],
    questionIds: ['Q10'],
    inputMethod: 'stylus',
  });

  const stylusSubmission = submitStylusWorking({
    workingSessionId: stylusSession.workingSessionId,
    studentId: stylusSession.studentId,
    digitalInkData: { pages: [{ strokes: [] }], metadata: { pressure: true } },
  });

  const disallowedNoWorking = markNoWorkingRequired('Q2', 'Skipped working', {
    questionFamilyId: 'QF_F003_002',
    systemAllowsNoWorking: false,
  });
  const allowedNoWorking = markNoWorkingRequired('Q1', 'Mental math', {
    questionFamilyId: 'QF_F001_001',
    systemAllowsNoWorking: false,
  });

  const analysis = prepareWorkingForAnalysis(session.workingSessionId);
  const missing = getMissingWorkingQuestions(session.workingSessionId);

  return {
    isValid:
      Boolean(session.workingSessionId) &&
      Boolean(paperSubmission.workingSubmissionId) &&
      Boolean(stylusSubmission.workingSubmissionId) &&
      mentalMark.workingRequired === false &&
      requiredMark.workingRequired === true &&
      missing.includes('Q3') &&
      disallowedNoWorking.accepted === false &&
      allowedNoWorking.accepted === true &&
      analysis.status === SESSION_STATUS.ANALYSIS_READY,
    checks: {
      sessionCreated: Boolean(session.workingSessionId),
      paperStored: Boolean(paperSubmission.workingSubmissionId),
      stylusStored: Boolean(stylusSubmission.workingSubmissionId),
      mentalMathNoWorkingRequired: mentalMark.workingRequired === false,
      workingRequiredFlagged: requiredMark.workingRequired === true,
      missingWorkingDetected: missing.includes('Q3'),
      noWorkingRuleEnforced: disallowedNoWorking.accepted === false && allowedNoWorking.accepted === true,
      analysisReady: analysis.status === SESSION_STATUS.ANALYSIS_READY,
    },
    sample: {
      session,
      map,
      paperSubmission,
      stylusSubmission,
      analysis,
      missingWorking: missing,
    },
  };
}

export const workingUploadWorkflow = {
  createWorkingSession,
  markWorkingExpected,
  submitPaperWorking,
  submitStylusWorking,
  createQuestionWorkingMap,
  markNoWorkingRequired,
  getMissingWorkingQuestions,
  prepareWorkingForAnalysis,
  validateWorkingUploadWorkflow,
  SESSION_STATUS,
  SUBMISSION_STATUS,
  MAPPING_STATUS,
};

export default workingUploadWorkflow;
