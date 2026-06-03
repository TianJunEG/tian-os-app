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
      colors: {
        // Tian OS neutral system — ink (text), paper/ivory/bone (surfaces), hairline (borders).
        ink: { 900: '#0E1320', 700: '#1F2330', 500: '#5B5F6E', 300: '#9A9DA9', 100: '#C9CBD3' },
        paper: '#FFFFFF', ivory: '#FAFBFC', bone: '#F3F1EA', hairline: '#EFEDE6',
        tianLavender: '#F1ECFF',
        tianMint: '#EAF9F1',
        tianSky: '#EAF4FF',
        tianPeach: '#FFF1E8',
        tianYellow: '#FFF8E1',
        tianRose: '#FFEFF3',
        // Mastery heatmap scale (ivory → navy).
        mastery: { 0: '#F3F1EA', 1: '#DDE3F0', 2: '#B5C2DD', 3: '#6B7FA8', 4: '#2E4477', 5: '#1A2A4F' },
        success: { 100: '#DEF0E8', 500: '#2F8F6F', 700: '#1F6B53' },
        error: { 100: '#F4DAD6', 500: '#B4453C', 700: '#8A2F28' },
        // Tian OS brand palette — clean white + deep navy + soft gold.
        navy: {
          50: '#f3f6fb', 100: '#e2e9f3', 200: '#c5d3e7', 300: '#9fb3d1',
          400: '#5d7aa8', 500: '#2f4f7e', 600: '#1d3a63', 700: '#142b4d',
          800: '#0e2240', 900: '#0a1a33',
        },
        gold: {
          50: '#fbf7ec', 100: '#f6edd2', 200: '#ecd9a0', 300: '#e0c06a',
          400: '#d4af37', 500: '#c9a24b', 600: '#a9863a', 700: '#87692d',
        },
        // primary repointed to navy so existing primary-* usages adopt the brand.
        primary: {
          50: '#f3f6fb', 100: '#e2e9f3', 500: '#2f4f7e', 600: '#1d3a63', 700: '#142b4d',
        },
      },
    },
  },
  plugins: [],
}
