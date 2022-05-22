import { CONSTRUCTOR_NAMES } from 'constants/index'
import { normalizeConstructorName } from 'helpers/cars'

const routes = CONSTRUCTOR_NAMES.map((constructor) =>
  encodeURIComponent(normalizeConstructorName(constructor))
).map((constructorUrl) => `/constructors/${constructorUrl}`)

export default async function handler(req, res) {
  console.log('** in the request')
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.REVALIDATE_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  try {
    console.log({ routes })
    await res.unstable_revalidate('/')
    await res.unstable_revalidate('/race-points')
    await Promise.all(routes.map((route) => res.unstable_revalidate(route)))
    return res.json({ revalidated: true })
  } catch (err) {
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).send('Error revalidating')
  }
}
