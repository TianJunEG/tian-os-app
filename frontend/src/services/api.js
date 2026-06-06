import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Backend origin (without the /api suffix) for serving uploaded files.
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

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Tian OS role/workspace context
export const contextAPI = {
  get: () => api.get('/context'),
  switch: (workspaceId) => api.post('/context/switch', { workspaceId })
};

// MathPath (Phase 2): mastery, topic map, practice sessions, mistakes.
export const diagnosticsAPI = {
  domains: () => api.get('/diagnostics/domains'),
  startDiagnostic: (data) => api.post('/diagnostics/start', data),
  answerDiagnostic: (sessionId, data) => api.post(`/diagnostics/${sessionId}/answer`, data),
  history: (params) => api.get('/diagnostics/history', { params }),
  growth: (params) => api.get('/diagnostics/growth', { params }),
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
  resetTestStudentState: (data = {}) => api.post('/mastery/test/reset-state', data),
  startFractionPractice: (data = {}) => api.post('/mastery/fractions/practice/start', data),
  getFractionPractice: (practiceSessionId) => api.get(`/mastery/fractions/practice/${practiceSessionId}`),
  submitFractionPractice: (practiceSessionId, data = {}) => api.post(`/mastery/fractions/practice/${practiceSessionId}/submit`, data),
  startSession: (data) => api.post('/practice/sessions', data),
  attempt: (sessionId, data) => api.post(`/practice/sessions/${sessionId}/attempts`, data),
  complete: (sessionId) => api.post(`/practice/sessions/${sessionId}/complete`),
  getSession: (sessionId) => api.get(`/practice/sessions/${sessionId}`),
  fluency: (studentId) => api.get(studentId ? `/fluency/student/${studentId}` : '/fluency/me'),
  retention: (studentId) => api.get(studentId ? `/fluency/student/${studentId}/retention` : '/fluency/me/retention'),
  startFluencySession: (data) => api.post('/fluency/session/start', data),
  completeFluencySession: (data) => api.post('/fluency/session/complete', data),
  mistakes: (params) => api.get('/mistakes', { params }),
  recordMistakes: (mistakes) => api.post('/mistakes/bulk', { mistakes }),
  reviewMistake: (id, data) => api.post(`/mistakes/${id}/review`, data),
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
  paperAnalysis: (id) => api.get(`/mathpath/paper-analysis/${id}`),
  reviewPaperAnalysis: (id, data) => api.patch(`/mathpath/paper-analysis/${id}/review`, data),
  assignPaperAnalysisPractice: (id, data = {}) => api.post(`/mathpath/paper-analysis/${id}/assign-practice`, data),
  createPaperAnalysisRecheck: (id, data = {}) => api.post(`/mathpath/paper-analysis/${id}/create-recheck`, data),
  createAssignmentFromDiagnostic: (data) => api.post('/mathpath/assignments/from-diagnostic', data),
  createAssignmentFromPaperAnalysis: (data) => api.post('/mathpath/assignments/from-paper-analysis', data),
  mathPathAssignments: (params = {}) => api.get('/mathpath/assignments', { params }),
  mathPathAssignment: (id) => api.get(`/mathpath/assignments/${id}`),
  updateMathPathAssignmentProgress: (id, data = {}) => api.patch(`/mathpath/assignments/${id}/progress`, data),
  recommendAssignmentRecheck: (id) => api.post(`/mathpath/assignments/${id}/recheck-recommendation`),
  createAssignmentRecheck: (id) => api.post(`/mathpath/assignments/${id}/create-recheck`),
  parentSuccessCentre: (params = {}) => api.get('/mathpath/success-centre/parent', { params }),
  parentProgressReport: (params = {}) => api.get('/mathpath/success-centre/parent/report', { params }),
  tutorLessonPrepPreview: (params = {}) => api.get('/mathpath/success-centre/tutor/lesson-prep', { params }),
  pilotSuccessMetrics: (params = {}) => api.get('/mathpath/success-centre/pilot-metrics', { params }),
  // ref: a slug string, or { skillId } / { skillSlug }
  remediation: (ref, recentAttempts = []) =>
    api.post('/mastery/remediation', { ...(typeof ref === 'string' ? { skillSlug: ref } : ref), recentAttempts })
};

// Parent / family (Phase 3): children list + rule-based recommendations.
// (skillsAPI / assignmentsAPI / worksheetGenAPI live in the learning-core block below.)
export const familyAPI = {
  children: () => api.get('/family/children'),
  recommendations: (studentId) => api.get(`/family/children/${studentId}/recommendations`)
};

export const studentProfileAPI = {
  overview: () => api.get('/student-profile'),
  summary: () => api.get('/student-profile/summary'),
  achievements: () => api.get('/student-profile/achievements'),
  timeline: () => api.get('/student-profile/timeline'),
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
  submit: (id, data) => api.post(`/lifelab/submissions/${id}/submit`, data)
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
  mathPathLessonNotes: (params = {}) => api.get('/tutor/lesson-notes', { params }),
  createMathPathLessonNote: (data) => api.post('/tutor/lesson-notes', data),
  homework: () => api.get('/tutor/homework'),
  availability: () => api.get('/tutor/availability'),
  updateAvailability: (data) => api.put('/tutor/availability', data),
  certification: () => api.get('/tutor/certification')
};

export const tutorInviteAPI = {
  create: (data = {}) => api.post('/tutor/invites', data),
  preview: (token) => api.get(`/tutor/invites/${token}`),
  accept: (token, data = {}) => api.post(`/tutor/invites/${token}/accept`, data),
};

// Teacher workspace (Phase 5). Scoped to the active school/teacher workspace.
export const teacherAPI = {
  home: () => api.get('/teacher/home'),
  classes: () => api.get('/teacher/classes'),
  classOverview: (id) => api.get(`/teacher/classes/${id}`),
  classMastery: (id, subject) => api.get(`/teacher/classes/${id}/mastery`, { params: subject ? { subject } : {} }),
  classStudents: (id) => api.get(`/teacher/classes/${id}/students`),
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
  report: (id, params) => api.get(`/teacher/classes/${id}/reports`, { params })
};

// School-aligned Test Mode specifications (Table of Specification).
export const assessmentSpecificationAPI = {
  listMine: (params) => api.get('/assessment-specifications/mine', { params }),
  create: (data) => api.post('/assessment-specifications', data),
  update: (id, data) => api.put(`/assessment-specifications/${id}`, data),
  generateTest: (id, data = {}) => api.post(`/assessment-specifications/${id}/generate`, data),
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
  updateProfile: (data) => api.put('/parents/profile', data)
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
  getLeads: () => api.get('/resources/leads')
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

// Science API — P6 science revision bank (open-ended Q&A).
export const scienceAPI = {
  topics: () => api.get('/science/topics'),
  questions: (topic, limit = 10) => api.get('/science/questions', { params: { topic, limit } })
};

export default api;
