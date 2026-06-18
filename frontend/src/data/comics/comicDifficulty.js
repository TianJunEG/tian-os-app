// Comic difficulty engine — keeps the SAME pictures and story but scales the
// numbers in each problem to the reader's level.
//
// Episodes opt in by giving a problem a `generate(rng, tier, ctx)` function
// instead of static question/answer fields. The reader resolves a difficulty
// `tier` from the student's level (never easier than the episode's own grade),
// seeds one RNG per reading, and threads a shared `ctx` through the panels in
// order so story-linked numbers stay consistent (e.g. "the food cost $X" in a
// later panel reuses the total computed earlier). Problems with no generate()
// keep their static numbers — so conversion can roll out episode by episode.

// ── Seeded RNG (mulberry32) — same generator the MathPath engines use ─────────
export function makeRng(seedStr) {
  let a = typeof seedStr === 'number' ? seedStr >>> 0 : hashSeed(String(seedStr));
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function rint(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
export function pick(rng, arr) {
  return arr[rint(rng, 0, arr.length - 1)];
}

// ── Level → difficulty tier (0..3) ───────────────────────────────────────────
// Parse a level string ("P4", "Primary 4", "Secondary 1", "S1") to a year band.
// Mirrors design-os/studentVisualMode.js so comic tiers track the same bands.
function levelToYear(level = '') {
  const raw = String(level || '').toLowerCase();
  const sec = raw.match(/(?:secondary|sec|s)\s*([1-6])/i);
  if (sec) return 6 + Number(sec[1]);          // S1 → 7 … so any secondary > P6
  const pri = raw.match(/(?:primary|p)\s*([1-6])/i);
  if (pri) return Number(pri[1]);              // P1..P6 → 1..6
  return 0;                                     // unknown
}

const yearToTier = (year) =>
  year >= 7 ? 3 : year >= 5 ? 2 : year >= 3 ? 1 : year >= 1 ? 0 : 1;

// Resolve the tier for a reading: the harder of the student's own level and the
// episode's intended grade, so a P3–P4 episode is never trivially easy and an
// advanced reader gets harder numbers on the very same story.
export function resolveTier(user = {}, episodeGrade = '') {
  const studentYear = levelToYear(
    user?.level || user?.studentLevel || user?.moeLevel || user?.profile?.level || user?.profile?.studentLevel,
  );
  // Episode grade like "P3–P4" / "P5–P6" — take the upper bound as the floor.
  const years = String(episodeGrade).match(/\d/g)?.map(Number) || [];
  const episodeFloor = years.length ? Math.max(...years) : 0;
  const effective = Math.max(studentYear, episodeFloor);
  return yearToTier(effective || 4); // default to upper-primary if nothing known
}

// A value drawn from a per-tier [min,max] band. `bands` is [t0, t1, t2, t3];
// tiers beyond the list clamp to the last band.
export function tierInt(rng, tier, bands) {
  const [lo, hi] = bands[Math.min(tier, bands.length - 1)];
  return rint(rng, lo, hi);
}

// Generate the concrete problem for each panel, in order, sharing one ctx so
// story-linked values stay consistent. Returns an array aligned to panels;
// each entry merges the static problem fields with the generated ones (and may
// carry a `menuNote` override when prices are regenerated).
export function generateEpisodeProblems(episode, tier, seed) {
  const rng = makeRng(`${episode.id}:${seed}`);
  const ctx = {};
  return episode.panels.map((panel) => {
    const p = panel.problem;
    if (!p) return null;
    if (typeof p.generate !== 'function') return p; // static problem — unchanged
    const dynamic = p.generate(rng, tier, ctx) || {};
    return { ...p, ...dynamic };
  });
}
