import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import AssessmentBlueprint from '../models/mathpath/AssessmentBlueprint.js';
import SchoolAssessmentProfile from '../models/mathpath/SchoolAssessmentProfile.js';
import {
  archiveAssessmentBlueprint,
  createAssessmentBlueprint,
  duplicateAssessmentBlueprint,
  extractBlueprintFromUploadedPdf,
  generateTestBlueprint,
  getAssessmentBlueprintById,
  getBlueprintVersions,
  listAssessmentBlueprints,
  SAMPLE_ASSESSMENT_BLUEPRINTS,
  seedSampleAssessmentBlueprints,
  updateAssessmentBlueprint,
  upsertSchoolAssessmentProfileFromBlueprint,
  validateAssessmentBlueprint,
} from '../services/mathpath/assessmentBlueprintEngine.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function roleSet(user) {
  return new Set([user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])].filter(Boolean));
}

function canManageBlueprint(req, blueprint) {
  if (!blueprint) return false;
  const roles = roleSet(req.user);
  if (roles.has('admin')) return true;
  if (String(blueprint.createdByUserId || blueprint.createdBy || '') === String(req.user?.id || '')) return true;
  if (req.workspaceId && blueprint.workspaceId && String(req.workspaceId) === String(blueprint.workspaceId)) return true;
  return false;
}

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  try {
    const rows = await listAssessmentBlueprints({
      level: req.query.level,
      subject: req.query.subject,
      school: req.query.school,
      assessmentType: req.query.assessmentType,
      status: req.query.status,
      includeArchived: String(req.query.includeArchived || '').toLowerCase() === 'true',
      workspaceId: req.workspaceId || undefined,
      limit: req.query.limit,
    });
    return res.json({ blueprints: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to list blueprints.' });
  }
}));

router.get('/library/examples', asyncHandler(async (req, res) => {
  return res.json({ examples: SAMPLE_ASSESSMENT_BLUEPRINTS });
}));

router.get('/school-profiles', asyncHandler(async (req, res) => {
  try {
    const query = {};
    if (req.query.school) query.school = String(req.query.school);
    if (req.query.level) query.level = String(req.query.level);
    if (req.query.subject) query.subject = String(req.query.subject);
    if (req.query.assessmentType) query.assessmentType = String(req.query.assessmentType);
    const rows = await SchoolAssessmentProfile.find(query).sort({ updatedAt: -1 }).limit(200);
    return res.json({ profiles: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to list school profiles.' });
  }
}));

router.post('/library/seed', asyncHandler(async (req, res) => {
  try {
    const created = await seedSampleAssessmentBlueprints({
      actorUserId: req.user.id,
      workspaceId: req.workspaceId || null,
    });
    return res.json({ seeded: created.length, blueprints: created });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to seed blueprint examples.' });
  }
}));

router.post('/validate', asyncHandler(async (req, res) => {
  const validation = validateAssessmentBlueprint(req.body || {});
  return res.json({
    valid: validation.valid,
    errors: validation.errors,
    normalized: validation.normalized,
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  try {
    const doc = await createAssessmentBlueprint(req.body || {}, {
      actorUserId: req.user.id,
      workspaceId: req.workspaceId || null,
    });
    await upsertSchoolAssessmentProfileFromBlueprint(doc);
    return res.status(201).json({ blueprint: doc });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to create blueprint.' });
  }
}));

router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const withVersions = String(req.query.includeVersions || '').toLowerCase() === 'true';
    const found = await getAssessmentBlueprintById(req.params.id, { includeVersions: withVersions });
    if (!found) return res.status(404).json({ error: 'Assessment blueprint not found.' });

    const blueprint = withVersions ? found.blueprint : found;
    if (!canManageBlueprint(req, blueprint)) return res.status(403).json({ error: 'Not authorized to view this blueprint.' });

    if (!withVersions) return res.json({ blueprint });
    return res.json({ blueprint, versions: found.versions || [] });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to load blueprint.' });
  }
}));

