import express from 'express';
import { body, validationResult } from 'express-validator';
import Resource, { RESOURCE_CATEGORIES } from '../models/Resource.js';
import ResourceLead from '../models/ResourceLead.js';
import { protect, authorize } from '../middleware/auth.js';
import uploadResource from '../middleware/uploadResource.js';

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
router.get('/', async (req, res) => {
  try {
    const { category, level, subject, q, page = 1, limit = 12 } = req.query;
    const filter = { published: true };
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (subject) filter.subject = subject;
    if (q && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ title: regex }, { summary: regex }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .select('-body')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Resource.countDocuments(filter)
    ]);

    res.json({
      resources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)) || 1
      }
    });
  } catch (error) {
    console.error('List resources error:', error);
    res.status(500).json({ message: 'Error fetching resources' });
  }
});

// @route   GET /api/resources/admin
// @desc    List all resources including drafts
// @access  Private (admin only)
router.get('/admin', adminOnly, async (req, res) => {
  try {
    const resources = await Resource.find().select('-body').sort({ createdAt: -1 });
    res.json({ resources });
  } catch (error) {
    console.error('Admin list resources error:', error);
    res.status(500).json({ message: 'Error fetching resources' });
  }
});

// @route   GET /api/resources/leads
// @desc    List captured leads from gated resources
// @access  Private (admin only)
router.get('/leads', adminOnly, async (req, res) => {
  try {
    const leads = await ResourceLead.find().sort({ createdAt: -1 }).limit(500);
    res.json({ leads });
  } catch (error) {
    console.error('List resource leads error:', error);
    res.status(500).json({ message: 'Error fetching leads' });
  }
});

// @route   POST /api/resources/:slug/unlock
// @desc    Capture an email and return the gated resource's content
// @access  Public
router.post(
  '/:slug/unlock',
  [body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail()],
  async (req, res) => {
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
);

// @route   POST /api/resources
// @desc    Create a resource
// @access  Private (admin only)
router.post('/', adminOnly, uploadResource.single('file'), validators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  try {
    const { title, category, level, subject, summary, body: content, published, gated } = req.body;
    const slug = await uniqueSlug(title);
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
      fileUrl: req.file ? `/uploads/resources/${req.file.filename}` : undefined
    });
    res.status(201).json({ resource });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ message: 'Error creating resource' });
  }
});

// @route   PUT /api/resources/:id
// @desc    Update a resource
// @access  Private (admin only)
router.put('/:id', adminOnly, uploadResource.single('file'), validators, async (req, res) => {
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
    if (req.file) resource.fileUrl = `/uploads/resources/${req.file.filename}`;

    await resource.save();
    res.json({ resource });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ message: 'Error updating resource' });
  }
});

// @route   DELETE /api/resources/:id
// @desc    Delete a resource
// @access  Private (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
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
});

// @route   GET /api/resources/:slug
// @desc    Get a single published resource by slug
// @access  Public
router.get('/:slug', async (req, res) => {
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
});

export default router;
