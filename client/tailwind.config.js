const plugin = require('tailwindcss/plugin')

module.exports = {
  darkMode: 'class',
  content: ['./pages/**/*.{js,ts}', './components/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        'guenthers-angels': {
          base: '#adcdef',
        },
        'look-at-this-hornergraph': {
          base: '#fbf85a',
        },
        'once-campeonatos': {
          base: '#e9ce45',
        },
        'team-auzhous': {
          base: '#e44e38',
        },
        teamnosleep: {
          base: '#fdf4c6',
        },
        'turbo-team-racing': {
          base: '#e9482b',
        },
        'winning-formula': {
          base: '#69e1d9',
        },
        'zak-brown-band': {
          base: '#dd46f1',
        },
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
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant('div-children', '& > div')
    }),
  ],
}
