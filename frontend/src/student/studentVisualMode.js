export const STUDENT_VISUAL_MODES = Object.freeze({
  LOWER_PRIMARY: 'lower_primary',
  UPPER_PRIMARY: 'upper_primary',
  SECONDARY: 'secondary',
});

const VALID_MODES = new Set(Object.values(STUDENT_VISUAL_MODES));

function levelNumber(level = '') {
  const raw = String(level || '').toLowerCase();
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
    page: 'student-visual-lower',
    card: 'border-sky-100 bg-gradient-to-br from-sky-50 via-paper to-pink-50 shadow-resting',
    softCard: 'border-sky-100 bg-gradient-to-br from-yellow-50 via-paper to-sky-50',
    icon: 'bg-white/80 text-navy-700 shadow-resting',
    primaryIcon: 'bg-gradient-to-br from-sky-400 to-gold-400 text-white',
    title: 'text-ink-900',
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
    card: 'border-hairline bg-paper shadow-resting',
    softCard: 'border-navy-100 bg-gradient-to-br from-navy-50 via-paper to-gold-50',
    icon: 'bg-navy-50 text-navy-700',
    primaryIcon: 'bg-navy-700 text-white',
    title: 'text-ink-900',
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
    card: 'border-hairline bg-paper shadow-resting',
    softCard: 'border-hairline bg-slate-50',
    icon: 'bg-slate-100 text-ink-700',
    primaryIcon: 'bg-ink-900 text-white',
    title: 'text-ink-900',
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
