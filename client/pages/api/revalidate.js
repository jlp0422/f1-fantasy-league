// don't forget to update for 2023
const constructorRoutes = [
  '1-turbo-team-racing',
  '5-look-at-this-hornergraph',
  '3-once-campeonatos',
  '4-guenthers-angels',
  '2-winning-formula',
  '6-zak-brown-band',
  '7-teamnosleep',
  '8-team-auzhous',
]

const routes = constructorRoutes.map(
  (constructorUrl) => `/constructors/${constructorUrl}`
)

export default async function handler(req, res) {
  // req.query.season
  // get constructors from supabase for season
  // make constructor url `[season]-[name]` or keep as [id]-[name]
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.REVALIDATE_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  try {
    await res.unstable_revalidate('/')
    await res.unstable_revalidate('/race-points')
    await Promise.all(routes.map((route) => res.unstable_revalidate(route)))
    return res.json({ revalidated: true })
  } catch (err) {
    console.error('** error', err)
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).send('Error revalidating')
  }
}
