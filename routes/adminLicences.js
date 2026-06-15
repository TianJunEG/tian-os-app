import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import PartnerOrganisation from '../models/PartnerOrganisation.js';
import PartnerLicence, { LICENCE_PERIODS } from '../models/PartnerLicence.js';
import { seatSummary } from '../services/billing/agencyBillingService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Platform-admin only: manage agency wholesale licence blocks. Mounted at
// /api/admin/partners/:pid/licence.
const router = express.Router({ mergeParams: true });
router.use(protect, authorize('admin'));

// POST — add a licence block (seats, lump sum, monthly/annual).
router.post('/', asyncHandler(async (req, res) => {
  const org = await PartnerOrganisation.findById(req.params.pid);
  if (!org) return res.status(404).json({ error: 'Partner organisation not found.' });
  const b = req.body || {};
  if (!b.seatCount || b.seatCount < 1) return res.status(400).json({ error: 'seatCount must be >= 1.' });
  if (b.lumpSumAmount == null || b.lumpSumAmount < 0) return res.status(400).json({ error: 'lumpSumAmount is required.' });
  if (!LICENCE_PERIODS.includes(b.period)) return res.status(400).json({ error: 'period must be monthly or annual.' });
  const licence = await PartnerLicence.create({
    organisationId: org._id,
    seatCount: b.seatCount,
    lumpSumAmount: b.lumpSumAmount,
    currency: b.currency || 'SGD',
    period: b.period,
    ratePerSeatSnapshot: b.ratePerSeatSnapshot || (b.lumpSumAmount / b.seatCount),
    status: b.status || 'active',
    paymentStatus: b.paymentStatus || 'invoiced',
    setByUserId: req.user.id,
    notes: b.notes || '',
  });
  res.status(201).json({ licence });
}));

// GET — all blocks for the org + seat usage summary.
router.get('/', asyncHandler(async (req, res) => {
  const org = await PartnerOrganisation.findById(req.params.pid);
  if (!org) return res.status(404).json({ error: 'Partner organisation not found.' });
  const [blocks, seats] = await Promise.all([
    PartnerLicence.find({ organisationId: org._id }).sort({ createdAt: -1 }),
    seatSummary(org._id),
  ]);
  res.json({ licences: blocks, seats });
}));

// PATCH a block (status, paymentStatus, effectiveTo).
router.patch('/:licenceId', asyncHandler(async (req, res) => {
  const licence = await PartnerLicence.findOne({ _id: req.params.licenceId, organisationId: req.params.pid });
  if (!licence) return res.status(404).json({ error: 'Licence not found.' });
  const b = req.body || {};
  if (b.status) licence.status = b.status;
  if (b.paymentStatus) licence.paymentStatus = b.paymentStatus;
  if (b.effectiveTo !== undefined) licence.effectiveTo = b.effectiveTo;
  await licence.save();
  res.json({ licence });
}));

export default router;
