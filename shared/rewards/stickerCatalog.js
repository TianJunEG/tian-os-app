// Single source of truth for the reward-chart sticker set, shared by the backend
// (validate award codes, pick auto stickers) and the frontend (render the chart).
// Fluent Emoji art is MIT-licensed (Microsoft) and vendored under
// frontend/public/stickers/; the Kaesy "special" uses our own mascot art.

export const STICKER_GOAL_SIZE = 10; // stickers per chart before a prize unlocks

const fluent = (code, label) => ({ code, label, image: `/stickers/sticker-${code}.png`, kind: 'fluent' });

export const STICKERS = [
  fluent('star', 'Gold star'),
  fluent('glowing-star', 'Glowing star'),
  fluent('trophy', 'Trophy'),
  fluent('medal', 'Gold medal'),
  fluent('sports-medal', 'Sports medal'),
  fluent('party', 'Party popper'),
  fluent('rocket', 'Rocket'),
  fluent('rainbow', 'Rainbow'),
  fluent('unicorn', 'Unicorn'),
  fluent('fire', 'On fire'),
  fluent('hundred', 'Hundred points'),
  fluent('crown', 'Crown'),
  fluent('sparkles', 'Sparkles'),
  fluent('balloon', 'Balloon'),
  fluent('bulb', 'Bright idea'),
  fluent('brain', 'Big brain'),
  fluent('starstruck', 'Star-struck'),
  fluent('sun', 'Sunshine'),
  { code: 'kaesy-cheer', label: 'Kaesy cheer', image: '/mascots/kaesy-full.png', kind: 'mascot', special: true },
];

export const STICKER_BY_CODE = Object.fromEntries(STICKERS.map((s) => [s.code, s]));

export function isValidStickerCode(code) {
  return Boolean(STICKER_BY_CODE[String(code || '')]);
}

// Auto-awarded stickers (e.g. a strong homework week) rotate through a fun subset
// so a student doesn't get the same one every time.
export const AUTO_STICKER_POOL = ['star', 'glowing-star', 'trophy', 'rocket', 'rainbow', 'party', 'hundred', 'medal'];

export function pickAutoSticker(seed = 0) {
  const n = Math.abs(Math.floor(Number(seed) || 0));
  return AUTO_STICKER_POOL[n % AUTO_STICKER_POOL.length];
}

// Derive goal-chart progress from a plain collected count: how many full charts
// the student has completed, how many slots are filled in the current chart, and
// how many remain before the next prize.
export function stickerChartProgress(total, goalSize = STICKER_GOAL_SIZE) {
  const t = Math.max(0, Math.floor(Number(total) || 0));
  const g = Math.max(1, Math.floor(Number(goalSize) || STICKER_GOAL_SIZE));
  const completedCharts = Math.floor(t / g);
  const filledInCurrent = t % g;
  return {
    total: t,
    goalSize: g,
    completedCharts,
    filledInCurrent,
    remaining: g - filledInCurrent,
    justCompleted: t > 0 && filledInCurrent === 0,
  };
}
