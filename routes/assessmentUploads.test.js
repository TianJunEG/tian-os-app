import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

let mockUser = { id: 'user_parent_1', role: 'parent', roles: ['parent'] };
const uploads = new Map();
let uploadSeq = 1;
const STUDENT_ID = '507f1f77bcf86cd799439011';

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeId(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.toString) return value.toString();
  return String(value);
}

class UploadDoc {
  constructor(data = {}) {
    this._id = data._id || `upload_${uploadSeq++}`;
    this.ownerId = data.ownerId;
    this.ownerType = data.ownerType;
    this.workspaceId = data.workspaceId || null;
    this.studentId = data.studentId || null;
    this.classId = data.classId || null;
    this.fileName = data.fileName || '';
    this.fileMimeType = data.fileMimeType || '';
    this.fileSizeBytes = data.fileSizeBytes || 0;
    this.uploadDate = data.uploadDate || new Date();
    this.status = data.status || 'uploaded';
    this.consentAccepted = Boolean(data.consentAccepted);
    this.analysisStartedAt = data.analysisStartedAt || null;
    this.analysisCompletedAt = data.analysisCompletedAt || null;
    this.deleteCompletedAt = data.deleteCompletedAt || null;
    this.deletionVerified = Boolean(data.deletionVerified);
    this.processingLogs = data.processingLogs || [];
    this.extractedAssessmentType = data.extractedAssessmentType || '';
    this.extractedDurationMinutes = data.extractedDurationMinutes || 0;
    this.extractedTotalMarks = data.extractedTotalMarks || 0;
    this.extractedSectionCount = data.extractedSectionCount || 0;
    this.extractedQuestionCount = data.extractedQuestionCount || 0;
    this.extractedTopicDistribution = data.extractedTopicDistribution || [];
    this.extractedDifficultyProfile = data.extractedDifficultyProfile || {};
    this.extractedQuestionStyles = data.extractedQuestionStyles || [];
    this.questionMetadata = data.questionMetadata || [];
    this.diagramMetadata = data.diagramMetadata || [];
    this.blueprintId = data.blueprintId || null;
    this.errorMessage = data.errorMessage || '';
  }

  async save() {
    uploads.set(String(this._id), this);
    return this;
  }
}

function findUploads(query = {}) {
  const rows = [...uploads.values()].filter((doc) => {
    if (query.ownerId && normalizeId(doc.ownerId) !== normalizeId(query.ownerId)) return false;
    if (query.status && doc.status !== query.status) return false;
    if (query.ownerType && doc.ownerType !== query.ownerType) return false;
    return true;
  });
  rows.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  return rows;
}

vi.mock('multer', () => {
  const multerMock = Object.assign(
    () => ({
      single: () => (req, _res, next) => {
        req.file = req.body?.__file || null;
        next();
      },
    }),
    {
      memoryStorage: () => ({}),
    }
  );
  return { default: multerMock };
});

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = mockUser;
    next();
  },
}));

vi.mock('../models/mathpath/UploadedAssessment.js', () => ({
  default: {
    create: vi.fn(async (data) => {
      const doc = new UploadDoc(data);
      uploads.set(String(doc._id), doc);
      return doc;
    }),
    find: vi.fn((query = {}) => ({
      sort: () => ({
        limit: async (limit) => findUploads(query).slice(0, limit).map((doc) => plain(doc)),
      }),
    })),
    findById: vi.fn(async (id) => uploads.get(String(id)) || null),
  },
}));

vi.mock('../models/mathpath/AssessmentBlueprint.js', () => ({
  default: {
    findById: vi.fn((id) => ({
      lean: async () => (String(id) === 'bp_1' ? { _id: 'bp_1', title: 'Derived Blueprint' } : null),
    })),
  },
}));

vi.mock('../models/StudentGuardian.js', () => ({
  default: {
    findOne: vi.fn(async (query) => {
      if (normalizeId(query.guardianUserId) === normalizeId(mockUser.id) && normalizeId(query.studentId) === STUDENT_ID) {
        return { workspaceId: 'ws_parent_1' };
      }
      return null;
    }),
  },
}));

vi.mock('../models/Student.js', () => ({
  default: {
    findOne: vi.fn(async () => null),
  },
}));

vi.mock('../models/TutorStudentLink.js', () => ({
  default: {
    findOne: vi.fn(async () => null),
  },
}));

vi.mock('../models/ClassStudent.js', () => ({
  default: {
    findOne: vi.fn(async () => null),
  },
}));

vi.mock('../models/Class.js', () => ({
  default: {
    findOne: vi.fn(async () => null),
  },
}));

