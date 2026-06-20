// The Tian 7 — mascot definitions for Tian OS.
// Each mascot anchors a module and can guest-appear elsewhere.
// Visual style: chibi robot-hybrid streetwear kids.

const MASCOTS = {
  tiano: {
    name: 'Tiano',
    age: 18,
    gender: 'boy',
    color: '#0284c7',       // sky blue
    colorLight: '#e0f2fe',
    module: 'home',
    role: 'Welcome guide',
    greeting: (name) => `Hey ${name}, ready to learn?`,
  },
  lysa: {
    name: 'Lysa',
    age: 16,
    gender: 'girl',
    color: '#7c3aed',       // lavender
    colorLight: '#ede9fe',
    module: 'spelling',
    role: 'Spelling coach',
    greeting: (name) => `Let's spell it out, ${name}!`,
  },
  lejo: {
    name: 'Lejo',
    age: 14,
    gender: 'boy',
    color: '#ea580c',       // bright orange
    colorLight: '#fff7ed',
    module: 'psl',
    role: 'Problem solver',
    greeting: (name) => `Think it through, ${name}!`,
  },
  chelya: {
    name: 'Chelya',
    age: 12,
    gender: 'girl',
    color: '#059669',       // sage green
    colorLight: '#ecfdf5',
    module: 'progress',
    role: 'Progress reporter',
    greeting: (name) => `Look how far you've come, ${name}!`,
  },
  talia: {
    name: 'Talia',
    age: 10,
    gender: 'girl',
    color: '#e11d48',       // coral pink
    colorLight: '#fff1f2',
    module: 'support',
    role: 'Encourager',
    greeting: (name) => `You've got this, ${name}!`,
  },
  kaesy: {
    name: 'Kaesy',
    age: 8,
    gender: 'girl',
    color: '#2563eb',       // electric blue
    colorLight: '#eff6ff',
    module: 'achievements',
    role: 'Hype & rewards',
    greeting: (name) => `Nice work, ${name}!`,
  },
  kylo: {
    name: 'Kylo',
    age: 6,
    gender: 'boy',
    color: '#1e3a5f',       // deep navy
    colorLight: '#f0f4f8',
    module: 'mathpath',
    role: 'Math buddy',
    greeting: (name) => `Let's do some math, ${name}!`,
  },
};

// Map module keys (from modules.js) to their mascot
const MODULE_MASCOT_MAP = {
  mathpath: 'kylo',
  fluency: 'kylo',
  mistakes: 'kylo',
  spelling: 'lysa',
  progress: 'chelya',
  worksheets: 'kylo',
  science: 'lejo',
  lifelab: 'chelya',
  mechanisms: 'lejo',
  psl: 'lejo',
};

export function getMascot(key) {
  return MASCOTS[key] || null;
}

// A distinct Kokoro voice per mascot, gender-matched (af_=Am. female,
// am_=Am. male). Used when the Kokoro neural engine is active; the gender/pitch
// below drive the Web Speech fallback so mascots stay distinct either way.
// Boy voices: pitch can't change Kokoro's fixed neural timbres, so the youngest
// boys use brighter/higher Kokoro IDs (am_puck/am_liam) instead of the deeper
// am_eric / bm_fable, which sounded too low in the pilot (BUG 6).
const KOKORO_VOICE = {
  tiano: 'am_liam',   // age 18 — bright young-male tone (unchanged)
  lysa: 'af_sky',
  lejo: 'am_liam',    // age 14 — was bm_fable (deep British); brighter am_liam
  chelya: 'af_sarah',
  talia: 'af_heart',
  kaesy: 'bf_alice',
  kylo: 'am_puck',    // age 6 — was am_eric; am_puck is the brightest male voice
};

// Voice profile for a mascot: gender (for voice selection) plus a pitch/rate
// derived from age so each of the Tian 7 sounds distinct — younger mascots
// speak a little higher, boys lower than girls. Pitch is clamped to the
// SpeechSynthesis range (0–2). The consumer (utils/sound speak) prefers the
// per-mascot Kokoro voice and falls back to a gender-matching system voice.
export function getMascotVoice(key) {
  const m = MASCOTS[key];
  if (!m) return { gender: 'female', pitch: 1.1, rate: 0.95, kokoro: 'af_heart' };
  const base = m.gender === 'boy' ? 1.05 : 1.15;
  const ageAdjust = (12 - m.age) * 0.03; // younger → higher
  const pitch = Math.max(0.5, Math.min(1.6, base + ageAdjust));
  const rate = m.age <= 8 ? 0.9 : 0.95;   // youngest speak a touch slower
  return {
    gender: m.gender === 'boy' ? 'male' : 'female',
    pitch,
    rate,
    kokoro: KOKORO_VOICE[key] || 'af_heart',
  };
}

export function getMascotForModule(moduleKey) {
  const mascotKey = MODULE_MASCOT_MAP[moduleKey];
  return mascotKey ? { key: mascotKey, ...MASCOTS[mascotKey] } : null;
}

export function getDashboardMascot() {
  return { key: 'tiano', ...MASCOTS.tiano };
}

const MASCOT_ORDER = ['tiano', 'lysa', 'lejo', 'chelya', 'talia', 'kaesy', 'kylo'];

export { MASCOTS, MODULE_MASCOT_MAP, MASCOT_ORDER };
