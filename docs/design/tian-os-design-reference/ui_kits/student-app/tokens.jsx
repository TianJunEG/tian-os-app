// tokens.jsx — Tian OS design tokens as JS constants
// Mirror of colors_and_type.css for use in style objects

const T = {
  navy900: '#0E1A36',
  navy700: '#1A2A4F',
  navy500: '#2E4477',
  navy300: '#6B7FA8',
  navy100: '#DDE3F0',
  navy050: '#F1F4FA',

  gold700: '#8E6F1F',
  gold500: '#C9A23C',
  gold300: '#E3C97A',
  gold100: '#F6EBC9',

  ink900: '#0E1320',
  ink700: '#1F2330',
  ink500: '#5B5F6E',
  ink300: '#9A9DA9',
  ink100: '#C9CBD3',

  paper:   '#FFFFFF',
  ivory:   '#FAFAF7',
  bone:    '#F3F1EA',
  hairline:'#EFEDE6',

  success500: '#2F8F6F',
  success100: '#DEF0E8',
  warn500:    '#C9A23C',
  warn100:    '#F6EBC9',
  error500:   '#B4453C',
  error100:   '#F4DAD6',

  // Mastery scale
  m0: '#F3F1EA',
  m1: '#DDE3F0',
  m2: '#B5C2DD',
  m3: '#6B7FA8',
  m4: '#2E4477',
  m5: '#1A2A4F',
  mGold: '#C9A23C',

  // Module accents
  modMath:    '#1A2A4F',
  modScience: '#2F6B7E',
  modSpell:   '#6B4F7E',
  modRead:    '#7E5A2F',
  modPlan:    '#2F7E5A',

  // Typography
  fontDisplay: "'Fraunces', Georgia, serif",
  fontText:    "'Inter', -apple-system, system-ui, sans-serif",
  fontMono:    "'JetBrains Mono', ui-monospace, Menlo, monospace",

  // Shadows
  shadowResting: '0 1px 2px rgba(26,42,79,.04), 0 8px 24px -12px rgba(26,42,79,.06)',
  shadowActive:  '0 4px 16px -4px rgba(26,42,79,.10), 0 12px 40px -8px rgba(26,42,79,.08)',
  shadowOverlay: '0 12px 32px -8px rgba(26,42,79,.16), 0 24px 64px -16px rgba(26,42,79,.12)',
  shadowFocus:   '0 0 0 4px rgba(201,162,60,.18)',

  // Radii
  rXS: 6, rS: 10, rM: 14, rL: 20, rXL: 28,

  // Easing
  easeCalm: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
};

window.T = T;
