// Email parents whose annual Premium Home access is ending soon (T-45/T-14/T-3)
// or has just lapsed (T-0), nudging an early renewal at the discounted price.
//
//   node scripts/sendRenewalReminders.js            (send)
//   node scripts/sendRenewalReminders.js --dry-run  (report only)
//
// Run daily (e.g. a cron / Railway scheduled job). A reminder fires when the
// remaining whole days equals one of REMIND_DAYS — so each milestone emails
// exactly once without needing per-send bookkeeping. T-45 lines up with the
// early-renewal window so the first nudge already carries the discount.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Subscription from '../models/Subscription.js';
import BillingPlan from '../models/BillingPlan.js';
import User from '../models/User.js';
import { sendPremiumHomeRenewalReminder } from '../utils/emailService.js';
import { getPremiumHomePricing } from '../services/billing/premiumHomePricing.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const DRY_RUN = process.argv.includes('--dry-run');
const REMIND_DAYS = [45, 14, 3, 0];
const PREMIUM_HOME_PLAN = 'parent_plus';

function daysLeft(end) {
  return Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
}

async function run() {
  await mongoose.connect(URI);
  const pricing = getPremiumHomePricing();
  const appBase = (process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const upgradeUrl = `${appBase}/parent/upgrade`;

  const plan = await BillingPlan.findOne({ planType: PREMIUM_HOME_PLAN }).select('_id');
  if (!plan) { console.log('No Premium Home plan found; nothing to do.'); await mongoose.disconnect(); return; }

  const subs = await Subscription.find({
    ownerType: 'user',
    status: 'active',
    planId: plan._id,
    currentPeriodEnd: { $ne: null },
  });

  let sent = 0;
  for (const sub of subs) {
    const d = daysLeft(sub.currentPeriodEnd);
    if (!REMIND_DAYS.includes(d)) continue;
    const user = await User.findById(sub.ownerId).select('email name');
    if (!user?.email) continue;
    const expired = d <= 0;
    console.log(`  ${DRY_RUN ? 'would remind' : 'reminding'} ${user.email} (${expired ? 'expires today' : `ends in ${d} day(s)`})`);
    if (DRY_RUN) continue;
    try {
      await sendPremiumHomeRenewalReminder({
        to: user.email,
        name: user.name,
        daysLeft: Math.max(0, d),
        currency: pricing.currency,
        earlyPrice: pricing.earlyRenewalSgd,
        annualPrice: pricing.annualSgd,
        upgradeUrl,
        expired,
      });
      sent++;
    } catch (e) {
      console.warn(`    email failed for ${user.email}: ${e.message}`);
    }
  }

  console.log(DRY_RUN ? 'Dry run complete.' : `Sent ${sent} renewal reminder(s).`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
