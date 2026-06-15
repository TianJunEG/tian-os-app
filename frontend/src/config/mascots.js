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

// Display order for pickers / line-ups (oldest → youngest).
const MASCOT_ORDER = ['tiano', 'lysa', 'lejo', 'chelya', 'talia', 'kaesy', 'kylo'];

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

export function getMascotForModule(moduleKey) {
  const mascotKey = MODULE_MASCOT_MAP[moduleKey];
  return mascotKey ? { key: mascotKey, ...MASCOTS[mascotKey] } : null;
}

export function getDashboardMascot() {
  return { key: 'tiano', ...MASCOTS.tiano };
}

export { MASCOTS, MASCOT_ORDER, MODULE_MASCOT_MAP };