vi.mock('../services/mathpath/assessmentAnalysisService.js', () => ({
  REQUIRED_UPLOAD_CONSENT: 'I understand the uploaded file will be automatically deleted after analysis.',
  normalizeUploadConsent: (value) => String(value).toLowerCase() === 'true',
  writeTemporaryUploadFile: vi.fn(async () => '/tmp/mock-assessment.pdf'),
  deleteTemporaryUploadFile: vi.fn(async () => ({ deleted: true, verified: true })),
  extractAssessmentMetadataFromBuffer: vi.fn(async () => ({
    rawText: 'mock text',
    blueprintPayload: {
      title: 'Uploaded Blueprint',
      level: 'P6',
      subject: 'Math',
      sections: [{ name: 'Section A', marks: 20, questionCount: 10, questionTypes: ['short_answer'] }],
      topics: [{ topic: 'Fractions', marks: 20, weightage: 100, difficulty: 'standard' }],
      totalMarks: 20,
      durationMinutes: 30,
      calculatorAllowed: false,
      assessmentType: 'WA',
    },
    questionMetadata: [
      { topic: 'Fractions', skill: 'F010', marks: 2, difficulty: 'medium', questionStyle: 'short_answer', diagramType: 'none', cognitiveLevel: 'Procedural' },
    ],
    diagramMetadata: [{ diagramType: 'number_line', count: 1 }],
    analysisSummary: {
      assessmentType: 'WA',
      durationMinutes: 30,
      calculatorAllowed: false,
      totalMarks: 20,
      sectionCount: 1,
      questionCount: 10,
      topicDistribution: [{ topic: 'Fractions', marks: 20, weightage: 100, difficulty: 'medium' }],
      difficultyProfile: { basic: 40, standard: 60 },
      questionStyles: [{ questionStyle: 'short_answer', count: 1 }],
      diagramMetadata: [{ diagramType: 'number_line', count: 1 }],
    },
  })),
  createBlueprintFromUpload: vi.fn(async () => ({
    blueprintDoc: { _id: 'bp_1', title: 'Derived Blueprint' },
    schoolProfile: { school: 'Generic', level: 'P6' },
  })),
}));

let router;

function parseQuery(path) {
  const query = {};
  const [pathname, queryString = ''] = String(path || '').split('?');
  const params = new URLSearchParams(queryString);
  for (const [key, value] of params.entries()) query[key] = value;
  return { pathname, query };
}

async function request(path, { method = 'GET', body, headers } = {}) {
  const { pathname, query } = parseQuery(path);
  return new Promise((resolve, reject) => {
    const req = {
      method: String(method || 'GET').toUpperCase(),
      url: path,
      path: pathname,
      originalUrl: path,
      query,
      body: body || {},
      headers: Object.fromEntries(
        Object.entries(headers || {}).map(([k, v]) => [k.toLowerCase(), v])
      ),
      params: {},
      header(name) {
        return this.headers[String(name || '').toLowerCase()];
      },
    };

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ status: this.statusCode, data: payload });
      },
      send(payload) {
        resolve({ status: this.statusCode, data: payload });
      },
    };

    router.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve({ status: res.statusCode, data: null });
    });
  });
}

describe('assessmentUploads routes (API contract)', () => {
  beforeAll(async () => {
    const mod = await import('./assessmentUploads.js');
    router = mod.default;
  });

  afterEach(() => {
    uploads.clear();
    uploadSeq = 1;
    mockUser = { id: 'user_parent_1', role: 'parent', roles: ['parent'] };
  });

  it('supports upload + metadata + blueprint + deletion logs flow', async () => {
    const uploadRes = await request('/', {
      method: 'POST',
      body: {
        consentAccepted: 'true',
        studentId: STUDENT_ID,
        __file: {
          buffer: Buffer.from('fake-pdf-content'),
          originalname: 'paper.pdf',
          mimetype: 'application/pdf',
          size: 4096,
        },
      },
    });
    expect(uploadRes.status).toBe(201);
    expect(uploadRes.data.originalFileDeleted).toBe(true);
    expect(uploadRes.data.upload.status).toBe('deleted');

    const uploadId = uploadRes.data.upload.uploadId;
    const statusRes = await request(`/${uploadId}/status`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.data.upload.status).toBe('deleted');
    expect(Array.isArray(statusRes.data.processingLogs)).toBe(true);

    const metadataRes = await request(`/${uploadId}/metadata`);
    expect(metadataRes.status).toBe(200);
    expect(Array.isArray(metadataRes.data.questionMetadata)).toBe(true);
    expect(Array.isArray(metadataRes.data.diagramMetadata)).toBe(true);

    const blueprintRes = await request(`/${uploadId}/blueprint`);
    expect(blueprintRes.status).toBe(200);
    expect(blueprintRes.data.blueprint._id).toBe('bp_1');

    const deletionRes = await request(`/${uploadId}/deletion-logs`);
    expect(deletionRes.status).toBe(200);
    expect(deletionRes.data.deletionVerified).toBe(true);
    expect(Array.isArray(deletionRes.data.logs)).toBe(true);
  });

  it('requires consent before upload', async () => {
    const res = await request('/', {
      method: 'POST',
      body: {
        consentAccepted: 'false',
        studentId: STUDENT_ID,
        __file: {
          buffer: Buffer.from('fake-pdf-content'),
          originalname: 'paper.pdf',
          mimetype: 'application/pdf',
          size: 4096,
        },
      },
    });
    expect(res.status).toBe(400);
    expect(String(res.data.error || '').toLowerCase()).toContain('consent');
  });

  it('blocks access to another user upload record', async () => {
    const foreign = new UploadDoc({
      _id: 'upload_foreign',
      ownerId: 'another_user',
      ownerType: 'parent',
      fileName: 'paper.pdf',
      status: 'deleted',
    });
    await foreign.save();

    const res = await request('/upload_foreign/status');
    expect(res.status).toBe(403);
  });
});
