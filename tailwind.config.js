/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#F4F7F8',
        night: '#102027',
        ink: '#102A32',
        muted: '#5E6E76',
        line: '#E1E7EA',
        mint: '#1A4A57',
        brand: {
          50: '#E7F1F2',
          100: '#D3E4E6',
          700: '#1A4A57',
          800: '#102A32',
        },
      },
    },
  },
  plugins: [],
};
