module.exports = {
  images: {
    domains: ['res.cloudinary.com'],
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
