import express from 'express';
import { body, validationResult } from 'express-validator';
import Resource, { RESOURCE_CATEGORIES } from '../models/Resource.js';
import ResourceLead from '../models/ResourceLead.js';
import { protect, authorize } from '../middleware/auth.js';
import uploadResource from '../middleware/uploadResource.js';
import { persistUploadFile } from '../services/storage/objectStore.js';
import { generateResourceImage } from '../services/resources/resourceImageService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const adminOnly = [protect, authorize('admin')];

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Generate a slug that doesn't collide with an existing resource (ignoring `excludeId`).
const uniqueSlug = async (title, excludeId) => {
  const base = slugify(title) || 'resource';
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await Resource.findOne({ slug });
    if (!existing || (excludeId && existing._id.toString() === excludeId)) break;
    slug = `${base}-${++n}`;
  }
  return slug;
};

const validators = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('category').isIn(RESOURCE_CATEGORIES).withMessage('Invalid category'),
  body('summary').optional().trim().isLength({ max: 400 }),
  body('body').optional().isLength({ max: 20000 }),
  body('level').optional().trim().isLength({ max: 60 }),
  body('subject').optional().trim().isLength({ max: 60 })
];

// @route   GET /api/resources
// @desc    List published resources (public), filterable
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  try {
    const { category, level, subject, q, page = 1, limit = 12 } = req.query;
    const perPage = Math.min(parseInt(limit) || 12, 100);
    const filter = { published: true };
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (subject) filter.subject = subject;
    if (q && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ title: regex }, { summary: regex }];
    }

    const skip = (parseInt(page) - 1) * perPage;
    const [resources, total] = await Promise.all([
      // Exclude body and fileUrl: listings never need them, and fileUrl
      // must not leak for gated resources.
      Resource.find(filter)
        .select('-body -fileUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage),
      Resource.countDocuments(filter)
    ]);

    res.json({
      resources,
      pagination: {
        page: parseInt(page),
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage) || 1
      }
    });
  } catch (error) {
    console.error('List resources error:', error);
    res.status(500).json({ message: 'Error fetching resources' });
  }
}));

// @route   GET /api/resources/admin
// @desc    List all resources including drafts
// @access  Private (admin only)
router.get('/admin', adminOnly, asyncHandler(async (req, res) => {
  try {
    const resources = await Resource.find().select('-body').sort({ createdAt: -1 });
    res.json({ resources });
  } catch (error) {
    console.error('Admin list resources error:', error);
    res.status(500).json({ message: 'Error fetching resources' });
  }
}));

// @route   GET /api/resources/leads
// @desc    List captured leads from gated resources
// @access  Private (admin only)
router.get('/leads', adminOnly, asyncHandler(async (req, res) => {
  try {
    const leads = await ResourceLead.find().sort({ createdAt: -1 }).limit(500);
    res.json({ leads });
  } catch (error) {
    console.error('List resource leads error:', error);
    res.status(500).json({ message: 'Error fetching leads' });
  }
}));

// @route   POST /api/resources/:slug/unlock
// @desc    Capture an email and return the gated resource's content
// @access  Public
router.post(
  '/:slug/unlock',
  [
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('name').optional().trim().isLength({ max: 100 })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
      const resource = await Resource.findOne({ slug: req.params.slug, published: true });
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      await ResourceLead.create({
        email: req.body.email,
        name: req.body.name,
        resourceId: resource._id,
        resourceTitle: resource.title
      });

      res.json({ body: resource.body, fileUrl: resource.fileUrl });
    } catch (error) {
      console.error('Unlock resource error:', error);
      res.status(500).json({ message: 'Could not unlock this resource.' });
    }
  }
));

// @route   POST /api/resources
// @desc    Create a resource
// @access  Private (admin only)
router.post('/', adminOnly, uploadResource.single('file'), validators, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  try {
    const { title, category, level, subject, summary, body: content, published, gated } = req.body;
    const slug = await uniqueSlug(title);
    const fileUrl = req.file ? (await persistUploadFile(req.file, 'resources')).fileUrl : undefined;
    const resource = await Resource.create({
      title,
      slug,
      category,
      level,
      subject,
      summary,
      body: content,
      published: published === undefined ? true : published === 'true' || published === true,
      gated: gated === 'true' || gated === true,
      fileUrl
    });
    res.status(201).json({ resource });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ message: 'Error creating resource' });
  }
}));

// @route   PUT /api/resources/:id
// @desc    Update a resource
// @access  Private (admin only)
router.put('/:id', adminOnly, uploadResource.single('file'), validators, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const { title, category, level, subject, summary, body: content, published, gated } = req.body;
    if (title && title !== resource.title) {
      resource.slug = await uniqueSlug(title, resource._id.toString());
      resource.title = title;
    }
    if (category !== undefined) resource.category = category;
    if (level !== undefined) resource.level = level;
    if (subject !== undefined) resource.subject = subject;
    if (summary !== undefined) resource.summary = summary;
    if (content !== undefined) resource.body = content;
    if (published !== undefined) resource.published = published === 'true' || published === true;
    if (gated !== undefined) resource.gated = gated === 'true' || gated === true;
    if (req.file) resource.fileUrl = (await persistUploadFile(req.file, 'resources')).fileUrl;

    await resource.save();
    res.json({ resource });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ message: 'Error updating resource' });
  }
}));

// @route   DELETE /api/resources/:id
// @desc    Delete a resource
// @access  Private (admin only)
router.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.json({ message: 'Resource deleted' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ message: 'Error deleting resource' });
  }
}));

// @route   POST /api/resources/:slug/generate-image
// @desc    Generate a DALL-E 3 illustration for an article and persist it.
//          Optional body: { prompt } to override the auto-built prompt.
//          Optional query: ?size=1792x1024 (default) | 1024x1024 | 1024x1792
// @access  Admin
router.post('/:slug/generate-image', adminOnly, asyncHandler(async (req, res) => {
  const resource = await Resource.findOne({ slug: req.params.slug });
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  const validSizes = ['1792x1024', '1024x1024', '1024x1792'];
  const size = validSizes.includes(req.query.size) ? req.query.size : '1792x1024';

  const image = await generateResourceImage({
    title: resource.title,
    summary: resource.summary || '',
    customPrompt: req.body?.prompt || null,
    size,
  });

  resource.images.push(image);
  await resource.save();

  res.json({ image, totalImages: resource.images.length });
}));

// @route   DELETE /api/resources/:slug/images/:imageId
// @desc    Remove a generated image from an article.
// @access  Admin
router.delete('/:slug/images/:imageId', adminOnly, asyncHandler(async (req, res) => {
  const resource = await Resource.findOne({ slug: req.params.slug });
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  const before = resource.images.length;
  resource.images = resource.images.filter((img) => img._id.toString() !== req.params.imageId);
  if (resource.images.length === before) return res.status(404).json({ error: 'Image not found' });

  await resource.save();
  res.json({ removed: req.params.imageId, totalImages: resource.images.length });
}));

// @route   GET /api/resources/:slug
// @desc    Get a single published resource by slug
// @access  Public
router.get('/:slug', asyncHandler(async (req, res) => {
  try {
    const resource = await Resource.findOne({ slug: req.params.slug, published: true });
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    // For gated resources, withhold the body and file until the visitor
    // unlocks with an email (see POST /:slug/unlock).
    if (resource.gated) {
      const { body, fileUrl, ...meta } = resource.toObject();
      return res.json({ resource: { ...meta, hasFile: Boolean(fileUrl) } });
    }
    res.json({ resource });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ message: 'Error fetching resource' });
  }
}));

export default router;
