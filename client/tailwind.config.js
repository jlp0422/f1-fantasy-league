const plugin = require('tailwindcss/plugin')

module.exports = {
  darkMode: 'class',
  content: ['./pages/**/*.{js,ts}', './components/**/*.{js,ts}'],
  theme: {
    extend: {
      boxShadow: {
        'inset-black-6': 'inset 0 0 0 100vw rgba(0,0,0,0.6)',
        'inset-black-7': 'inset 0 0 0 100vw rgba(0,0,0,0.7)',
      },
      height: {
        '500': '500px'
      }
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant('div-children', '& > div')
    }),
  ],
}
