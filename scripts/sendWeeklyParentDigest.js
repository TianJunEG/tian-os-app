// Weekly email digest (N2): emails each recipient a summary of the notifications
// they received in the past 7 days (those tagged with the 'email' channel —
// every parent notification is, by notify()'s policy). In-app + WhatsApp are
// delivered elsewhere; this is the passive weekly catch-up.
//
//   node scripts/sendWeeklyParentDigest.js            (send)
//   node scripts/sendWeeklyParentDigest.js --dry-run  (report only)
//
// Intended to run weekly (wire to the host scheduler / cron).
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailService.js';

dotenv.config();
const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutor-match';
const DRY_RUN = process.argv.includes('--dry-run');
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const APP_URL = (process.env.FRONTEND_URL || process.env.APP_URL || '').replace(/\/$/, '');

function buildDigest(name, items) {
  const rows = items.map((n) => {
    const when = new Date(n.createdAt).toLocaleDateString();
    const link = n.linkPath && APP_URL ? `${APP_URL}${n.linkPath}` : '';
    const titleHtml = link ? `<a href="${link}">${n.title}</a>` : n.title;
    return `<li style="margin-bottom:8px"><strong>${titleHtml}</strong><br/>
      <span style="color:#555">${n.body || ''}</span>
      <span style="color:#999;font-size:12px"> · ${when}</span></li>`;
  }).join('');
  const html = `<div style="font-family:sans-serif;max-width:560px">
    <h2>Your weekly update${name ? `, ${name}` : ''}</h2>
    <p>Here's what happened with your child's tutoring this week:</p>
    <ul style="padding-left:18px">${rows}</ul>
    <p style="color:#999;font-size:12px">You're receiving this because you have updates on Tian OS.</p>
  </div>`;
  const text = `Your weekly update${name ? `, ${name}` : ''}\n\n` +
    items.map((n) => `• ${n.title}${n.body ? ` — ${n.body}` : ''} (${new Date(n.createdAt).toLocaleDateString()})`).join('\n');
  return { html, text };
}

async function run() {
  await mongoose.connect(URI);
  const since = new Date(Date.now() - WINDOW_MS);
  const recent = await Notification.find({ createdAt: { $gte: since }, channels: 'email' }).sort({ createdAt: -1 });

  // Group by recipient.
  const byRecipient = new Map();
  for (const n of recent) {
    const key = String(n.recipientUserId);
    if (!byRecipient.has(key)) byRecipient.set(key, []);
    byRecipient.get(key).push(n);
  }
  console.log(`${byRecipient.size} recipient(s) with updates in the last 7 days.${DRY_RUN ? ' (dry run)' : ''}`);

  let sent = 0;
  for (const [userId, items] of byRecipient) {
    const user = await User.findById(userId).select('email name');
    if (!user?.email) { console.log(`  skip ${userId} (no email)`); continue; }
    console.log(`  ${DRY_RUN ? 'would email' : 'emailing'} ${user.email} (${items.length} update(s))`);
    if (DRY_RUN) continue;
    const { html, text } = buildDigest(user.name, items);
    try {
      await sendEmail({ to: user.email, subject: 'Your weekly tutoring update', html, text });
      sent++;
    } catch (e) {
      console.warn(`    email failed for ${user.email}: ${e.message}`);
    }
  }

  console.log(DRY_RUN ? 'Dry run complete.' : `Sent ${sent} digest email(s).`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
