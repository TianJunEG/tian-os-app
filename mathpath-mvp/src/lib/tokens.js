// tokens.js — Tian OS design tokens (light premium system).
// Ported from the Tian OS Design System handoff (colors_and_type.css). Used by the JS-styled
// primitives so the MathPath screens match the design system pixel-for-pixel.

export const T = {
  // Brand — navy
  navy900: '#0E1A36',
  navy700: '#1A2A4F',
  navy500: '#2E4477',
  navy300: '#6B7FA8',
  navy100: '#DDE3F0',
  navy050: '#F1F4FA',
  // Brand — gold
  gold700: '#8E6F1F',
  gold500: '#C9A23C',
  gold300: '#E3C97A',
  gold100: '#F6EBC9',
  // Neutrals
  ink900: '#0E1320',
  ink700: '#1F2330',
  ink500: '#5B5F6E',
  ink300: '#9A9DA9',
  ink100: '#C9CBD3',
  paper: '#FFFFFF',
  ivory: '#FAFAF7',
  bone: '#F3F1EA',
  hairline: '#EFEDE6',
  // Semantic
  success700: '#1F6B53',
  success500: '#2F8F6F',
  success100: '#DEF0E8',
  error700: '#8A2F28',
  error500: '#B4453C',
  error100: '#F4DAD6',
  // Mastery heatmap
  m0: '#F3F1EA', m1: '#DDE3F0', m2: '#B5C2DD', m3: '#6B7FA8', m4: '#2E4477', m5: '#1A2A4F',
  // Type
  fontDisplay: "'Fraunces', Georgia, serif",
  fontText: "'Inter', -apple-system, system-ui, sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, Menlo, monospace",
  // Elevation
  shadowResting: '0 1px 2px rgba(26,42,79,.04), 0 8px 24px -12px rgba(26,42,79,.06)',
  shadowActive: '0 4px 16px -4px rgba(26,42,79,.10), 0 12px 40px -8px rgba(26,42,79,.08)',
  shadowOverlay: '0 12px 32px -8px rgba(26,42,79,.16), 0 24px 64px -16px rgba(26,42,79,.12)',
  shadowFocus: '0 0 0 4px rgba(201,162,60,.18)',
  // Motion
  easeCalm: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

// Module accent colors (used only on a module's own surface).
export const MODULE_COLORS = {
  mathpath: '#1A2A4F',
  science: '#2F6B7E',
  spelling: '#6B4F7E',
  planner: '#2F7E5A',
};

// Fluency tone → chip styling (speed/accuracy dial).
export const FLUENCY = {
  fast: { c: T.success500, bg: T.success100, label: 'Fast' },
  med: { c: T.gold700, bg: T.gold100, label: 'Steady' },
  slow: { c: T.error500, bg: T.error100, label: 'Building' },
};
