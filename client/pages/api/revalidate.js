import { normalizeConstructorName } from 'helpers/cars'

// don't forget to update for 2023
// const constructorRoutes = [
//   '1-turbo-team-racing',
//   '5-look-at-this-hornergraph',
//   '3-once-campeonatos',
//   '4-guenthers-angels',
//   '2-winning-formula',
//   '6-zak-brown-band',
//   '7-teamnosleep',
//   '8-team-auzhous',
// ]

// const routes = constructorRoutes.map(
//   (constructorUrl) => `/constructors/${constructorUrl}`
// )

const CURRENT_SEASON = 2022

export default async function handler(req, res) {
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.REVALIDATE_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  try {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/constructor?season.year=eq.${CURRENT_SEASON}&select=id,name,season(year)`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    )
    const data = await resp.json()
    const constructorRoutes = data
      .map(({ id, name }) => `${id}-${normalizeConstructorName(name)}`)
      .map((url) => `/${CURRENT_SEASON}/constructors/${url}`)

    await res.revalidate(`/${CURRENT_SEASON}/standings`)
    await res.revalidate(`/${CURRENT_SEASON}/race-points`)
    await Promise.all(constructorRoutes.map((route) => res.revalidate(route)))
    return res.json({ revalidated: true })
  } catch (err) {
    console.error('** error', err)
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).send('Error revalidating')
  }
}
