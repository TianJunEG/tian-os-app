export const STUDENT_VISUAL_MODES = Object.freeze({
  LOWER_PRIMARY: 'lower_primary',
  UPPER_PRIMARY: 'upper_primary',
  SECONDARY: 'secondary',
});

const VALID_MODES = new Set(Object.values(STUDENT_VISUAL_MODES));

function levelNumber(level = '') {
  const raw = String(level || '').toLowerCase();
  // K1/K2/Kindergarten → treat as year 1 so they get the lower-primary skin.
  if (/^k[12]?$|kindy|kindergarten|preschool|nursery/.test(raw)) return { band: 'primary', year: 1 };
  const primary = raw.match(/(?:primary|p)\s*([1-6])/i);
  if (primary) return { band: 'primary', year: Number(primary[1]) };
  const secondary = raw.match(/(?:secondary|sec|s)\s*([1-6])/i);
  if (secondary) return { band: 'secondary', year: Number(secondary[1]) };
  return { band: '', year: 0 };
}

export function resolveStudentVisualMode(studentOrUser = {}) {
  const explicit = studentOrUser.studentVisualMode
    || studentOrUser.profile?.studentVisualMode
    || studentOrUser.visualMode
    || '';
  if (VALID_MODES.has(explicit)) return explicit;

  const level = studentOrUser.level
    || studentOrUser.studentLevel
    || studentOrUser.moeLevel
    || studentOrUser.profile?.level
    || studentOrUser.profile?.studentLevel
    || '';
  const parsed = levelNumber(level);
  if (parsed.band === 'secondary') return STUDENT_VISUAL_MODES.SECONDARY;
  // P1–P3 get the gamified lower-primary skin; P4–P6 get upper-primary.
  if (parsed.band === 'primary' && parsed.year > 0 && parsed.year <= 3) return STUDENT_VISUAL_MODES.LOWER_PRIMARY;
  if (parsed.band === 'primary' && parsed.year >= 4) return STUDENT_VISUAL_MODES.UPPER_PRIMARY;
  return STUDENT_VISUAL_MODES.UPPER_PRIMARY;
}

export function isLowerPrimary(mode) {
  return mode === STUDENT_VISUAL_MODES.LOWER_PRIMARY;
}

export function isSecondary(mode) {
  return mode === STUDENT_VISUAL_MODES.SECONDARY;
}

export const VISUAL_MODE_STYLES = Object.freeze({
  lower_primary: {
    page: 'student-visual-lower skin-lower-primary',
    shell: 'bg-gradient-to-br from-sky-50 via-white to-pink-50',
    header: 'border-white/70 bg-white/85 shadow-sm',
    navActive: 'bg-sky-100 text-navy-700',
    navIdle: 'text-ink-500 hover:bg-white/70 hover:text-navy-700',
    card: 'border-sky-100 bg-gradient-to-br from-sky-50 via-paper to-pink-50 shadow-resting',
    softCard: 'border-sky-100 bg-gradient-to-br from-yellow-50 via-paper to-sky-50',
    heroCard: 'border-sky-100 bg-gradient-to-br from-sky-50 via-white to-pink-50 shadow-resting',
    heroPanel: 'bg-gradient-to-br from-sky-200 via-violet-100 to-pink-100 text-navy-700',
    accentCard: 'border-sky-100 bg-white/85 shadow-resting',
    progress: 'bg-gradient-to-r from-mint-400 to-sky-400',
    primaryCta: 'bg-violet-600 text-white hover:bg-violet-700',
    secondaryCta: 'border-sky-200 bg-white/85 text-navy-700 hover:bg-sky-50',
    icon: 'bg-white/80 text-navy-700 shadow-resting',
    primaryIcon: 'bg-gradient-to-br from-sky-400 to-gold text-white',
    title: 'text-ink-900',
    accent: 'text-navy-700',
    muted: 'text-ink-500',
    buttonSize: 'l',
    missionLabel: "🎯 Today's Mission",
    practiceCta: '🚀 Start Practice',
    streakLabel: '🔥 Streak',
    xpLabel: '💎 XP',
    profileLabel: 'My Learning Adventure',
    decorative: true,
  },
  upper_primary: {
    page: 'student-visual-upper',
    shell: 'bg-gradient-to-br from-violet-50 via-white to-mint-50',
    header: 'border-white/70 bg-white/85 shadow-sm',
    navActive: 'bg-violet-100 text-violet-800',
    navIdle: 'text-ink-500 hover:bg-white/75 hover:text-violet-800',
    card: 'border-white/80 bg-white/90 shadow-resting',
    softCard: 'border-violet-100 bg-gradient-to-br from-violet-50 via-paper to-mint-50',
    heroCard: 'border-violet-100 bg-gradient-to-br from-violet-50 via-white to-sky-50 shadow-resting',
    heroPanel: 'bg-gradient-to-br from-violet-200 via-sky-100 to-mint-100 text-violet-800',
    accentCard: 'border-violet-100 bg-white/90 shadow-resting',
    progress: 'bg-gradient-to-r from-mint-400 to-sky-500',
    primaryCta: 'bg-violet-600 text-white hover:bg-violet-700',
    secondaryCta: 'border-violet-100 bg-white/85 text-violet-800 hover:bg-violet-50',
    icon: 'bg-violet-50 text-violet-700',
    primaryIcon: 'bg-violet-600 text-white',
    title: 'text-ink-900',
    accent: 'text-violet-700',
    muted: 'text-ink-500',
    buttonSize: 'm',
    missionLabel: "Today's Mission",
    practiceCta: 'Start Practice',
    streakLabel: 'Streak',
    xpLabel: 'XP',
    profileLabel: 'My Learning Profile',
    decorative: false,
  },
  secondary: {
    page: 'student-visual-secondary',
    shell: 'bg-slate-50',
    header: 'border-hairline bg-paper/90',
    navActive: 'bg-navy-50 text-navy-700',
    navIdle: 'text-ink-500 hover:bg-navy-50 hover:text-navy-700',
    card: 'border-hairline bg-paper shadow-resting',
    softCard: 'border-hairline bg-slate-50',
    heroCard: 'border-hairline bg-paper shadow-resting',
    heroPanel: 'bg-gradient-to-br from-slate-100 to-slate-200 text-ink-800',
    accentCard: 'border-hairline bg-paper shadow-resting',
    progress: 'bg-navy-700',
    primaryCta: 'bg-navy-700 text-white hover:bg-navy-800',
    secondaryCta: 'border-hairline bg-paper text-navy-700 hover:bg-navy-50',
    icon: 'bg-slate-100 text-ink-700',
    primaryIcon: 'bg-ink-900 text-white',
    title: 'text-ink-900',
    accent: 'text-navy-700',
    muted: 'text-ink-500',
    buttonSize: 'm',
    missionLabel: 'Focus',
    practiceCta: 'Continue',
    streakLabel: 'Streak',
    xpLabel: 'XP',
    profileLabel: 'Learning Profile',
    decorative: false,
  },
});

export function getVisualModeStyles(mode) {
  return VISUAL_MODE_STYLES[mode] || VISUAL_MODE_STYLES.upper_primary;
}
