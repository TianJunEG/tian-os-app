/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        // main's pages use font-display for headers; map it to our brand serif.
        display: ['Fraunces', 'Georgia', 'serif'],
        hand: ['Caveat', 'cursive'],
        // Tian OS unified shell: Inter for UI/body, JetBrains Mono for numerics.
        ui: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      boxShadow: {
        resting: '0 6px 24px rgba(0,0,0,0.04)',
        active: '0 10px 32px rgba(0,0,0,0.07)',
      },
      keyframes: {
        'pulse-once': {
          '0%': { boxShadow: '0 0 0 0 rgba(232, 189, 62, 0.5)' },
          '50%': { boxShadow: '0 0 0 8px rgba(232, 189, 62, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(232, 189, 62, 0)' },
        },
      },
      animation: {
        'pulse-once': 'pulse-once 1.5s ease-out 0.3s 2',
      },
      colors: {
        // Tian OS neutral system — ink (text), paper/ivory/bone (surfaces), hairline (borders).
        ink: { 900: '#0E1320', 700: '#1F2330', 500: '#5B5F6E', 300: '#9A9DA9', 100: '#C9CBD3' },
        paper: '#FFFFFF', ivory: '#FFF8EA', bone: '#F3EED8', hairline: '#EDE8D4',
        tianLavender: '#F1ECFF',
        tianMint: '#EAF9F1',
        tianSky: '#EAF4FF',
        tianPeach: '#FFF1E8',
        tianYellow: '#FFF8E1',
        tianRose: '#FFEFF3',
        // Mastery heatmap scale (ivory → navy).
        mastery: { 0: '#E8F5F7', 1: '#C5E8EC', 2: '#9DD9E0', 3: '#6DCAD4', 4: '#3FBAC8', 5: '#0F4C5C' },
        success: { 100: '#DEF0E8', 500: '#2F8F6F', 700: '#1F6B53' },
        error: { 100: '#F4DAD6', 500: '#B4453C', 700: '#8A2F28' },
        // Tian OS brand palette — clean white + deep navy + soft gold.
        navy: {
          50: '#f3f6fb', 100: '#e2e9f3', 200: '#c5d3e7', 300: '#9fb3d1',
          400: '#5d7aa8', 500: '#2f4f7e', 600: '#1d3a63', 700: '#142b4d',
          800: '#0e2240', 900: '#0a1a33',
        },
        gold: {
          50: '#FFF8E5', 100: '#FFEFCC', 200: '#FFE099', 300: '#FFD166',
          400: '#E8BD3E', 500: '#D4A935', 600: '#B88F1E',
        },
        teal: { 50: '#E8F5F7', 100: '#C5E8EC', 200: '#9DD9E0', 300: '#6DCAD4', 400: '#3FBAC8', 500: '#0F4C5C', 600: '#0D4150', 700: '#0A3542', 800: '#073B4C', 900: '#052D3A' },
        sky: { 100: '#D6ECFA', 200: '#BDDFF5', 300: '#A7D8F0', 400: '#8ECBE8', 500: '#75BEE0' },
        lavender: { 100: '#EDE5F5', 200: '#DBCCEb', 300: '#C9B6E4', 400: '#B69FDB', 500: '#A388D2' },
        coral: { 100: '#FDEDEA', 200: '#F9D4CE', 300: '#F5B8AE', 400: '#F0A090', 500: '#F28C7A', 600: '#E06B56' },
        // primary repointed to teal so existing primary-* usages adopt the brand.
        primary: {
          DEFAULT: '#0F4C5C', 50: '#E8F5F7', 100: '#C5E8EC', 200: '#9DD9E0', 300: '#6DCAD4', 400: '#3FBAC8', 500: '#0F4C5C', 600: '#0D4150', 700: '#0A3542', 800: '#073B4C', 900: '#052D3A',
        },
      },
    },
  },
  plugins: [],
}
