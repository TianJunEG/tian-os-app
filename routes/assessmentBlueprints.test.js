import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const MOCK_USER_ID = 'u_1';
const MOCK_WORKSPACE_ID = 'ws_1';

const store = new Map();
const versionsById = new Map();
let nextId = 1;

function makeBlueprint(data = {}) {
  const id = data._id || `bp_${nextId++}`;
  return {
    _id: id,
    title: data.title || 'Blueprint',
    level: data.level || 'P5',
    subject: data.subject || 'Math',
    school: data.school || 'Generic',
    assessmentType: data.assessmentType || 'WA',
    durationMinutes: data.durationMinutes ?? 60,
    totalMarks: data.totalMarks ?? 50,
    calculatorAllowed: data.calculatorAllowed ?? false,
    timed: data.timed ?? true,
    status: data.status || 'active',
    sections: data.sections || [],
    topics: data.topics || [],
    requiredDiagramTypes: data.requiredDiagramTypes || [],
    questionMetadata: data.questionMetadata || [],
    createdByUserId: data.createdByUserId || MOCK_USER_ID,
    createdBy: data.createdBy || MOCK_USER_ID,
    workspaceId: data.workspaceId || MOCK_WORKSPACE_ID,
    blueprintVersion: data.blueprintVersion ?? 1,
  };
}

vi.mock('../middleware/auth.js', () => ({
  protect: (req, _res, next) => {
    req.user = { id: MOCK_USER_ID, role: 'teacher', roles: ['teacher'] };
    req.workspaceId = MOCK_WORKSPACE_ID;
    next();
  },
}));

vi.mock('../models/mathpath/AssessmentBlueprint.js', () => ({
  default: {
    findById: vi.fn(async (id) => store.get(String(id)) || null),
  },
}));

vi.mock('../models/mathpath/SchoolAssessmentProfile.js', () => ({
  default: {
    find: vi.fn(() => ({
      sort: () => ({
        limit: async () => [],
      }),
    })),
  },
}));

vi.mock('../services/mathpath/assessmentBlueprintEngine.js', () => ({
  SAMPLE_ASSESSMENT_BLUEPRINTS: [{ title: 'P3 WA' }, { title: 'P4 WA' }],
  listAssessmentBlueprints: vi.fn(async () => [...store.values()]),
  validateAssessmentBlueprint: vi.fn((payload) => {
    if (!payload?.title) return { valid: false, errors: ['title is required.'], normalized: payload };
    return { valid: true, errors: [], normalized: payload };
  }),
  createAssessmentBlueprint: vi.fn(async (payload) => {
    const blueprint = makeBlueprint(payload);
    store.set(String(blueprint._id), blueprint);
    versionsById.set(String(blueprint._id), [{ versionNumber: 1, changeType: 'create' }]);
    return blueprint;
  }),
  updateAssessmentBlueprint: vi.fn(async (id, payload) => {
    const current = store.get(String(id));
    const updated = makeBlueprint({ ...current, ...payload, _id: String(id), blueprintVersion: (current?.blueprintVersion || 1) + 1 });
    store.set(String(id), updated);
    const versions = versionsById.get(String(id)) || [];
    versions.push({ versionNumber: updated.blueprintVersion, changeType: 'update' });
    versionsById.set(String(id), versions);
    return updated;
  }),
  archiveAssessmentBlueprint: vi.fn(async (id) => {
    const current = store.get(String(id));
    const archived = makeBlueprint({ ...current, _id: String(id), status: 'archived', blueprintVersion: (current?.blueprintVersion || 1) + 1 });
    store.set(String(id), archived);
    const versions = versionsById.get(String(id)) || [];
    versions.push({ versionNumber: archived.blueprintVersion, changeType: 'archive' });
    versionsById.set(String(id), versions);
    return archived;
  }),
  duplicateAssessmentBlueprint: vi.fn(async (id, options = {}) => {
    const source = store.get(String(id));
    const duplicated = makeBlueprint({
      ...source,
      _id: undefined,
      title: options.title || `${source?.title || 'Blueprint'} (Copy)`,
      status: 'draft',
      blueprintVersion: 1,
    });
    store.set(String(duplicated._id), duplicated);
    versionsById.set(String(duplicated._id), [{ versionNumber: 1, changeType: 'duplicate' }]);
    return duplicated;
  }),
  getAssessmentBlueprintById: vi.fn(async (id, { includeVersions = false } = {}) => {
    const blueprint = store.get(String(id));
    if (!blueprint) return null;
    if (!includeVersions) return blueprint;
    return { blueprint, versions: versionsById.get(String(id)) || [] };
  }),
  getBlueprintVersions: vi.fn(async (id) => versionsById.get(String(id)) || []),
  generateTestBlueprint: vi.fn(async (blueprint) => ({
    sections: blueprint.sections || [],
    marks: { totalMarks: blueprint.totalMarks || 0 },
    timing: { timed: blueprint.timed !== false, durationMinutes: blueprint.durationMinutes || 0 },
    topics: blueprint.topics || [],
    cognitiveMix: { Recall: 20, Procedural: 40, Application: 30, ComplexApplication: 10 },
  })),
  seedSampleAssessmentBlueprints: vi.fn(async () => []),
  upsertSchoolAssessmentProfileFromBlueprint: vi.fn(async () => ({ school: 'Generic' })),
  extractBlueprintFromUploadedPdf: vi.fn(async () => makeBlueprint({ title: 'Uploaded Blueprint' })),
}));

