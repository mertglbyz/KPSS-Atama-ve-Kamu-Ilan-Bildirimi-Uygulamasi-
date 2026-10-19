/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#F4F7FB',
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E2E8F0',
        brand: {
          50: '#E8F0FE',
          100: '#D5E3FB',
          700: '#0B3A82',
          800: '#082E68',
        },
      },
    },
  },
  plugins: [],
};
