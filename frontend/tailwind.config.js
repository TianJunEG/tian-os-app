/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Hanken Grotesk', 'system-ui', 'sans-serif'],
        display: ['Hanken Grotesk', 'system-ui', 'sans-serif'],
        ui: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
        'lower-display': ['Fredoka', 'system-ui', 'sans-serif'],
        'lower-body': ['Nunito', 'system-ui', 'sans-serif'],
        'marketing': ['Newsreader', 'Georgia', 'serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '1.5' }],
        'sm': ['14px', { lineHeight: '1.5' }],
        'base': ['16px', { lineHeight: '1.6' }],
        'lg': ['18px', { lineHeight: '1.5' }],
        'xl': ['22px', { lineHeight: '1.35' }],
        '2xl': ['28px', { lineHeight: '1.25' }],
      },
      borderRadius: {
        'card': '20px',
        'btn': '14px',
      },
      boxShadow: {
        resting: '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        active: '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        glow: '0 0 0 3px rgba(16,185,129,0.25)',
        'step-shell': '0 20px 44px -30px rgba(30,42,66,0.4)',
        'dashboard-card': '0 8px 26px -16px rgba(30,42,66,0.30), 0 1px 2px rgba(30,42,66,0.06)',
        'results-panel': '0 24px 50px -30px rgba(13,23,48,0.6)',
        'gold-btn': '0 2px 8px rgba(217,137,46,0.35)',
        'gold-btn-dark': '0 4px 14px -4px rgba(217,137,46,0.6)',
        'hint-card': '0 18px 40px -22px rgba(30,42,66,0.3)',
        'app-window': '0 36px 70px -34px rgba(30,42,66,0.45)',
      },
      keyframes: {
        'pulse-emerald': {
          '0%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.5)' },
          '50%': { boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'pulse-emerald': 'pulse-emerald 1.5s ease-out 0.3s 2',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      colors: {
        // Emerald primary — the brand colour
        emerald: {
          50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7',
          400: '#34D399', 500: '#10B981', 600: '#059669', 700: '#047857',
          800: '#065F46', 900: '#064E3B',
        },
        // Sunshine — warm accent (achievements, streaks, gold stars)
        sunshine: {
          50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D',
          400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
        },
        // Violet — cool accent (special badges, mastery highlights)
        violet: {
          50: '#F5F3FF', 100: '#EDE9FE', 200: '#DDD6FE', 300: '#C4B5FD',
          400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED', 700: '#6D28D9',
        },
        // Sky — info / trust
        sky: {
          50: '#F0F9FF', 100: '#E0F2FE', 200: '#BAE6FD', 300: '#7DD3FC',
          400: '#38BDF8', 500: '#0EA5E9', 600: '#0284C7', 700: '#0369A1',
        },
        // Rose — errors / attention
        rose: {
          50: '#FFF1F2', 100: '#FFE4E6', 200: '#FECDD3', 300: '#FDA4AF',
          400: '#FB7185', 500: '#F43F5E', 600: '#E11D48', 700: '#BE123C',
        },
        // Slate neutral system
        slate: {
          50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1',
          400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155',
          800: '#1E293B', 900: '#0F172A',
        },
        // Surfaces
        paper: '#FFFFFF',
        canvas: '#F8FAFC',
        subtle: '#F1F5F9',
        // Tinted surfaces for card tones
        'tint-emerald': '#ECFDF5',
        'tint-sunshine': '#FFFBEB',
        'tint-violet': '#F5F3FF',
        'tint-sky': '#F0F9FF',
        'tint-rose': '#FFF1F2',
        'tint-slate': '#F8FAFC',
        // Mastery heatmap scale (emerald gradient)
        mastery: {
          0: '#ECFDF5', 1: '#D1FAE5', 2: '#A7F3D0',
          3: '#6EE7B7', 4: '#34D399', 5: '#064E3B',
        },
        // Semantic
        success: { 100: '#D1FAE5', 500: '#10B981', 600: '#059669', 700: '#047857' },
        error: { 100: '#FFE4E6', 500: '#F43F5E', 600: '#E11D48', 700: '#BE123C' },
        // Backward-compat aliases
        ink: { 900: '#0F172A', 800: '#232c39', 700: '#334155', 600: '#475569', 500: '#64748B', 400: '#94A3B8', 300: '#CBD5E1', 200: '#e7eaef', 100: '#F1F5F9' },
        'ds-green': { 50: '#f3faf6', 100: '#eaf6ef', 200: '#e7f3ec', 300: '#d8ece1', 400: '#57b389', 500: '#1f9d57', 600: '#1f8a5b', 700: '#1f8a52' },
        'ds-red': { 50: '#fbece9', 100: '#fdeeea', 200: '#ecc3ba', 500: '#d8694f' },
        'ds-blue': { 50: '#eaf3fc', 100: '#cfe3f7', 500: '#2f80d8' },
        'ds-dark': { 900: '#0c1730', 800: '#101d36', 700: '#13223e', 600: '#172a49', 500: '#1d3157', 400: '#2a3a59', 'text': '#f4f0e8', 'muted': '#8a98b2' },
        hairline: '#E2E8F0',
        bone: '#F1F5F9',
        ivory: '#F8FAFC',
        // Legacy navy → maps to emerald for gradual migration
        navy: {
          50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7',
          400: '#34D399', 500: '#059669', 600: '#047857', 700: '#065F46',
          800: '#064E3B', 900: '#064E3B',
        },
        gold: {
          50: '#fffbf0', 100: '#fdf6ea', 200: '#fbf1e1', 300: '#f0dcb8',
          400: '#e3a64f', 500: '#d9892e', 600: '#b06f1f', 700: '#a8743a',
          800: '#8a5e2a',
        },
        // Remaining legacy aliases
        teal: {
          50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7',
          400: '#34D399', 500: '#059669', 600: '#047857', 700: '#065F46',
          800: '#064E3B', 900: '#064E3B',
        },
        coral: {
          100: '#FFE4E6', 200: '#FECDD3', 300: '#FDA4AF',
          400: '#FB7185', 500: '#F43F5E', 600: '#E11D48',
        },
        lavender: {
          100: '#EDE9FE', 200: '#DDD6FE', 300: '#C4B5FD',
          400: '#A78BFA', 500: '#8B5CF6',
        },
        primary: {
          DEFAULT: '#059669', 50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0',
          300: '#6EE7B7', 400: '#34D399', 500: '#059669', 600: '#047857',
          700: '#065F46', 800: '#064E3B', 900: '#064E3B',
        },
        // Tinted surface aliases for existing components
        tianLavender: '#F5F3FF',
        tianMint: '#ECFDF5',
        tianSky: '#F0F9FF',
        tianPeach: '#FFF1F2',
        tianYellow: '#FFFBEB',
        tianRose: '#FFF1F2',
      },
    },
  },
  plugins: [],
}
