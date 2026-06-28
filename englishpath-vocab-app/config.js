// Vocabulary Builder — go-live configuration.
// ---------------------------------------------------------------------------
// Fill these three in to take the app from "local demo" to a real lead-gen
// funnel. Leave any of them blank and that piece falls back to demo behaviour,
// so the app always runs. Edit this file, commit, and the deploy re-publishes.

export const CONFIG = {
  // Price shown on the buttons/modal (display only — real price lives in Stripe).
  PRICE: 'S$9/mo',

  // LEAD CAPTURE — where the submitted email/level is POSTed (the lead).
  // Any service that accepts a JSON or form POST works and needs no backend:
  //   • Formspree   → 'https://formspree.io/f/xxxxxxx'
  //   • Web3Forms   → 'https://api.web3forms.com/submit'  (also set ACCESS_KEY)
  //   • Google Apps Script web app, Zapier/Make webhook, your own endpoint
  // Leave '' to only store the lead in the browser (demo).
  LEAD_ENDPOINT: '',
  // Web3Forms only: your public access key. Ignored by other providers.
  WEB3FORMS_ACCESS_KEY: '',

  // PAYMENT — a Stripe Payment Link URL. In the Stripe dashboard set the link's
  // "after payment" redirect to this app's URL with ?unlocked=1 appended, e.g.
  //   https://YOURSITE/?unlocked=1
  // so the app grants Premium when the customer returns. Leave '' to unlock
  // instantly after email (demo mode).
  STRIPE_PAYMENT_LINK: '',
};
