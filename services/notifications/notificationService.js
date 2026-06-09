import Notification from '../../models/Notification.js';

// notify() is the single entry point for parent/user notifications.
//
// N1: writes the in-app record only. N2 (weekly email digest) and N3 (premium
// WhatsApp push) will add channel dispatch INSIDE this function — callers must
// not change. Keep this signature stable.
export async function notify({
  recipientUserId,
  type,
  title,
  body = '',
  linkPath = '',
  sourceType = '',
  sourceId = null,
  channels = ['in_app'],
}) {
  if (!recipientUserId || !type || !title) {
    throw new Error('notify: recipientUserId, type and title are required');
  }

  const notification = await Notification.create({
    recipientUserId,
    type,
    title,
    body,
    linkPath,
    sourceType,
    sourceId,
    channels,
  });

  // N2: queue for weekly email digest if 'email' in channels.
  // N3: push WhatsApp now if 'whatsapp' in channels AND recipient's plan allows.

  return notification;
}

export default { notify };
