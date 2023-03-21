const defaultTheme = require('tailwindcss/defaultTheme')
const plugin = require('tailwindcss/plugin')

module.exports = {
  darkMode: 'class',
  content: ['./pages/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'fate-black': '#171420',
      },
      fontFamily: {
        primary: ['Racing Sans One', ...defaultTheme.fontFamily.sans],
        secondary: ['Saira Condensed', ...defaultTheme.fontFamily.sans],
        tertiary: ['Teko', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        'inset-black-6': 'inset 0 0 0 100vw rgba(0,0,0,0.6)',
        'inset-black-7': 'inset 0 0 0 100vw rgba(0,0,0,0.7)',
      },
      height: {
        500: '500px',
      },
      width: {
        500: '500px',
      },
      screens: {
        xs: '400px',
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant('div-children', '& > div')
      addVariant('th-child', '& > th')
    }),
  ],
}
