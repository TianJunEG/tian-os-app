/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'system-ui', 'sans-serif'],
        ui: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
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
        ink: { 900: '#0F172A', 700: '#334155', 600: '#475569', 500: '#64748B', 400: '#94A3B8', 300: '#CBD5E1', 100: '#F1F5F9' },
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
          50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D',
          400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
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
