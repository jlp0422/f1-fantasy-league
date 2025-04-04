const { withAxiom } = require('next-axiom')

module.exports = withAxiom({
  images: {
    domains: [
      'res.cloudinary.com',
      'media.api-sports.io',
      'media-1.api-sports.io',
      'media-2.api-sports.io',
      'media.formula1.com',
    ],
  },
  async redirects() {
    return [
      {
        source: '/:season(\\d{1,})',
        destination: '/:season/standings',
        permanent: true,
      },
    ]
  },
})
