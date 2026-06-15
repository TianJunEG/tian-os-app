/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Fonts ────────────────────────────────────────────────────────────
      fontFamily: {
        sans:  ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
        play:  ['"Fredoka"', '"Hanken Grotesk"', 'sans-serif'],   // lower-primary skin
        body2: ['"Nunito"', 'sans-serif'],                         // lower-primary skin
        serif: ['"Newsreader"', 'Georgia', 'serif'],               // marketing only
      },

      // ── Colors ───────────────────────────────────────────────────────────
      colors: {
        // === Primary spec tokens (DESIGN_SYSTEM.md §9) =====================
        gold:    { DEFAULT: '#d9892e', deep: '#b06f1f', label: '#a8743a',
                   tint: '#fbf1e1', tint2: '#fdf6ea', tint3: '#f6eee3', border: '#f0dcb8' },
        emerald: { DEFAULT: '#1f8a5b', deep: '#175f40', bright: '#1f9d57',
                   tint: '#e7f3ec', border: '#d8ece1',
                   // numeric shims — keep old classes working during migration
                   50: '#e7f3ec', 100: '#e7f3ec', 200: '#d8ece1', 300: '#d8ece1',
                   400: '#1f9d57', 500: '#1f8a5b', 600: '#1f8a5b',
                   700: '#175f40', 800: '#175f40', 900: '#175f40' },
        blue:    { DEFAULT: '#2f80d8', tint: '#eaf3fc', border: '#cfe3f7',
                   50: '#eaf3fc', 100: '#eaf3fc', 200: '#cfe3f7', 300: '#cfe3f7',
                   400: '#2f80d8', 500: '#2f80d8', 600: '#2f80d8', 700: '#2266b8' },
        danger:  { DEFAULT: '#d8694f', deep: '#c8472f', tint: '#fdeeea', border: '#f3cabf',
                   50: '#fdeeea', 100: '#fdeeea', 200: '#f3cabf', 300: '#f3cabf',
                   400: '#d8694f', 500: '#d8694f', 600: '#c8472f', 700: '#c8472f', 800: '#a3391e' },
        ink:     { DEFAULT: '#232c39', dash: '#1c2433' },
        body:    { DEFAULT: '#46505f', soft: '#5a6675', muted: '#6b7585',
                   faint: '#8a93a3', faint2: '#9aa1b0' },
        surface: { app: '#e7eaef', dash: '#eef1f5', raised: '#f5f6f8',
                   white: '#ffffff', keypad: '#f3f4f7' },
        line:    { DEFAULT: '#e7eaef', soft: '#eaedf2', strong: '#dde1e8',
                   note: '#eef1f4', margin: '#f3cfd0' },
        dot:     '#d3d8e0',
        dark:    { 1: '#13223e', 2: '#101d36', card: '#172a49', card2: '#1d3157',
                   border: '#2a3a59', text: '#f4f0e8', muted: '#aebbd2', muted2: '#8a98b2' },
        purple:  { DEFAULT: '#7c4dbd', tint: '#f4ecfb',
                   50: '#f4ecfb', 100: '#f4ecfb', 200: '#e8d9f7', 300: '#d5bcf0',
                   400: '#a87fd9', 500: '#7c4dbd', 600: '#7c4dbd', 700: '#6a3da8' },
        // marketing only
        mkt:     { paper: '#f4efe6', paper2: '#faf6ef', navy: '#13223e', navy2: '#0e1a31',
                   periwinkle: '#5d86f0', periwinkle2: '#8fb1ff', amber: '#cf8a44', rule: '#e1d9ca' },

        // sunshine / violet / sky / rose — shims so old pages keep rendering
        // during migration to gold / purple / blue / danger
        sunshine:{ 50: '#fdf6ea', 100: '#fbf1e1', 200: '#f6eee3', 300: '#f0dcb8',
                   400: '#d9892e', 500: '#d9892e', 600: '#b06f1f', 700: '#a8743a' },
        violet:  { 50: '#f4ecfb', 100: '#f4ecfb', 200: '#e8d9f7', 300: '#d5bcf0',
                   400: '#a87fd9', 500: '#7c4dbd', 600: '#7c4dbd', 700: '#6a3da8' },
        sky:     { 50: '#eaf3fc', 100: '#eaf3fc', 200: '#cfe3f7', 300: '#cfe3f7',
                   400: '#2f80d8', 500: '#2f80d8', 600: '#2f80d8', 700: '#2266b8' },
        rose:    { 50: '#fdeeea', 100: '#fdeeea', 200: '#f3cabf', 300: '#f3cabf',
                   400: '#d8694f', 500: '#d8694f', 600: '#c8472f', 700: '#c8472f', 800: '#a3391e' },

        // === Backward-compat ================================================
        slate: {
          50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1',
          400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155',
          800: '#1E293B', 900: '#0F172A',
        },
        // Mastery heatmap (emerald gradient, 0–5)
        mastery: {
          0: '#e7f3ec', 1: '#d8ece1', 2: '#a7d4be',
          3: '#5fad8a', 4: '#1f9d57', 5: '#1f8a5b',
        },
        // Tinted surface aliases
        'tint-emerald':  '#e7f3ec',
        'tint-violet':   '#f4ecfb',
        'tint-sky':      '#eaf3fc',
        'tint-rose':     '#fdeeea',
        'tint-sunshine': '#fdf6ea',
        'tint-slate':    '#F8FAFC',
        tianLavender: '#f4ecfb',
        tianMint:     '#e7f3ec',
        tianSky:      '#eaf3fc',
        tianPeach:    '#fdeeea',
        tianYellow:   '#fdf6ea',
        tianRose:     '#fdeeea',
        // Surface shorthands
        paper:  '#ffffff',
        canvas: '#e7eaef',
        subtle: '#f5f6f8',
        // Legacy aliases kept for AppShell / nav
        ivory:    '#f5f6f8',
        hairline: '#eaedf2',
        'success-500': '#1f8a5b',
        'error-500':   '#d8694f',
        navy: {
          50: '#e7f3ec', 100: '#e7f3ec', 200: '#d8ece1', 300: '#d8ece1',
          400: '#1f9d57', 500: '#1f8a5b', 600: '#1f8a5b',
          700: '#175f40', 800: '#175f40', 900: '#175f40',
        },
        ink: {
          DEFAULT: '#232c39', dash: '#1c2433',
          900: '#232c39', 800: '#232c39', 700: '#46505f', 600: '#5a6675',
          500: '#6b7585', 400: '#8a93a3', 300: '#9aa1b0', 200: '#eaedf2', 100: '#f5f6f8',
        },
        // ds-* aliases
        'ds-green': { 50: '#f3faf6', 100: '#eaf6ef', 200: '#e7f3ec', 300: '#d8ece1',
                      400: '#57b389', 500: '#1f9d57', 600: '#1f8a5b', 700: '#1f8a52' },
        'ds-red':   { 50: '#fbece9', 100: '#fdeeea', 200: '#ecc3ba', 500: '#d8694f' },
        'ds-blue':  { 50: '#eaf3fc', 100: '#cfe3f7', 500: '#2f80d8' },
        'ds-dark':  { 900: '#0c1730', 800: '#101d36', 700: '#13223e', 600: '#172a49',
                      500: '#1d3157', 400: '#2a3a59', text: '#f4f0e8', muted: '#8a98b2' },
      },

      // ── Border radius ────────────────────────────────────────────────────
      borderRadius: {
        chip:  '9px',
        pill2: '11px',
        btn:   '12px',
        card:  '14px',
        shell: '16px',
        dash:  '22px',
      },

      // ── Shadows ──────────────────────────────────────────────────────────
      boxShadow: {
        shell:        '0 20px 44px -30px rgba(30,42,66,0.4)',
        window:       '0 36px 70px -34px rgba(30,42,66,0.45)',
        card:         '0 8px 26px -16px rgba(30,42,66,0.30), 0 1px 2px rgba(30,42,66,0.06)',
        rest:         '0 1px 3px rgba(30,42,66,0.05)',
        gold:         '0 2px 8px rgba(217,137,46,0.35)',
        'gold-dark':  '0 4px 14px -4px rgba(217,137,46,0.6)',
        'gold-card':  '0 6px 20px -12px rgba(217,137,46,0.35)',
        results:      '0 24px 50px -30px rgba(13,23,48,0.6)',
        logo:         '0 2px 6px rgba(210,129,44,0.4)',
        drawer:       '18px 0 50px -20px rgba(19,34,62,0.45)',
        // legacy aliases
        resting:           '0 1px 3px rgba(30,42,66,0.05)',
        active:            '0 8px 26px -16px rgba(30,42,66,0.30), 0 1px 2px rgba(30,42,66,0.06)',
        glow:              '0 0 0 3px rgba(31,138,91,0.25)',
        'step-shell':      '0 20px 44px -30px rgba(30,42,66,0.4)',
        'dashboard-card':  '0 8px 26px -16px rgba(30,42,66,0.30), 0 1px 2px rgba(30,42,66,0.06)',
        'results-panel':   '0 24px 50px -30px rgba(13,23,48,0.6)',
        'gold-btn':        '0 2px 8px rgba(217,137,46,0.35)',
        'gold-btn-dark':   '0 4px 14px -4px rgba(217,137,46,0.6)',
        'app-window':      '0 36px 70px -34px rgba(30,42,66,0.45)',
        'hint-card':       '0 18px 40px -22px rgba(30,42,66,0.3)',
      },

      // ── Spacing (base 2px; 5.5=22, 6.5=26, 8.5=34, 11=44) ───────────────
      spacing: {
        5.5: '22px',
        6.5: '26px',
        8.5: '34px',
        11:  '44px',
      },

      // ── Max widths ────────────────────────────────────────────────────────
      maxWidth: {
        app:  '1360px',
        dash: '1440px',
        mkt:  '1180px',
      },

      // ── Background images & sizes ─────────────────────────────────────────
      backgroundImage: {
        'logo-gold':    'linear-gradient(150deg, #e3a64f, #d2812c)',
        'logo-emerald': 'linear-gradient(150deg, #39b07e, #1f8a5b)',
        'logo-peri':    'linear-gradient(135deg, #5d86f0, #8fb1ff)',
        'dots':         'radial-gradient(#d3d8e0 1px, transparent 1.4px)',
      },
      backgroundSize: {
        dots: '26px 26px',
      },

      // ── Animations ────────────────────────────────────────────────────────
      keyframes: {
        'pulse-emerald': {
          '0%':   { boxShadow: '0 0 0 0 rgba(31,138,91,0.5)' },
          '50%':  { boxShadow: '0 0 0 8px rgba(31,138,91,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(31,138,91,0)' },
        },
        'bounce-in': {
          '0%':   { transform: 'scale(0.3)', opacity: '0' },
          '50%':  { transform: 'scale(1.05)' },
          '70%':  { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'pulse-emerald': 'pulse-emerald 1.5s ease-out 0.3s 2',
        'bounce-in':     'bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-up':      'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
