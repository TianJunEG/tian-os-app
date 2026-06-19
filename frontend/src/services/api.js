import axios from 'axios';

// Resolve the API base URL.
// 1. An explicit VITE_API_URL (set at build time) always wins.
// 2. Otherwise, when the app is served from a real host (single-service
//    deployment: one Railway service serves both this frontend and the API),
//    default to a same-origin "/api" so no backend URL needs to be hardcoded.
// 3. Falling back to localhost only applies during local development.
const resolveApiBaseUrl = () => {
  const explicit = import.meta.env.VITE_API_URL;
  if (explicit) return explicit;
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    if (!isLocal) return '/api';
  }
  return 'http://localhost:5001/api';
};

const API_BASE_URL = resolveApiBaseUrl();

// Backend origin (without the /api suffix) for serving uploaded files.
// For the same-origin "/api" default this resolves to "" → "/uploads/..."
// which correctly points back at the serving host.
export const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Tian OS: scope every request to the active workspace. The backend enforces
  // membership; this is how school vs. private-tutoring data stay separated.
  const workspaceId = localStorage.getItem('tianos.workspaceId');
  if (workspaceId) {
    config.headers['X-Workspace-Id'] = workspaceId;
  }
  // For file uploads, drop the JSON content-type so the browser sets the
  // correct multipart/form-data boundary.
  if (config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

// Map any axios error to a single, consistent, student-friendly message so the
// whole app describes failures the same way (instead of each caller inventing
// its own copy or showing nothing). Used by callers via `error.userMessage`
// and by the global error toast below.
export function describeApiError(error) {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.error || error?.response?.data?.message;
  if (status === 400) return serverMessage || "That didn't go through. Please check and try again.";
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return serverMessage || "You don't have access to that.";
  if (status === 404) return serverMessage || "We couldn't find what you were looking for.";
  if (status === 408 || error?.code === 'ECONNABORTED') return 'That took too long. Please check your connection and try again.';
  if (status === 429) return "You're going a bit fast — please wait a moment and try again.";
  if (typeof status === 'number' && status >= 500) return 'Something went wrong on our end. Please try again in a moment.';
  if (!error?.response) return "We couldn't reach the server. Please check your connection and try again.";
  return serverMessage || 'Something went wrong. Please try again.';
}

// The axios interceptor runs outside React, so a component (mounted under the
// ToastProvider) registers a handler here to surface server/rate-limit errors.
let apiErrorHandler = null;
export function registerApiErrorHandler(fn) {
  apiErrorHandler = typeof fn === 'function' ? fn : null;
}

// Recover from a stale/orphaned active workspace, shared across concurrent
// requests: a single /context round-trip re-resolves a valid workspace, writes
// it to localStorage, and notifies WorkspaceContext. Memoized so a burst of
// workspace-scoped 4xx errors doesn't stampede /context with one recovery each.
// Resolves to the new workspace id (caller should retry) or null if there was
// nothing better to switch to (so a genuine permission error still surfaces).
let workspaceRecovery = null;
function recoverWorkspace() {
  if (!workspaceRecovery) {
    workspaceRecovery = (async () => {
      const { data } = await contextAPI.get();
      const list = data.workspaces || [];
      const current = localStorage.getItem('tianos.workspaceId');
      const stillValid = current && list.some((w) => String(w.id) === String(current));
      const nextId = stillValid ? null : (data.defaultWorkspaceId || list[0]?.id || null);
      if (!nextId || String(nextId) === String(current)) return null;
      localStorage.setItem('tianos.workspaceId', nextId);
      // Let WorkspaceContext re-sync its state + the workspace switcher label.
      window.dispatchEvent(new CustomEvent('tianos:workspace-recovered', { detail: { workspaceId: nextId } }));
      return nextId;
    })().finally(() => { workspaceRecovery = null; });
  }
  return workspaceRecovery;
}

// Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const serverError = error.response?.data?.error || '';
    const config = error.config || {};
    // Attach a consistent, user-facing message to every rejection so callers can
    // surface `error.userMessage` instead of inventing their own copy.
    error.userMessage = describeApiError(error);

    // Recover from a stale/orphaned active workspace. Workspace-scoped pages send
    // X-Workspace-Id from localStorage, which can point at a workspace that was
    // deleted or that the user is no longer a member of — or it can briefly lose
    // a race with WorkspaceContext on a hard navigation. Rather than dead-ending
    // on "Couldn't load…", re-resolve a valid workspace once and retry. We only
    // retry when we can pick a *different* valid workspace, so a genuine
    // permission error (stored workspace is valid but lacks access) still surfaces.
    const isWorkspaceError =
      (status === 403 && /not a member of this workspace/i.test(serverError)) ||
      (status === 400 && /no active workspace/i.test(serverError));
    if (isWorkspaceError && !config._wsRetried) {
      config._wsRetried = true;
      try {
        // The retried request re-runs the request interceptor, which re-reads the
        // corrected workspace id from localStorage — no need to set the header here.
        if (await recoverWorkspace()) return api(config);
      } catch (_) {
        // Could not re-resolve (e.g. /context failed); fall through to the
        // normal error handling below.
      }
    }

    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if ((status === 429 || (typeof status === 'number' && status >= 500))
      && !config.skipErrorToast && apiErrorHandler) {
      // Server/rate-limit errors otherwise fail silently (blank/stale screens).
      // Surface a single throttled toast; control-flow 4xx are left to callers.
      apiErrorHandler({ message: error.userMessage, status });
    }
    return Promise.reject(error);
  }
);

// Tian OS role/workspace context
export const contextAPI = {
  get: () => api.get('/context'),
  switch: (workspaceId) => api.post('/context/switch', { workspaceId }),
  entitlements: () => api.get('/context/entitlements')
};

// MathPath (Phase 2): mastery, topic map, practice sessions, mistakes.
export const diagnosticsAPI = {
  domains: () => api.get('/diagnostics/domains'),
  startDiagnostic: (data) => api.post('/diagnostics/start', data),
  answerDiagnostic: (sessionId, data) => api.post(`/diagnostics/${sessionId}/answer`, data),
  resumeDiagnostic: (sessionId) => api.get(`/diagnostics/${sessionId}/resume`),
  history: (params) => api.get('/diagnostics/history', { params }),
  growth: (params) => api.get('/diagnostics/growth', { params }),
  recheckSummary: (sessionId, params) => api.get(`/diagnostics/recheck-summary/${sessionId}`, { params }),
};