router.put('/:id', asyncHandler(async (req, res) => {
  try {
    const existing = await AssessmentBlueprint.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Assessment blueprint not found.' });
    if (!canManageBlueprint(req, existing)) return res.status(403).json({ error: 'Not authorized to update this blueprint.' });

    const updated = await updateAssessmentBlueprint(req.params.id, req.body || {}, { actorUserId: req.user.id });
    await upsertSchoolAssessmentProfileFromBlueprint(updated);
    return res.json({ blueprint: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to update blueprint.' });
  }
}));

router.post('/:id/archive', asyncHandler(async (req, res) => {
  try {
    const existing = await AssessmentBlueprint.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Assessment blueprint not found.' });
    if (!canManageBlueprint(req, existing)) return res.status(403).json({ error: 'Not authorized to archive this blueprint.' });

    const archived = await archiveAssessmentBlueprint(req.params.id, { actorUserId: req.user.id });
    return res.json({ blueprint: archived });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to archive blueprint.' });
  }
}));

router.post('/:id/duplicate', asyncHandler(async (req, res) => {
  try {
    const existing = await AssessmentBlueprint.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Assessment blueprint not found.' });
    if (!canManageBlueprint(req, existing)) return res.status(403).json({ error: 'Not authorized to duplicate this blueprint.' });

    const duplicated = await duplicateAssessmentBlueprint(req.params.id, {
      actorUserId: req.user.id,
      workspaceId: req.workspaceId || null,
      title: req.body?.title || '',
    });
    await upsertSchoolAssessmentProfileFromBlueprint(duplicated);
    return res.status(201).json({ blueprint: duplicated });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to duplicate blueprint.' });
  }
}));

router.get('/:id/versions', asyncHandler(async (req, res) => {
  try {
    const existing = await AssessmentBlueprint.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Assessment blueprint not found.' });
    if (!canManageBlueprint(req, existing)) return res.status(403).json({ error: 'Not authorized to view blueprint versions.' });
    const versions = await getBlueprintVersions(req.params.id);
    return res.json({ versions });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to load blueprint versions.' });
  }
}));

router.get('/:id/test-blueprint', asyncHandler(async (req, res) => {
  try {
    const existing = await AssessmentBlueprint.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Assessment blueprint not found.' });
    if (!canManageBlueprint(req, existing)) return res.status(403).json({ error: 'Not authorized to view this blueprint.' });
    const generated = await generateTestBlueprint(existing);
    return res.json({ testBlueprint: generated });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to generate test blueprint.' });
  }
}));

router.post('/upload-analyze', upload.single('paper'), asyncHandler(async (req, res) => {
  try {
    const consent = String(req.body?.consent || '').toLowerCase() === 'true';
    if (!consent) {
      return res.status(400).json({
        error: 'Consent required.',
        requiredConsent: 'I understand that the uploaded file will be analysed and automatically deleted after processing.',
      });
    }
    if (!req.file?.buffer) return res.status(400).json({ error: 'PDF file is required.' });
    if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Only PDF uploads are supported.' });

    const extracted = await extractBlueprintFromUploadedPdf(req.file.buffer, {
      ...req.body,
      createdBy: req.user.id,
      createdByUserId: req.user.id,
      workspaceId: req.workspaceId || null,
      sourceType: 'uploadDerived',
    });
    const validation = validateAssessmentBlueprint(extracted);
    if (!validation.valid) {
      return res.status(400).json({ error: `Blueprint validation failed: ${validation.errors.join(' ')}` });
    }

    const blueprint = await createAssessmentBlueprint(validation.normalized, {
      actorUserId: req.user.id,
      workspaceId: req.workspaceId || null,
      changeType: 'create',
    });
    const profile = await upsertSchoolAssessmentProfileFromBlueprint(blueprint);

    return res.status(201).json({
      blueprint,
      questionMetadata: blueprint.questionMetadata || [],
      schoolAssessmentProfile: profile,
      originalFileDeleted: true,
      note: 'Original uploaded file was processed in-memory and not retained.',
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to analyze uploaded paper.' });
  }
}));

export default router;
