// WhatsApp push for premium-home parents. Config-gated: if the provider env
// isn't set, this no-ops (returns false) so notifications still work in-app and
// by email without WhatsApp configured. Uses the Meta WhatsApp Cloud API shape;
// swap the body for Twilio etc. by changing buildPayload + endpoint.
//
// Required env to enable: WHATSAPP_API_URL, WHATSAPP_API_TOKEN.

export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN);
}

// Normalise to digits (Meta expects E.164 without '+', most providers tolerate it).
function normaliseNumber(phone = '') {
  return String(phone).replace(/[^\d]/g, '');
}

// Returns true if a message was dispatched, false if skipped (not configured /
// no number). Never throws — callers treat WhatsApp as best-effort.
export async function sendWhatsApp({ to, title, body }) {
  if (!isWhatsAppConfigured()) return false;
  const number = normaliseNumber(to);
  if (!number) return false;
  const text = [title, body].filter(Boolean).join('\n');
  try {
    const res = await fetch(process.env.WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: number,
        type: 'text',
        text: { body: text },
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('WhatsApp send failed:', err.message);
    return false;
  }
}

export default { isWhatsAppConfigured, sendWhatsApp };