export const mathpathAPI = {
  mastery: (params) => api.get('/mastery', { params }),
  map: (params) => api.get('/mastery/map', { params }),
  graph: (params) => api.get('/mastery/graph', { params }),
  startDiagnostic: (data) => diagnosticsAPI.startDiagnostic({ subjectId: 'math', domainId: 'fractions', ...data }),
  answerDiagnostic: (sessionId, data) => diagnosticsAPI.answerDiagnostic(sessionId, data),
  submitDiagnostic: (sessionId, data) => api.post(`/mastery/diagnostic/${sessionId}/submit`, data),
  getDiagnostic: (sessionId) => api.get(`/mastery/diagnostic/${sessionId}`),
  getLatestDiagnostic: (params) => api.get('/mastery/diagnostic/latest', { params }),
  getDiagnosticHistory: (params) => diagnosticsAPI.history({ subjectId: 'math', domainId: 'fractions', ...params }),
  getDiagnosticGrowth: (params) => diagnosticsAPI.growth({ subjectId: 'math', domainId: 'fractions', ...params }),
  getRecheckSummary: (sessionId, params) => diagnosticsAPI.recheckSummary(sessionId, { subjectId: 'math', domainId: 'fractions', ...params }),
  resetTestStudentState: (data = {}) => api.post('/mastery/test/reset-state', data),
  // skipErrorToast: a start failure falls back to a local session, so a server
  // error here is recovered from and shouldn't raise a global error toast.
  // Decimals domain (second math domain) — persisted skill states + practice loop.
  decimalsSkillStates: () => api.get('/mathpath/decimals/skill-states'),
  startDecimalsPractice: (data = {}) => api.post('/mathpath/decimals/practice/start', data),
  submitDecimalsPractice: (practiceSessionId, data = {}) => api.post(`/mathpath/decimals/practice/${practiceSessionId}/submit`, data),
  startDecimalsFluency: (data = {}) => api.post('/mathpath/decimals/fluency/start', data),
  submitDecimalsFluency: (practiceSessionId, data = {}) => api.post(`/mathpath/decimals/fluency/${practiceSessionId}/submit`, data),
  decimalsAssessmentReadiness: () => api.get('/mathpath/decimals/assessment/readiness'),
  startDecimalsAssessment: (data = {}) => api.post('/mathpath/decimals/assessment/start', data),
  submitDecimalsAssessment: (practiceSessionId, data = {}) => api.post(`/mathpath/decimals/assessment/${practiceSessionId}/submit`, data),
  // Percentages domain — skill states + practice loop + fluency + retention.
  percentagesSkillStates: () => api.get('/mathpath/percentages/skill-states'),
  startPercentagesPractice: (data = {}) => api.post('/mathpath/percentages/practice/start', data),
  submitPercentagesPractice: (practiceSessionId, data = {}) => api.post(`/mathpath/percentages/practice/${practiceSessionId}/submit`, data),
  startPercentagesFluency: (data = {}) => api.post('/mathpath/percentages/fluency/start', data),
  submitPercentagesFluency: (practiceSessionId, data = {}) => api.post(`/mathpath/percentages/fluency/${practiceSessionId}/submit`, data),
  percentagesRetention: () => api.get('/mathpath/percentages/retention'),
  startPercentagesRetention: (data = {}) => api.post('/mathpath/percentages/retention/start', data),
  submitPercentagesRetention: (practiceSessionId, data = {}) => api.post(`/mathpath/percentages/retention/${practiceSessionId}/submit`, data),
  // Ratio & Rate domain — skill states + practice loop + fluency + retention.
  ratioRateSkillStates: () => api.get('/mathpath/ratio-rate/skill-states'),
  startRatioRatePractice: (data = {}) => api.post('/mathpath/ratio-rate/practice/start', data),
  submitRatioRatePractice: (practiceSessionId, data = {}) => api.post(`/mathpath/ratio-rate/practice/${practiceSessionId}/submit`, data),
  startRatioRateFluency: (data = {}) => api.post('/mathpath/ratio-rate/fluency/start', data),
  submitRatioRateFluency: (practiceSessionId, data = {}) => api.post(`/mathpath/ratio-rate/fluency/${practiceSessionId}/submit`, data),
  ratioRateRetention: () => api.get('/mathpath/ratio-rate/retention'),
  startRatioRateRetention: (data = {}) => api.post('/mathpath/ratio-rate/retention/start', data),
  submitRatioRateRetention: (practiceSessionId, data = {}) => api.post(`/mathpath/ratio-rate/retention/${practiceSessionId}/submit`, data),
  // Algebra domain — skill states + practice loop + fluency + retention.
  algebraSkillStates: () => api.get('/mathpath/algebra/skill-states'),
  startAlgebraPractice: (data = {}) => api.post('/mathpath/algebra/practice/start', data),
  submitAlgebraPractice: (practiceSessionId, data = {}) => api.post(`/mathpath/algebra/practice/${practiceSessionId}/submit`, data),
  startAlgebraFluency: (data = {}) => api.post('/mathpath/algebra/fluency/start', data),
  submitAlgebraFluency: (practiceSessionId, data = {}) => api.post(`/mathpath/algebra/fluency/${practiceSessionId}/submit`, data),
  algebraRetention: () => api.get('/mathpath/algebra/retention'),
  startAlgebraRetention: (data = {}) => api.post('/mathpath/algebra/retention/start', data),
  submitAlgebraRetention: (practiceSessionId, data = {}) => api.post(`/mathpath/algebra/retention/${practiceSessionId}/submit`, data),
  // Area & Perimeter domain
  areaPerimeterSkillStates: () => api.get('/mathpath/area-perimeter/skill-states'),
  startAreaPerimeterPractice: (data = {}) => api.post('/mathpath/area-perimeter/practice/start', data),
  submitAreaPerimeterPractice: (practiceSessionId, data = {}) => api.post(`/mathpath/area-perimeter/practice/${practiceSessionId}/submit`, data),
  // Circles domain
  circlesSkillStates: () => api.get('/mathpath/circles/skill-states'),
  startCirclesPractice: (data = {}) => api.post('/mathpath/circles/practice/start', data),
  submitCirclesPractice: (practiceSessionId, data = {}) => api.post(`/mathpath/circles/practice/${practiceSessionId}/submit`, data),
  // Geometry domain — skill states + practice loop + fluency + retention.
  geometrySkillStates: () => api.get('/mathpath/geometry/skill-states'),
  startGeometryPractice: (data = {}) => api.post('/mathpath/geometry/practice/start', data),
  submitGeometryPractice: (practiceSessionId, data = {}) => api.post(`/mathpath/geometry/practice/${practiceSessionId}/submit`, data),
  startGeometryFluency: (data = {}) => api.post('/mathpath/geometry/fluency/start', data),
  submitGeometryFluency: (practiceSessionId, data = {}) => api.post(`/mathpath/geometry/fluency/${practiceSessionId}/submit`, data),
  geometryRetention: () => api.get('/mathpath/geometry/retention'),
  startGeometryRetention: (data = {}) => api.post('/mathpath/geometry/retention/start', data),
  submitGeometryRetention: (practiceSessionId, data = {}) => api.post(`/mathpath/geometry/retention/${practiceSessionId}/submit`, data),
  // Measurement domain
  measurementSkillStates: () => api.get('/mathpath/measurement/skill-states'),
  startMeasurementPractice: (data = {}) => api.post('/mathpath/measurement/practice/start', data),
  submitMeasurementPractice: (practiceSessionId, data = {}) => api.post(`/mathpath/measurement/practice/${practiceSessionId}/submit`, data),
  // Money domain
  moneySkillStates: () => api.get('/mathpath/money/skill-states'),
  startMoneyPractice: (data = {}) => api.post('/mathpath/money/practice/start', data),
  submitMoneyPractice: (practiceSessionId, data = {}) => api.post(`/mathpath/money/practice/${practiceSessionId}/submit`, data),
  // Number Sense domain
  numberSenseSkillStates: () => api.get('/mathpath/number-sense/skill-states'),
  startNumberSensePractice: (data = {}) => api.post('/mathpath/number-sense/practice/start', data),
  submitNumberSensePractice: (practiceSessionId, data = {}) => api.post(`/mathpath/number-sense/practice/${practiceSessionId}/submit`, data),
  // Operations domain
  operationsSkillStates: () => api.get('/mathpath/operations/skill-states'),
  startOperationsPractice: (data = {}) => api.post('/mathpath/operations/practice/start', data),
  submitOperationsPractice: (practiceSessionId, data = {}) => api.post(`/mathpath/operations/practice/${practiceSessionId}/submit`, data),
  // Statistics domain
  statisticsSkillStates: () => api.get('/mathpath/statistics/skill-states'),
  startStatisticsPractice: (data = {}) => api.post('/mathpath/statistics/practice/start', data),
  submitStatisticsPractice: (practiceSessionId, data = {}) => api.post(`/mathpath/statistics/practice/${practiceSessionId}/submit`, data),
  // Time domain
  timeSkillStates: () => api.get('/mathpath/time/skill-states'),
  startTimePractice: (data = {}) => api.post('/mathpath/time/practice/start', data),
  submitTimePractice: (practiceSessionId, data = {}) => api.post(`/mathpath/time/practice/${practiceSessionId}/submit`, data),
  // Volume domain — skill states + practice loop + fluency + retention.
  volumeSkillStates: () => api.get('/mathpath/volume/skill-states'),
  startVolumePractice: (data = {}) => api.post('/mathpath/volume/practice/start', data),
  submitVolumePractice: (practiceSessionId, data = {}) => api.post(`/mathpath/volume/practice/${practiceSessionId}/submit`, data),
  startVolumeFluency: (data = {}) => api.post('/mathpath/volume/fluency/start', data),
  submitVolumeFluency: (practiceSessionId, data = {}) => api.post(`/mathpath/volume/fluency/${practiceSessionId}/submit`, data),
  volumeRetention: () => api.get('/mathpath/volume/retention'),
  startVolumeRetention: (data = {}) => api.post('/mathpath/volume/retention/start', data),
  submitVolumeRetention: (practiceSessionId, data = {}) => api.post(`/mathpath/volume/retention/${practiceSessionId}/submit`, data),
  startFractionPractice: (data = {}) => api.post('/mastery/fractions/practice/start', data, { skipErrorToast: true }),
  getFractionPractice: (practiceSessionId) => api.get(`/mastery/fractions/practice/${practiceSessionId}`),
  submitFractionPractice: (practiceSessionId, data = {}) => api.post(`/mastery/fractions/practice/${practiceSessionId}/submit`, data),
  submitP1Practice: (practiceSessionId, data = {}) => api.post(`/mastery/p1/practice/${practiceSessionId}/submit`, data),
  submitP3Practice: (practiceSessionId, data = {}) => api.post(`/mastery/p3/practice/${practiceSessionId}/submit`, data),
  // P1 practice persistence
  startP1Practice: (data = {}) => api.post('/mastery/p1/practice/start', data),
  getP1Practice: (practiceSessionId) => api.get(`/mastery/p1/practice/${practiceSessionId}`),
  submitP1Practice: (practiceSessionId, data = {}) => api.post(`/mastery/p1/practice/${practiceSessionId}/submit`, data),
  getP1SkillStates: () => api.get('/mastery/p1/skill-states'),
  // P2 practice persistence
  startP2Practice: (data = {}) => api.post('/mastery/p2/practice/start', data),
  getP2Practice: (practiceSessionId) => api.get(`/mastery/p2/practice/${practiceSessionId}`),
  submitP2Practice: (practiceSessionId, data = {}) => api.post(`/mastery/p2/practice/${practiceSessionId}/submit`, data),
  getP2SkillStates: () => api.get('/mastery/p2/skill-states'),
  // P3 practice persistence
  startP3Practice: (data = {}) => api.post('/mastery/p3/practice/start', data),
  getP3Practice: (practiceSessionId) => api.get(`/mastery/p3/practice/${practiceSessionId}`),
  submitP3Practice: (practiceSessionId, data = {}) => api.post(`/mastery/p3/practice/${practiceSessionId}/submit`, data),
  getP3SkillStates: () => api.get('/mastery/p3/skill-states'),
  // P4 practice persistence
  startP4Practice: (data = {}) => api.post('/mastery/p4/practice/start', data),
  getP4Practice: (practiceSessionId) => api.get(`/mastery/p4/practice/${practiceSessionId}`),
  submitP4Practice: (practiceSessionId, data = {}) => api.post(`/mastery/p4/practice/${practiceSessionId}/submit`, data),
  getP4SkillStates: () => api.get('/mastery/p4/skill-states'),
  // P5 practice persistence
  startP5Practice: (data = {}) => api.post('/mastery/p5/practice/start', data),
  getP5Practice: (practiceSessionId) => api.get(`/mastery/p5/practice/${practiceSessionId}`),
  submitP5Practice: (practiceSessionId, data = {}) => api.post(`/mastery/p5/practice/${practiceSessionId}/submit`, data),
  getP5SkillStates: () => api.get('/mastery/p5/skill-states'),
  // P6 practice persistence
  startP6Practice: (data = {}) => api.post('/mastery/p6/practice/start', data),
  getP6Practice: (practiceSessionId) => api.get(`/mastery/p6/practice/${practiceSessionId}`),
  submitP6Practice: (practiceSessionId, data = {}) => api.post(`/mastery/p6/practice/${practiceSessionId}/submit`, data),
  getP6SkillStates: () => api.get('/mastery/p6/skill-states'),
  getSkillStates: (studentId, domainIds = []) => api.get('/mastery/skill-states', { params: { studentId, domainIds: domainIds.join(',') } }),
  getAttempts: (studentId, domainIds = []) => api.get('/mastery/attempts', { params: { studentId, domainIds: domainIds.join(',') } }),
  startSession: (data) => api.post('/practice/sessions', data),
  attempt: (sessionId, data) => api.post(`/practice/sessions/${sessionId}/attempts`, data),
  complete: (sessionId) => api.post(`/practice/sessions/${sessionId}/complete`),
  getSession: (sessionId) => api.get(`/practice/sessions/${sessionId}`),
  fluency: (studentId) => api.get(studentId ? `/fluency/student/${studentId}` : '/fluency/me'),
  retention: (studentId) => api.get(studentId ? `/fluency/student/${studentId}/retention` : '/fluency/me/retention'),
  startFluencySession: (data) => api.post('/fluency/session/start', data),
  completeFluencySession: (data) => api.post('/fluency/session/complete', data),
  mistakes: (params) => api.get('/mistakes', { params }),
  mistake: (id) => api.get(`/mistakes/${id}`),
  recordMistakes: (mistakes) => api.post('/mistakes/bulk', { mistakes }),
  reviewMistake: (id, data) => api.post(`/mistakes/${id}/review`, data),
  updateMistakeLearning: (id, data) => api.patch(`/mistakes/${id}/learning`, data),
  explanationFeedback: (id, feedback) => api.patch(`/mistakes/${id}/explanation-feedback`, { feedback }),
  placement: (attempts) => api.post('/mastery/placement', { attempts }),
  modelTrainerTemplates: (params) => api.get('/mastery/fractions/model-trainer', { params }),
  modelTrainerForSkill: (skillId) => api.get(`/mastery/fractions/model-trainer/skill/${skillId}`),
  modelTrainerTemplate: (templateId) => api.get(`/mastery/fractions/model-trainer/${templateId}`),
  analyzeQuestionPattern: (data) => api.post('/mastery/fractions/question-patterns/analyze', data),
  generateQuestionPattern: (data) => api.post('/mastery/fractions/question-patterns/generate', data),
  approveQuestionPattern: (data) => api.post('/mastery/fractions/question-patterns/approve', data),
  similarPracticeSets: (params) => api.get('/mastery/fractions/similar-practice-sets', { params }),
  similarPracticeSet: (practiceSetId) => api.get(`/mastery/fractions/similar-practice-sets/${practiceSetId}`),
  startSimilarPractice: (practiceSetId, data = {}) => api.post(`/mastery/fractions/similar-practice-sets/${practiceSetId}/start`, data),
  submitSimilarPractice: (sessionId, data) => api.post(`/mastery/fractions/similar-practice/${sessionId}/submit`, data),
  createWorkingSession: (data) => api.post('/mathpath-working/sessions', data),
  createWorkingCode: (data) => api.post('/mathpath-working/codes', data),
  lookupWorkingCode: (workingCode) => api.get(`/mathpath-working/code/${workingCode}`),
  workingSession: (workingSessionId) => api.get(`/mathpath-working/${workingSessionId}`),
  pendingWorkings: (params = {}) => api.get('/mathpath-working/pending', { params }),
  workingReviewSummary: (params = {}) => api.get('/mathpath-working/review-summary', { params }),
  helpRequests: (params = {}) => api.get('/mathpath-working/help-requests', { params }),
  uploadWorking: (workingSessionId, formData) => api.post(`/mathpath-working/${workingSessionId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  markNoWorking: (workingSessionId, data) => api.post(`/mathpath-working/${workingSessionId}/no-working`, data),
  updateWorkingAnalysis: (workingSessionId, data) => api.post(`/mathpath-working/${workingSessionId}/analysis`, data),
  uploadPaperAnalysis: (formData) => api.post('/mathpath/paper-analysis/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  studentUploadPaper: (formData) => api.post('/mathpath/paper-analysis/student-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  paperAnalysis: (id) => api.get(`/mathpath/paper-analysis/${id}`),
  confirmOcrAnalysis: (id, data) => api.post(`/mathpath/paper-analysis/${id}/confirm-ocr`, data),
  reviewPaperAnalysis: (id, data) => api.patch(`/mathpath/paper-analysis/${id}/review`, data),
  assignPaperAnalysisPractice: (id, data = {}) => api.post(`/mathpath/paper-analysis/${id}/assign-practice`, data),
  createPaperAnalysisRecheck: (id, data = {}) => api.post(`/mathpath/paper-analysis/${id}/create-recheck`, data),
  createAssignmentFromDiagnostic: (data) => api.post('/mathpath/assignments/from-diagnostic', data),
  createAssignmentFromPaperAnalysis: (data) => api.post('/mathpath/assignments/from-paper-analysis', data),
  mathPathAssignments: (params = {}) => api.get('/mathpath/assignments', { params }),
  mathPathAssignment: (id) => api.get(`/mathpath/assignments/${id}`),
  mathPathRecoveryPackTeachingFlow: (id) => api.get(`/mathpath/assignments/${id}/teaching-flow`),
  updateMathPathRecoveryPackTeachingProgress: (id, data = {}) => api.patch(`/mathpath/assignments/${id}/teaching-progress`, data),
  updateMathPathAssignmentProgress: (id, data = {}) => api.patch(`/mathpath/assignments/${id}/progress`, data),
  recommendAssignmentRecheck: (id) => api.post(`/mathpath/assignments/${id}/recheck-recommendation`),
  createAssignmentRecheck: (id) => api.post(`/mathpath/assignments/${id}/create-recheck`),
  interventionFeed: (params = {}) => api.get('/interventions/feed', { params }),
  interventionAudit: () => api.get('/interventions/audit'),
  interventionEffectiveness: (params = {}) => api.get('/interventions/effectiveness', { params }),
  parentSuccessCentre: (params = {}) => api.get('/mathpath/success-centre/parent', { params }),
  parentProgressReport: (params = {}) => api.get('/mathpath/success-centre/parent/report', { params }),
  tutorLessonPrepPreview: (params = {}) => api.get('/mathpath/success-centre/tutor/lesson-prep', { params }),
  pilotSuccessMetrics: (params = {}) => api.get('/mathpath/success-centre/pilot-metrics', { params }),
  // ref: a slug string, or { skillId } / { skillSlug }
  remediation: (ref, recentAttempts = []) =>
    api.post('/mastery/remediation', { ...(typeof ref === 'string' ? { skillSlug: ref } : ref), recentAttempts }),
  remediationSessions: (params = {}) => api.get('/remediation-sessions', { params }),
  remediationSession: (id) => api.get(`/remediation-sessions/${id}`),
  startRemediationSession: (data) => api.post('/remediation-sessions', data),
  advanceRemediationStep: (id) => api.post(`/remediation-sessions/${id}/advance`),
  handleRemediationMastery: (id, data) => api.post(`/remediation-sessions/${id}/handle-mastery`, data),
  skipRemediationPrerequisite: (id, data) => api.post(`/remediation-sessions/${id}/skip-prerequisite`, data),
};

// Parent / family (Phase 3): children list + rule-based recommendations.
// (skillsAPI / assignmentsAPI / worksheetGenAPI live in the learning-core block below.)
export const familyAPI = {
  children: () => api.get('/family/children'),
  createChild: (data) => api.post('/students', data),
  recommendations: (studentId) => api.get(`/family/children/${studentId}/recommendations`)
};

export const studentProfileAPI = {
  overview: () => api.get('/student-profile'),
  summary: () => api.get('/student-profile/summary'),
  achievements: () => api.get('/student-profile/achievements'),
  timeline: () => api.get('/student-profile/timeline'),
  personalBests: () => api.get('/student-profile/personal-bests'),
  updateName: (name) => api.patch('/student-profile/name', { name }),
  updateVisualMode: (mode) => api.patch('/student-profile/visual-mode', { mode }),
};

export const studentCareAPI = {
  dashboard: (params = {}) => api.get('/student-care/dashboard', { params }),
  homework: (params = {}) => api.get('/student-care/homework', { params }),
  recoveryPacks: (params = {}) => api.get('/student-care/recovery-packs', { params }),
  rechecks: (params = {}) => api.get('/student-care/rechecks', { params }),
  reports: (params = {}) => api.get('/student-care/reports', { params }),
  parentSummary: (studentId, params = {}) => api.get(`/student-care/students/${studentId}/parent-summary`, { params }),
};

// Spelling Practice (Phase 6) — wired into the shared core (sessions, attempts,
// mastery, mistakes), module 'Spelling Practice' / subject English.
export const spellingPracticeAPI = {
  home: () => api.get('/spelling-practice/home'),
  lists: () => api.get('/spelling-practice/lists'),
  list: (id) => api.get(`/spelling-practice/lists/${id}`),
  startSession: (data) => api.post('/spelling-practice/sessions', data),
  attempt: (sessionId, data) => api.post(`/spelling-practice/sessions/${sessionId}/attempts`, data),
  complete: (sessionId) => api.post(`/spelling-practice/sessions/${sessionId}/complete`),
  getSession: (sessionId) => api.get(`/spelling-practice/sessions/${sessionId}`),
  mistakes: () => api.get('/spelling-practice/mistakes')
};

// LifeLab (Phase 6) — applied Math/Science activities. Teacher assign/review is
// workspace-scoped; student submit resolves the logged-in student.
export const lifelabAPI = {
  activities: (params) => api.get('/lifelab/activities', { params }),  // optional { subject, competency }
  assign: (data) => api.post('/lifelab/assign', data),                 // { classId, target, activityId }
  submissions: (classId) => api.get('/lifelab/submissions', { params: { classId } }),
  feedback: (id, data) => api.post(`/lifelab/submissions/${id}/feedback`, data),
  competencies: () => api.get('/lifelab/competencies'),             // canonical E21CC list
  me: () => api.get('/lifelab/me'),
  child: (studentId) => api.get(`/lifelab/student/${studentId}`),   // parent/guardian view
  submit: (id, data) => api.post(`/lifelab/submissions/${id}/submit`, data),
  uploadEvidence: (id, file) => {
    const fd = new FormData();
    fd.append('evidence', file);
    return api.post(`/lifelab/submissions/${id}/evidence`, fd);
  }
};

// Problem Solving Lab (PSL) — guided heuristic word-problem reasoning.
export const pslAPI = {
  home: () => api.get('/psl/home'),
  readiness: (skillId) => api.get(`/psl/skills/${skillId}/readiness`),
  startSession: (data) => api.post('/psl/sessions', data),
  getSession: (sessionId) => api.get(`/psl/sessions/${sessionId}`),
  submitStep: (sessionId, problemId, data) => api.post(`/psl/sessions/${sessionId}/problems/${problemId}/step`, data),
  getHint: (sessionId, problemId, stepId) => api.post(`/psl/sessions/${sessionId}/problems/${problemId}/hint`, { stepId }),
  completeProblem: (sessionId, problemId) => api.post(`/psl/sessions/${sessionId}/problems/${problemId}/complete`),
  completeSession: (sessionId) => api.post(`/psl/sessions/${sessionId}/complete`),
  abandonSession: (sessionId) => api.patch(`/psl/sessions/${sessionId}/abandon`),
  mistakes: () => api.get('/psl/mistakes'),
  getSolution: (sessionId, problemId) => api.get(`/psl/sessions/${sessionId}/problems/${problemId}/solution`),
  dashboard: (studentId) => api.get('/psl/dashboard', { params: { studentId } }),
};

// Mechanisms Playground (Secondary D&T). Completing a mechanism's concept check
// records practice/mistakes/mastery against the D&T skill in the shared core.
export const mechanismsAPI = {
  progress: () => api.get('/mechanisms/progress'),                      // { seeded, progress: { gears: {status,score}, ... } }
  complete: (key, answers) => api.post(`/mechanisms/${key}/complete`, { answers }), // answers: [{ index, correct }]
};

// Tutor workspace (Phase 4). All calls are scoped to the active tutor workspace
// (X-Workspace-Id); the backend enforces membership + tutor role.
export const tutorAPI = {
  home: () => api.get('/tutor/home'),
  students: () => api.get('/tutor/students'),
  student: (id) => api.get(`/tutor/students/${id}`),
  lessonPrep: (id) => api.get(`/tutor/students/${id}/lesson-prep`),
  assignLessonPrepRecoveryPack: (id, data) => api.post(`/tutor/students/${id}/lesson-prep/assign-recovery-pack`, data),
  lessonNotes: (id) => api.get(`/tutor/students/${id}/lesson-notes`),
  createLessonNote: (id, data) => api.post(`/tutor/students/${id}/lesson-notes`, data),
  sendLessonNote: (id, noteId) => api.post(`/tutor/students/${id}/lesson-notes/${noteId}/send`),
  mathPathLessonNotes: (params = {}) => api.get('/tutor/lesson-notes', { params }),
  createMathPathLessonNote: (data) => api.post('/tutor/lesson-notes', data),
  homework: () => api.get('/tutor/homework'),
  availability: () => api.get('/tutor/availability'),
  updateAvailability: (data) => api.put('/tutor/availability', data),
  certification: () => api.get('/tutor/certification'),
  pslDashboard: (studentId) => api.get(`/tutor/students/${studentId}/psl/dashboard`),
  mistake: (studentId, mistakeId) => api.get(`/tutor/students/${studentId}/mistakes/${mistakeId}`),
  saveExplanation: (studentId, mistakeId, data) => api.post(`/tutor/students/${studentId}/mistakes/${mistakeId}/explanation`, data),
  uploadExplanationAudio: (studentId, mistakeId, formData) =>
    api.post(`/tutor/students/${studentId}/mistakes/${mistakeId}/explanation-audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const tutorInviteAPI = {
  create: (data = {}) => api.post('/tutor/invites', data),
  preview: (token) => api.get(`/tutor/invites/${token}`),
  accept: (token, data = {}) => api.post(`/tutor/invites/${token}/accept`, data),
};

// In-app notifications (user-scoped, spans all of a parent's children).
export const notificationsAPI = {
  list: (params = {}) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
};

// Lesson recordings. Tutor capture (workspace-scoped) + parent replay.
export const recordingsAPI = {
  create: (data) => api.post('/tutor/recordings', data),
  appendInk: (rid, events) => api.post(`/tutor/recordings/${rid}/ink`, { events }),
  uploadAudio: (rid, formData) => api.post(`/tutor/recordings/${rid}/audio`, formData),
  finalise: (rid, data = {}) => api.post(`/tutor/recordings/${rid}/finalise`, data),
  setVisibility: (rid, visibility) => api.patch(`/tutor/recordings/${rid}`, { visibility }),
  get: (rid) => api.get(`/tutor/recordings/${rid}`),
  remove: (rid) => api.delete(`/tutor/recordings/${rid}`),
  // Parent side
  childRecordings: (studentId) => api.get(`/family/children/${studentId}/recordings`),
  parentRecording: (rid) => api.get(`/family/recordings/${rid}`),
};

// Gap B — agency admin + tutor self-service.
export const agencyAPI = {
  overview: () => api.get('/agency/overview'),
  tutors: () => api.get('/agency/tutors'),
  tutorPlans: () => api.get('/agency/tutor-plans'),
  createTutorPlan: (data) => api.post('/agency/tutor-plans', data),
  grantTrial: (tutorUserId, planId) => api.post(`/agency/tutors/${tutorUserId}/grant-trial`, { planId }),
  connectOnboard: () => api.post('/agency/connect/onboard'),
  connectStatus: () => api.get('/agency/connect/status'),
  charges: () => api.get('/agency/charges'),
  // Tutor self-service
  membership: () => api.get('/agency/membership'),
  pay: () => api.post('/agency/membership/pay'),
};

// Gap B — platform-admin licence blocks for a partner org.
export const adminLicenceAPI = {
  list: (pid) => api.get(`/admin/partners/${pid}/licence`),
  add: (pid, data) => api.post(`/admin/partners/${pid}/licence`, data),
  update: (pid, licenceId, data) => api.patch(`/admin/partners/${pid}/licence/${licenceId}`, data),
};

// Gap C — consented tutor<->school-student linking.
export const studentLinksAPI = {
  tutorRequest: (studentId) => api.post('/student-links/tutor/request', { studentId }),
  requests: () => api.get('/student-links/requests'),
  consent: (id, scopes) => api.post(`/student-links/requests/${id}/consent`, scopes ? { scopes } : {}),
  decline: (id) => api.post(`/student-links/requests/${id}/decline`),
  mine: () => api.get('/student-links/mine'),
  setScopes: (id, scopes) => api.patch(`/student-links/${id}/scopes`, { scopes }),
  revoke: (id) => api.post(`/student-links/${id}/revoke`),
  issueClaimCode: (studentId) => api.post('/student-links/claim-code/issue', { studentId }),
  redeemClaimCode: (code) => api.post('/student-links/claim-code/redeem', { code }),
};

// Teacher workspace (Phase 5). Scoped to the active school/teacher workspace.
export const teacherAPI = {
  home: () => api.get('/teacher/home'),
  classes: () => api.get('/teacher/classes'),
  classOverview: (id) => api.get(`/teacher/classes/${id}`),
  classMastery: (id, subject) => api.get(`/teacher/classes/${id}/mastery`, { params: subject ? { subject } : {} }),
  classStudents: (id) => api.get(`/teacher/classes/${id}/students`),
  classDashboard: (id, subject) => api.get(`/teacher/classes/${id}/dashboard`, { params: subject ? { subject } : {} }),
  student: (id) => api.get(`/teacher/students/${id}`),
  groups: (id) => api.get(`/teacher/classes/${id}/groups`),
  saveGroup: (id, data) => api.post(`/teacher/classes/${id}/groups`, data),
  assign: (id, data) => api.post(`/teacher/classes/${id}/assign`, data),
  interventions: (id) => api.get(`/teacher/classes/${id}/interventions`),
  interventionOverview: (id, params) => api.get(`/teacher/classes/${id}/intervention-overview`, { params }),
  createIntervention: (id, data) => api.post(`/teacher/classes/${id}/interventions`, data),
  updateIntervention: (iid, data) => api.put(`/teacher/interventions/${iid}`, data),
  weakGroups: (id, params) => api.get(`/teacher/classes/${id}/weak-groups`, { params }),
  assignWeakGroupRecovery: (id, skillId, data = {}) => api.post(`/teacher/classes/${id}/weak-groups/${skillId}/assign-recovery`, data),
  generateWeakGroupWorksheet: (id, skillId, data = {}) => api.post(`/teacher/classes/${id}/weak-groups/${skillId}/generate-worksheet`, data),
  assignWeakGroupRecheck: (id, skillId, data = {}) => api.post(`/teacher/classes/${id}/weak-groups/${skillId}/assign-recheck`, data),
  report: (id, params) => api.get(`/teacher/classes/${id}/reports`, { params }),
  pslDashboard: (id) => api.get(`/teacher/classes/${id}/psl/dashboard`),
  studentPslSessions: (studentId) => api.get(`/teacher/students/${studentId}/psl/sessions`),
  studentPslSession: (studentId, sessionId) => api.get(`/teacher/students/${studentId}/psl/sessions/${sessionId}`),
  // Informal assessments
  assessments: (classId) => api.get('/teacher/assessments', { params: { classId } }),
  assessment: (id) => api.get(`/teacher/assessments/${id}`),
  previewAssessment: (data) => api.post('/teacher/assessments/preview', data),
  createAssessment: (data) => api.post('/teacher/assessments', data),
  assignAssessment: (id, data) => api.post(`/teacher/assessments/${id}/assign`, data),
  assessmentResults: (id) => api.get(`/teacher/assessments/${id}/results`),
  closeAssessment: (id) => api.post(`/teacher/assessments/${id}/close`),
  deleteAssessment: (id) => api.delete(`/teacher/assessments/${id}`),
};

// School-aligned Test Mode specifications (Table of Specification).
export const assessmentSpecificationAPI = {
  listMine: (params) => api.get('/assessment-specifications/mine', { params }),
  create: (data) => api.post('/assessment-specifications', data),
  update: (id, data) => api.put(`/assessment-specifications/${id}`, data),
  generateTest: (id, data = {}) => api.post(`/assessment-specifications/${id}/generate`, data),
  submitSession: (assessmentSessionId, data = {}) => api.post(`/assessment-specifications/sessions/${assessmentSessionId}/submit`, data),
  classResults: (id) => api.get(`/assessment-specifications/${id}/class-results`),
  generatedPaperBlueprint: (id, params = {}) => api.get(`/assessment-specifications/${id}/generated-paper-blueprint`, { params }),
};

export const assessmentBlueprintAPI = {
  list: (params = {}) => api.get('/assessment-blueprints', { params }),
  get: (id, params = {}) => api.get(`/assessment-blueprints/${id}`, { params }),
  create: (data) => api.post('/assessment-blueprints', data),
  update: (id, data) => api.put(`/assessment-blueprints/${id}`, data),
  archive: (id) => api.post(`/assessment-blueprints/${id}/archive`),
  duplicate: (id, data = {}) => api.post(`/assessment-blueprints/${id}/duplicate`, data),
  validate: (data) => api.post('/assessment-blueprints/validate', data),
  versions: (id) => api.get(`/assessment-blueprints/${id}/versions`),
  testBlueprint: (id) => api.get(`/assessment-blueprints/${id}/test-blueprint`),
  libraryExamples: () => api.get('/assessment-blueprints/library/examples'),
  seedLibrary: () => api.post('/assessment-blueprints/library/seed'),
  uploadAnalyze: (formData) => api.post('/assessment-blueprints/upload-analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  schoolProfiles: (params = {}) => api.get('/assessment-blueprints/school-profiles', { params }),
};

export const assessmentUploadAPI = {
  list: (params = {}) => api.get('/assessment-uploads', { params }),
  upload: (formData) => api.post('/assessment-uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  status: (uploadId) => api.get(`/assessment-uploads/${uploadId}/status`),
  blueprint: (uploadId) => api.get(`/assessment-uploads/${uploadId}/blueprint`),
  metadata: (uploadId) => api.get(`/assessment-uploads/${uploadId}/metadata`),
  deletionLogs: (uploadId) => api.get(`/assessment-uploads/${uploadId}/deletion-logs`),
};

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data)
};

// Tutors API
export const tutorsAPI = {
  createProfile: (data) => api.post('/tutors/profile', data),
  completeOnboarding: (data) => api.post('/tutors/onboarding', data),
  getAllTutors: (params) => api.get('/tutors', { params }),
  getTutorProfile: (id) => api.get(`/tutors/${id}`),
  getMyProfile: () => api.get('/tutors/me/profile'),
  updateAvailability: (data) => api.put('/tutors/availability', data)
};

// Parents API
export const parentsAPI = {
  createProfile: (data) => api.post('/parents/profile', data),
  getProfile: () => api.get('/parents/profile'),
  updateProfile: (data) => api.put('/parents/profile', data),
  // Unified, domain-aware MathPath parent dashboard (replaces hand-assembling
  // mastery/mistakes/fluency/retention client-side).
  mathPathDashboard: ({ studentId, subjectId = 'math', domainId = 'fractions' }) =>
    api.get(`/parents/${studentId}/mathpath/dashboard`, { params: { subjectId, domainId } }),
  mathPathDomains: ({ studentId, subjectId = 'math' }) =>
    api.get(`/parents/${studentId}/mathpath/domains`, { params: { subjectId } }),
};

// BrightDesk integration API
export const integrationsAPI = {
  generateBrightdeskToken: (studentId) =>
    api.post('/integrations/brightdesk/generate-token', { studentId }),
};

// Partners API
export const partnersAPI = {
  submitInquiry: (data) => api.post('/partners/inquiries', data),
  getInquiries: (params) => api.get('/partners/inquiries', { params }),
  updateInquiryStatus: (id, status) => api.patch(`/partners/inquiries/${id}`, { status })
};

// Resources API
export const resourcesAPI = {
  list: (params) => api.get('/resources', { params }),
  getBySlug: (slug) => api.get(`/resources/${slug}`),
  adminList: () => api.get('/resources/admin'),
  create: (formData) =>
    api.post('/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) =>
    api.put(`/resources/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/resources/${id}`),
  unlock: (slug, data) => api.post(`/resources/${slug}/unlock`, data),
  getLeads: () => api.get('/resources/leads'),
  generateImage: (slug, { prompt, size } = {}) =>
    api.post(`/resources/${slug}/generate-image`, { prompt }, { params: size ? { size } : {} }),
  removeImage: (slug, imageId) => api.delete(`/resources/${slug}/images/${imageId}`),
};

// Search API
export const searchAPI = {
  searchTutors: (data) => api.post('/search/tutors', data),
  getRecommendations: () => api.get('/search/recommendations'),
  getCategories: () => api.get('/search/categories')
};

// Bookings API
export const bookingsAPI = {
  createBooking: (data) => api.post('/bookings', data),
  getBookings: (params) => api.get('/bookings', { params }),
  getBooking: (id) => api.get(`/bookings/${id}`),
  confirmBooking: (id) => api.put(`/bookings/${id}/confirm`),
  checkinBooking: (id) => api.put(`/bookings/${id}/checkin`),
  submitSessionNotes: (id, data) => api.post(`/bookings/${id}/notes`, data),
  getSessionNotes: (id) => api.get(`/bookings/${id}/notes`),
  getParentProgress: (parentId) => api.get(`/bookings/parent/${parentId}/progress`),
  cancelBooking: (id, data) => api.put(`/bookings/${id}/cancel`, data)
};

// Payments API
export const paymentsAPI = {
  createPaymentIntent: (data) => api.post('/payments/create-intent', data),
  confirmPayment: (data) => api.post('/payments/confirm', data),
  getPayment: (bookingId) => api.get(`/payments/${bookingId}`)
};

// Messages API
export const messagesAPI = {
  createConversation: (data) => api.post('/messages/conversations', data),
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId, params) =>
    api.get(`/messages/${conversationId}`, { params }),
  sendMessage: (data) => api.post('/messages', data),
  editMessage: (id, data) => api.put(`/messages/${id}`, data),
  deleteMessage: (id) => api.delete(`/messages/${id}`)
};

// Spelling API
export const spellingAPI = {
  getLists: () => api.get('/spelling/lists'),
  getList: (id) => api.get(`/spelling/lists/${id}`),
  createList: (data) => api.post('/spelling/lists', data),
  updateList: (id, data) => api.put(`/spelling/lists/${id}`, data),
  deleteList: (id) => api.delete(`/spelling/lists/${id}`),
  shareList: (id, data) => api.put(`/spelling/lists/${id}/share`, data),
  copyList: (id) => api.post(`/spelling/lists/${id}/copy`),
  getLibrary: (params) => api.get('/spelling/library', { params }),
  getMisspelt: (params) => api.get('/spelling/misspelt', { params }),
  getSurprise: (params) => api.get('/spelling/surprise', { params }),
  getRevision: (params) => api.get('/spelling/revision', { params }),
  getDue: (params) => api.get('/spelling/due', { params }),
  getStats: () => api.get('/spelling/stats'),
  getGamification: () => api.get('/spelling/gamification'),
  recordAttempts: (data) => api.post('/spelling/attempts', data),
  // Uses native fetch so the browser sets the multipart boundary correctly.
  extractFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/spelling/extract`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  }
};

// Worksheets API (math misconception practice generator)
export const worksheetsAPI = {
  generate: (formData) => api.post('/worksheets/generate', formData),
  list: () => api.get('/worksheets'),
  get: (id) => api.get(`/worksheets/${id}`),
  updateSession: (id, n, data) => api.patch(`/worksheets/${id}/sessions/${n}`, data),
  markSession: (id, n, data) => api.post(`/worksheets/${id}/sessions/${n}/mark`, data),
  reinforce: (id, data) => api.post(`/worksheets/${id}/reinforce`, data),
  mistakes: (params) => api.get('/worksheets/mistakes', { params }),
  remove: (id) => api.delete(`/worksheets/${id}`)
};

// Students API (student logins managed by a parent/tutor)
export const studentsAPI = {
  create: (data) => api.post('/students', data),
  list: () => api.get('/students'),
  remove: (id) => api.delete(`/students/${id}`)
};

// ── Tian OS learning core extensions ──
// Practice / mistakes / mastery already live on `mathpathAPI` (above). These add
// the catalog, assignment, and worksheet-generator surfaces. Student-facing calls
// omit studentId (backend resolves from the logged-in user); parent calls pass it.
export const skillsAPI = {
  list: (params) => api.get('/skills', { params })           // { studentId?, group: 'fluency' }
};

export const mathpathFluencyAPI = {
  summary: (studentId) => api.get(studentId ? `/fluency/student/${studentId}` : '/fluency/me'),
  retention: (studentId) => api.get(studentId ? `/fluency/student/${studentId}/retention` : '/fluency/me/retention'),
  start: (data) => api.post('/fluency/session/start', data),
  complete: (data) => api.post('/fluency/session/complete', data),
};

export const assignmentsAPI = {
  create: (data) => api.post('/assignments', data),
  list: (params) => api.get('/assignments', { params }),     // { studentId?, status? }
  get: (id) => api.get(`/assignments/${id}`),
  updateStatus: (id, data) => api.patch(`/assignments/${id}/status`, data)
};

export const informalAssessmentAPI = {
  get: (sessionId) => api.get(`/assessments/student/${sessionId}`),
  start: (sessionId) => api.post(`/assessments/student/${sessionId}/start`),
  submit: (sessionId, answers) => api.post(`/assessments/student/${sessionId}/submit`, { answers }),
};

// Structured Mastery Worksheet Generator (digital first; PDF placeholder).
export const worksheetGenAPI = {
  generate: (data) => api.post('/worksheets/gen/generate', data),
  generateIntervention: (data) => api.post('/worksheets/gen/intervention', data),
  interventionHistory: (params) => api.get('/worksheets/gen/intervention/history', { params }),
  list: (params) => api.get('/worksheets/gen', { params }),
  get: (id) => api.get(`/worksheets/gen/${id}`),
  assign: (id, data) => api.post(`/worksheets/gen/${id}/assign`, data),
  answers: (id) => api.get(`/worksheets/${id}/answers`),
  submit: (id, data) => api.post(`/worksheets/${id}/submit`, data),
  pdfUrl: (id, { answers = false } = {}) => `${API_BASE_URL}/worksheets/${id}/pdf${answers ? '?answers=1' : ''}`,
  generatePersonalised: (data) => api.post('/worksheets/generate', data),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getMathPathPilot: (params) => api.get('/admin/mathpath-pilot', { params }),
  getPilotAnalytics: (params) => api.get('/admin/pilot-analytics', { params }),
  getPilotInterventionMetrics: (params) => api.get('/admin/pilot/intervention-metrics', { params }),
  getPilotInterventionSummary: (params) => api.get('/admin/pilot/intervention-summary', { params }),
  getQuestionQuality: (params) => api.get('/admin/question-quality', { params }),
  getFractionsSkillIntegrity: () => api.get('/admin/fractions-skill-integrity'),
  getQuestionVisualQuality: (params) => api.get('/admin/question-visual-quality', { params }),
  getDiagnosticValidation: (params) => api.get('/admin/diagnostic-validation', { params }),
  getRemediationQuality: (params) => api.get('/admin/remediation-quality', { params }),
  getLearningPathQuality: (params) => api.get('/admin/learning-path-quality', { params }),
  getRecoveryPackAssets: (params) => api.get('/admin/recovery-pack-assets', { params }),
  getMistakeLearningAudit: (params) => api.get('/admin/mistake-learning-audit', { params }),
  getDomainHealth: () => api.get('/admin/domain-health'),
  getMisconceptionCoverage: () => api.get('/admin/misconception-coverage'),
  getBilling: (params) => api.get('/admin/billing', { params }),
  upsertBillingSubscription: (data) => api.post('/admin/billing/subscriptions', data),
  getPartnerBilling: (partnerId) => api.get(`/admin/billing/partner/${partnerId}`),
  getUsers: (params) => api.get('/admin/users', { params }),
  getVerificationQueue: (params) => api.get('/admin/verification-queue', { params }),
  verifyTutor: (tutorId, data) => api.put(`/admin/verification/${tutorId}`, data),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getDisputes: (params) => api.get('/admin/disputes', { params }),
  resolveDispute: (bookingId, data) => api.put(`/admin/disputes/${bookingId}/resolve`, data),
  listPartners: () => api.get('/admin/partners'),
  createPartner: (data) => api.post('/admin/partners', data),
  getPartner: (partnerId) => api.get(`/admin/partners/${partnerId}`),
  updatePartner: (partnerId, data) => api.patch(`/admin/partners/${partnerId}`, data),
  archivePartner: (partnerId) => api.post(`/admin/partners/${partnerId}/archive`),
  addPartnerStaff: (partnerId, data) => api.post(`/admin/partners/${partnerId}/staff`, data),
  removePartnerStaff: (partnerId, membershipId) => api.delete(`/admin/partners/${partnerId}/staff/${membershipId}`),
  linkPartnerStudent: (partnerId, data) => api.post(`/admin/partners/${partnerId}/students`, data),
  removePartnerStudent: (partnerId, partnerStudentId) => api.delete(`/admin/partners/${partnerId}/students/${partnerStudentId}`),
  getPartnerImpactReport: (partnerId) => api.get(`/admin/partners/${partnerId}/impact-report`)
};

// School administrator console (HOD / IT) — onboarding + roster management.
export const schoolAdminAPI = {
  overview: () => api.get('/school-admin/overview'),
  createClass: (data) => api.post('/school-admin/classes', data),
  createStudent: (data) => api.post('/school-admin/students', data),
  bulkImport: (data) => api.post('/school-admin/students/bulk', data),
  createJoinCode: (classId, data = {}) => api.post(`/school-admin/classes/${classId}/join-code`, data),
  getJoinCode: (classId) => api.get(`/school-admin/classes/${classId}/join-code`),
};

// Parent email invitations (school version) + view-only school children.
export const parentInvitesAPI = {
  create: (data) => api.post('/parent-invites', data),
  preview: (token) => api.get(`/parent-invites/${token}`),
  accept: (token, data = {}) => api.post(`/parent-invites/${token}/accept`, data),
  myChildren: () => api.get('/parent-invites/children/list'),
};

// Student self-enrolment via a class join code.
export const joinAPI = {
  preview: (code) => api.get(`/join/${code}`),
  redeem: (code) => api.post(`/join/${code}`),
};

// Trial + Premium Home checkout.
export const billingAPI = {
  me: () => api.get('/billing/me'),
  startTrial: () => api.post('/billing/start-trial'),
  // Annual PayNow flow (primary parent path).
  premiumHomeOffer: () => api.get('/billing/premium-home/offer'),
  requestUpgrade: () => api.post('/billing/premium-home/request'),
  pendingUpgrades: () => api.get('/billing/premium-home/pending'),
  activateUpgrade: (id) => api.post(`/billing/premium-home/requests/${id}/activate`),
  rejectUpgrade: (id, note = '') => api.post(`/billing/premium-home/requests/${id}/reject`, { note }),
  // Stripe PayNow: create a dynamic QR code for instant self-serve payment.
  paynowCreate: () => api.post('/billing/paynow/create'),
  paynowStatus: (piId) => api.get(`/billing/paynow/status/${piId}`),
  // Legacy Stripe card path.
  checkoutPremiumHome: (billing = 'monthly') => api.post('/billing/checkout/premium-home', { billing }),
  confirmCheckout: (sessionId) => api.post('/billing/checkout/confirm', { sessionId }),
  devActivatePremiumHome: () => api.post('/billing/dev/activate-premium-home'),
};

export const learningTelemetryAPI = {
  recordEvent: (data) => api.post('/telemetry/events', data),
  studentAnalytics: (params) => api.get('/student/analytics', { params }),
  skillAnalytics: (params) => api.get('/skills/analytics', { params }),
};

// Reviews API
export const reviewsAPI = {
  createReview: (data) => api.post('/reviews', data),
  getUserReviews: (userId, params) =>
    api.get(`/reviews/user/${userId}`, { params }),
  getReview: (id) => api.get(`/reviews/${id}`),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  deleteReview: (id) => api.delete(`/reviews/${id}`)
};

// Learning API — the unified cross-app progress profile (Spelling + Math apps + Science).
export const learningAPI = {
  getProfile: () => api.get('/learning/profile'),
  postResult: (data) => api.post('/learning/result', data),
  getChildren: () => api.get('/learning/children'),
  addChild: (data) => api.post('/learning/children', data),
  getChildProfile: (childId) => api.get(`/learning/children/${childId}/profile`)
};

export const comicsAPI = {
  complete: (episodeId, problems) => api.post(`/comics/${episodeId}/complete`, { problems }),
  progress: () => api.get('/comics/progress'),
  recommended: () => api.get('/comics/recommended'),
};

// Science API — P6 science revision bank (open-ended Q&A).
export const scienceAPI = {
  topics: () => api.get('/science/topics'),
  questions: (topic, limit = 10) => api.get('/science/questions', { params: { topic, limit } })
};

export default api;
