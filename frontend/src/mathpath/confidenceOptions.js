// One canonical confidence/reflection scale for EVERY practice surface, so the
// "How did that feel?" check looks and behaves the same everywhere (previously
// each screen defined its own — "Solid/Shaky" here, "I know this/I need help"
// there, an emoji set elsewhere).
//
// Values MUST all normalize via the backend confidence map
// (services/telemetry/learningTelemetryService.js):
//   i_know_this  → I_KNOW_THIS
//   not_sure     → IM_NOT_SURE
//   i_dont_know  → I_DONT_KNOW
//   i_need_help  → I_DONT_KNOW
// (The old 'i_need_practice' and 'need_help' values were NOT in that map, so
// those selections were silently dropped from confidence analytics — fixed by
// using mapped values here.)
//
// Each option carries label + emoji + colour so a screen can render whichever
// it needs (plain, coloured pills, or emoji-forward for lower primary).
export const CONFIDENCE_OPTIONS = [
  { value: 'i_know_this', label: 'Solid',     emoji: '😊', color: 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200' },
  { value: 'not_sure',    label: 'Not sure',  emoji: '🤔', color: 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200' },
  { value: 'i_dont_know', label: 'Shaky',     emoji: '😕', color: 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200' },
  { value: 'i_need_help', label: 'Need help', emoji: '🙋', color: 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200' },
];

// Lower-primary: same scale + values, slightly warmer labels.
const LP_LABELS = { i_know_this: 'I know it!', not_sure: 'Not sure', i_dont_know: 'Shaky', i_need_help: 'Need help' };
export const CONFIDENCE_OPTIONS_LP = CONFIDENCE_OPTIONS.map((o) => ({ ...o, label: LP_LABELS[o.value] }));

export default CONFIDENCE_OPTIONS;
