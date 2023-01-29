module.exports = {
  images: {
    domains: [
      'res.cloudinary.com',
      'media-2.api-sports.io',
      'media.api-sports.io',
      'media-1.api-sports.io',
    ],
  },
  async redirects() {
    return [
      {
        source: '/:season',
        destination: '/:season/standings',
        permanent: true,
      },
    ]
  },
}
