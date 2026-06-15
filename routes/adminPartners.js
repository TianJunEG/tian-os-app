import express from 'express';
import { body, validationResult } from 'express-validator';
import PartnerOrganisation from '../models/PartnerOrganisation.js';
import PartnerMembership from '../models/PartnerMembership.js';
import PartnerStudent from '../models/PartnerStudent.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { getPartnerImpactReport, getPartnerMetrics } from '../services/partners/partnerMetricsService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const adminOnly = [protect, authorize('admin')];

router.use(adminOnly);

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return false;
  }
  return true;
}

function shapePartner(partner, metrics = {}) {
  return {
    id: String(partner._id || partner.id),
    name: partner.name,
    type: partner.type,
    status: partner.status,
    contactName: partner.contactName || '',
    contactEmail: partner.contactEmail || '',
    contactPhone: partner.contactPhone || '',
    address: partner.address || '',
    notes: partner.notes || '',
    createdAt: partner.createdAt,
    updatedAt: partner.updatedAt,
    metrics,
  };
}

router.get('/', asyncHandler(async (_req, res) => {
  try {
    const partners = await PartnerOrganisation.find({}).sort({ updatedAt: -1, createdAt: -1 }).lean();
    const rows = await Promise.all(partners.map(async (partner) => shapePartner(partner, await getPartnerMetrics(partner._id))));
    res.json({ partners: rows });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load partners.' });
  }
}));

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Partner name is required.'),
    body('type').isIn(['student_care', 'tuition_centre', 'school', 'pilot_partner', 'internal']).withMessage('Invalid partner type.'),
    body('status').optional().isIn(['prospect', 'pilot', 'active', 'paused', 'archived']).withMessage('Invalid partner status.'),
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const partner = await PartnerOrganisation.create({
        name: req.body.name,
        type: req.body.type,
        status: req.body.status || 'prospect',
        contactName: req.body.contactName || '',
        contactEmail: req.body.contactEmail || '',
        contactPhone: req.body.contactPhone || '',
        address: req.body.address || '',
        notes: req.body.notes || '',
      });
      res.status(201).json({ partner: shapePartner(partner) });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Failed to create partner.' });
    }
  }
);

router.get('/:partnerId', asyncHandler(async (req, res) => {
  try {
    const partner = await PartnerOrganisation.findById(req.params.partnerId).lean();
    if (!partner) return res.status(404).json({ error: 'Partner not found.' });
    const [metrics, staff, studentLinks] = await Promise.all([
      getPartnerMetrics(partner._id),
      PartnerMembership.find({ organisationId: partner._id }).populate('userId', 'name email role').lean(),
      PartnerStudent.find({ organisationId: partner._id }).populate('studentId', 'name level profile').lean(),
    ]);
    res.json({
      partner: shapePartner(partner, metrics),
      staff: staff.map((row) => ({
        id: String(row._id),
        userId: String(row.userId?._id || row.userId),
        name: row.userId?.name || '',
        email: row.userId?.email || '',
        role: row.role,
        status: row.status,
      })),
      students: studentLinks.map((row) => ({
        id: String(row._id),
        studentId: String(row.studentId?._id || row.studentId),
        name: row.studentId?.name || '',
        level: row.studentId?.level || '',
        relationshipType: row.relationshipType,
        status: row.status,
        startDate: row.startDate,
        endDate: row.endDate,
      })),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load partner.' });
  }
}));

router.patch('/:partnerId', asyncHandler(async (req, res) => {
  try {
    const allowed = ['name', 'type', 'status', 'contactName', 'contactEmail', 'contactPhone', 'address', 'notes'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const partner = await PartnerOrganisation.findByIdAndUpdate(req.params.partnerId, update, { new: true, runValidators: true });
    if (!partner) return res.status(404).json({ error: 'Partner not found.' });
    res.json({ partner: shapePartner(partner, await getPartnerMetrics(partner._id)) });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to update partner.' });
  }
}));

router.post('/:partnerId/archive', asyncHandler(async (req, res) => {
  try {
    const partner = await PartnerOrganisation.findByIdAndUpdate(req.params.partnerId, { status: 'archived' }, { new: true });
    if (!partner) return res.status(404).json({ error: 'Partner not found.' });
    res.json({ partner: shapePartner(partner, await getPartnerMetrics(partner._id)) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to archive partner.' });
  }
}));

router.post(
  '/:partnerId/staff',
  [
    body('userId').trim().notEmpty().withMessage('User is required.'),
    body('role').isIn(['owner', 'manager', 'student_care_staff', 'tutor', 'teacher', 'admin']).withMessage('Invalid staff role.'),
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const [partner, user] = await Promise.all([
        PartnerOrganisation.findById(req.params.partnerId),
        User.findById(req.body.userId),
      ]);
      if (!partner) return res.status(404).json({ error: 'Partner not found.' });
      if (!user) return res.status(404).json({ error: 'User not found.' });
      const membership = await PartnerMembership.findOneAndUpdate(
        { organisationId: partner._id, userId: user._id },
        { role: req.body.role, status: req.body.status || 'active' },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      res.status(201).json({ membership });
    } catch (err) {
      res.status(400).json({ error: err.message || 'Failed to add staff.' });
    }
  }
);

router.delete('/:partnerId/staff/:membershipId', asyncHandler(async (req, res) => {
  try {
    const membership = await PartnerMembership.findOneAndUpdate(
      { _id: req.params.membershipId, organisationId: req.params.partnerId },
      { status: 'removed' },
      { new: true }
    );
    if (!membership) return res.status(404).json({ error: 'Staff membership not found.' });
    res.json({ membership });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to remove staff.' });
  }
}));

router.post(
  '/:partnerId/students',
  [
    body('studentId').trim().notEmpty().withMessage('Student is required.'),
    body('relationshipType').optional().isIn(['enrolled', 'pilot', 'tuition', 'student_care']).withMessage('Invalid relationship type.'),
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const [partner, student] = await Promise.all([
        PartnerOrganisation.findById(req.params.partnerId),
        Student.findById(req.body.studentId),
      ]);
      if (!partner) return res.status(404).json({ error: 'Partner not found.' });
      if (!student) return res.status(404).json({ error: 'Student not found.' });
      const link = await PartnerStudent.findOneAndUpdate(
        { organisationId: partner._id, studentId: student._id },
        {
          relationshipType: req.body.relationshipType || 'enrolled',
          status: req.body.status || 'active',
          startDate: req.body.startDate || new Date(),
          endDate: req.body.endDate || null,
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      res.status(201).json({ partnerStudent: link });
    } catch (err) {
      res.status(400).json({ error: err.message || 'Failed to link student.' });
    }
  }
);

router.delete('/:partnerId/students/:partnerStudentId', asyncHandler(async (req, res) => {
  try {
    const link = await PartnerStudent.findOneAndUpdate(
      { _id: req.params.partnerStudentId, organisationId: req.params.partnerId },
      { status: 'removed', endDate: new Date() },
      { new: true }
    );
    if (!link) return res.status(404).json({ error: 'Student link not found.' });
    res.json({ partnerStudent: link });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to remove student link.' });
  }
}));

router.get('/:partnerId/impact-report', asyncHandler(async (req, res) => {
  try {
    const report = await getPartnerImpactReport(req.params.partnerId);
    res.json(report);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load partner impact report.' });
  }
}));

export default router;
