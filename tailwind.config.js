/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        night: '#090D16',
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E2E8F0',
        mint: '#10B981',
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          700: '#2563EB',
          800: '#1D4ED8',
        },
      },
    },
  },
  plugins: [],
};
