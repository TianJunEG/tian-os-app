// Premium Home is sold as a once-a-year prepaid fee paid via PayNow (no card,
// no recurring billing). All amounts + payee details are env-driven so they can
// change without code edits. Defaults are PLACEHOLDERS — set the real values
// (and especially the price) before launch.
//
//   PREMIUM_HOME_ANNUAL_SGD          standard annual fee
//   PREMIUM_HOME_EARLY_RENEWAL_SGD   discounted price for renewing before expiry
//   PREMIUM_HOME_SCHOOL_BULK_SGD     optional per-parent rate for whole-school sign-up
//   PAYNOW_PAYEE_NAME / PAYNOW_UEN / PAYNOW_MOBILE / PAYNOW_INSTRUCTIONS
//   PREMIUM_HOME_EARLY_RENEWAL_WINDOW_DAYS  how early a renewal counts as "early"

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const DEFAULTS = {
  annualSgd: 120,
  earlyRenewalSgd: 96,
  schoolBulkSgd: 96,
  earlyRenewalWindowDays: 45,
};

export function getPremiumHomePricing() {
  const annualSgd = num(process.env.PREMIUM_HOME_ANNUAL_SGD, DEFAULTS.annualSgd);
  const earlyRenewalSgd = num(process.env.PREMIUM_HOME_EARLY_RENEWAL_SGD, DEFAULTS.earlyRenewalSgd);
  const schoolBulkSgd = num(process.env.PREMIUM_HOME_SCHOOL_BULK_SGD, DEFAULTS.schoolBulkSgd);
  // Treat the defaults as placeholders so the UI can warn until real values are set.
  const isPlaceholder = !process.env.PREMIUM_HOME_ANNUAL_SGD;
  return {
    currency: 'SGD',
    annualSgd,
    earlyRenewalSgd,
    schoolBulkSgd,
    earlyRenewalWindowDays: num(process.env.PREMIUM_HOME_EARLY_RENEWAL_WINDOW_DAYS, DEFAULTS.earlyRenewalWindowDays),
    isPlaceholder,
  };
}

export function getPayNowDetails() {
  return {
    payeeName: process.env.PAYNOW_PAYEE_NAME || 'Your Company Pte Ltd (set PAYNOW_PAYEE_NAME)',
    uen: process.env.PAYNOW_UEN || '',
    mobile: process.env.PAYNOW_MOBILE || '',
    instructions: process.env.PAYNOW_INSTRUCTIONS
      || 'Pay via your bank app → PayNow → enter the UEN/mobile above → enter the exact amount → put the reference code in the comments.',
    configured: Boolean(process.env.PAYNOW_UEN || process.env.PAYNOW_MOBILE),
  };
}

export default { getPremiumHomePricing, getPayNowDetails };
