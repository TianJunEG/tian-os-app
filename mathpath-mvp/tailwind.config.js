/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Tian OS type: Fraunces display, Inter text, JetBrains Mono numerals.
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        navy: {
          900: '#0E1A36', 700: '#1A2A4F', 500: '#2E4477',
          300: '#6B7FA8', 100: '#DDE3F0', 50: '#F1F4FA',
        },
        gold: { 700: '#8E6F1F', 500: '#C9A23C', 300: '#E3C97A', 100: '#F6EBC9' },
        ink: { 700: '#1F2330', 500: '#5B5F6E', 300: '#9A9DA9', 100: '#C9CBD3' },
        paper: '#FFFFFF', ivory: '#FAFAF7', bone: '#F3F1EA', hairline: '#EFEDE6',
        success: { 500: '#2F8F6F', 100: '#DEF0E8' },
        error: { 500: '#B4453C', 100: '#F4DAD6' },
      },
    },
  },
  plugins: [],
};