let router;

function parseQuery(path) {
  const query = {};
  const [pathname, queryString = ''] = String(path || '').split('?');
  const params = new URLSearchParams(queryString);
  for (const [key, value] of params.entries()) query[key] = value;
  return { pathname, query };
}

async function request(path, { method = 'GET', body } = {}) {
  const { pathname, query } = parseQuery(path);
  return new Promise((resolve, reject) => {
    const req = {
      method: String(method || 'GET').toUpperCase(),
      url: path,
      path: pathname,
      originalUrl: path,
      query,
      body: body || {},
      headers: {},
      params: {},
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

describe('assessmentBlueprints routes (API contract)', () => {
  beforeAll(async () => {
    const mod = await import('./assessmentBlueprints.js');
    router = mod.default;
  });

  afterEach(() => {
    store.clear();
    versionsById.clear();
    nextId = 1;
  });

  it('supports validate/create/list/get/update/archive/duplicate/test-blueprint endpoints', async () => {
    const payload = {
      title: 'Route Blueprint',
      level: 'P5',
      subject: 'Math',
      durationMinutes: 60,
      totalMarks: 50,
      sections: [{ name: 'Section A', marks: 20, questionCount: 10, questionTypes: ['mcq'] }],
      topics: [{ topic: 'Fractions', marks: 50, weightage: 100 }],
    };

    const validateRes = await request('/validate', { method: 'POST', body: payload });
    expect(validateRes.status).toBe(200);
    expect(validateRes.data.valid).toBe(true);

    const createRes = await request('/', { method: 'POST', body: payload });
    expect(createRes.status).toBe(201);
    const id = createRes.data.blueprint._id;
    expect(id).toBeTruthy();

    const listRes = await request('/');
    expect(listRes.status).toBe(200);
    expect(listRes.data.blueprints.length).toBe(1);

    const getRes = await request(`/${id}?includeVersions=true`);
    expect(getRes.status).toBe(200);
    expect(getRes.data.blueprint._id).toBe(id);
    expect(Array.isArray(getRes.data.versions)).toBe(true);

    const updateRes = await request(`/${id}`, { method: 'PUT', body: { ...payload, title: 'Route Blueprint Updated' } });
    expect(updateRes.status).toBe(200);
    expect(updateRes.data.blueprint.title).toBe('Route Blueprint Updated');

    const duplicateRes = await request(`/${id}/duplicate`, { method: 'POST', body: { title: 'Route Blueprint Copy' } });
    expect(duplicateRes.status).toBe(201);
    expect(duplicateRes.data.blueprint.title).toBe('Route Blueprint Copy');

    const archiveRes = await request(`/${id}/archive`, { method: 'POST' });
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.data.blueprint.status).toBe('archived');

    const testBlueprintRes = await request(`/${id}/test-blueprint`);
    expect(testBlueprintRes.status).toBe(200);
    expect(testBlueprintRes.data.testBlueprint).toHaveProperty('sections');
    expect(testBlueprintRes.data.testBlueprint).toHaveProperty('timing');
    expect(testBlueprintRes.data.testBlueprint).toHaveProperty('topics');
  });
});
