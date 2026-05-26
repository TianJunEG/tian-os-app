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
        hand: ['Caveat', 'cursive'],
      },
      colors: {
        // Edu OS brand palette — clean white + deep navy + soft gold.
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
