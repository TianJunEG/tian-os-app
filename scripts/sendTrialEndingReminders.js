// Gap B: email tutors whose agency-granted trial is ending soon (T-7/T-3/T-1).
//
//   node scripts/sendTrialEndingReminders.js            (send)
//   node scripts/sendTrialEndingReminders.js --dry-run  (report only)
//
// Run daily. A reminder fires when the trial's remaining whole days is one of
// the REMIND_DAYS thresholds.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Subscription from '../models/Subscription.js';
import AgencyTutorPlan from '../models/AgencyTutorPlan.js';
import PartnerOrganisation from '../models/PartnerOrganisation.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailService.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const DRY_RUN = process.argv.includes('--dry-run');
const REMIND_DAYS = [7, 3, 1];

function daysLeft(trialEnd) {
  return Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86400000);
}

async function run() {
  await mongoose.connect(URI);
  const trials = await Subscription.find({
    ownerType: 'user',
    status: 'trial',
    originOrganisationId: { $ne: null },
    trialEnd: { $ne: null },
  });

  let sent = 0;
  for (const sub of trials) {
    const d = daysLeft(sub.trialEnd);
    if (!REMIND_DAYS.includes(d)) continue;
    const [user, plan, org] = await Promise.all([
      User.findById(sub.ownerId).select('email name'),
      sub.agencyTutorPlanId ? AgencyTutorPlan.findById(sub.agencyTutorPlanId) : null,
      PartnerOrganisation.findById(sub.originOrganisationId).select('name'),
    ]);
    if (!user?.email) continue;
    const price = plan ? `${plan.currency} ${plan.priceToTutor}/${plan.period}` : '';
    console.log(`  ${DRY_RUN ? 'would remind' : 'reminding'} ${user.email} (trial ends in ${d} day(s))`);
    if (DRY_RUN) continue;
    const subject = `Your ${org?.name || 'tutoring'} trial ends in ${d} day${d === 1 ? '' : 's'}`;
    const html = `<div style="font-family:sans-serif;max-width:560px">
      <h2>Your trial is ending soon</h2>
      <p>Hi ${user.name || 'there'}, your trial with <strong>${org?.name || 'your agency'}</strong>
      ends in <strong>${d} day${d === 1 ? '' : 's'}</strong>.</p>
      ${price ? `<p>To keep your access, subscribe at <strong>${price}</strong>.</p>` : ''}
      <p>You can continue from your dashboard.</p></div>`;
    const text = `Your trial with ${org?.name || 'your agency'} ends in ${d} day(s).${price ? ` Subscribe at ${price}.` : ''}`;
    try { await sendEmail({ to: user.email, subject, html, text }); sent++; }
    catch (e) { console.warn(`    email failed for ${user.email}: ${e.message}`); }
  }

  console.log(DRY_RUN ? 'Dry run complete.' : `Sent ${sent} reminder(s).`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
