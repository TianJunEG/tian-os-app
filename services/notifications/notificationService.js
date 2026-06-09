import Notification from '../../models/Notification.js';
import User from '../../models/User.js';
import { resolveEntitlements, PRODUCT_TIERS } from '../billing/entitlements.js';
import { sendWhatsApp } from './whatsappSender.js';

// notify() is the single entry point for parent/user notifications. Channel
// policy lives here so callers never change:
//   in_app  — always (the feed record).
//   email   — always tagged; delivered as a WEEKLY DIGEST by
//             scripts/sendWeeklyParentDigest.js (not per-event).
//   whatsapp— only for PREMIUM-HOME recipients, pushed immediately (best-effort).
// `extraChannels` lets a caller force-add a channel; it can't remove in_app/email.
export async function notify({
  recipientUserId,
  type,
  title,
  body = '',
  linkPath = '',
  sourceType = '',
  sourceId = null,
  extraChannels = [],
}) {
  if (!recipientUserId || !type || !title) {
    throw new Error('notify: recipientUserId, type and title are required');
  }

  // Is this recipient on the premium-home tier (WhatsApp entitlement)?
  let whatsAppEligible = false;
  try {
    const ent = await resolveEntitlements({ ownerType: 'user', ownerId: String(recipientUserId), role: 'parent' });
    whatsAppEligible = ent?.tier === PRODUCT_TIERS.PREMIUM_HOME;
  } catch { /* entitlement lookup failure → no WhatsApp, never blocks */ }

  const channels = Array.from(new Set([
    'in_app',
    'email',
    ...(whatsAppEligible ? ['whatsapp'] : []),
    ...extraChannels,
  ]));

  const notification = await Notification.create({
    recipientUserId, type, title, body, linkPath, sourceType, sourceId, channels,
  });

  // N3: push WhatsApp now for premium-home recipients (best-effort).
  if (whatsAppEligible) {
    try {
      const user = await User.findById(recipientUserId).select('phone');
      if (user?.phone) await sendWhatsApp({ to: user.phone, title, body });
    } catch { /* WhatsApp is best-effort; never block the in-app write */ }
  }

  return notification;
}

export default { notify };
