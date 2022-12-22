import { normalizeConstructorName } from 'helpers/cars'

export default async function handler(req, res) {
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.REVALIDATE_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  try {
    const season = req.query.season
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/constructor?season.year=eq.${season}&select=id,name,season(year)`,
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
      .map((url) => `/${season}/constructors/${url}`)
    await res.revalidate(`/${season}/standings`)
    await res.revalidate(`/${season}/race-points`)
    await Promise.all(constructorRoutes.map((route) => res.revalidate(route)))
    return res.json({ revalidated: true })
  } catch (err) {
    console.error('** error', err)
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).send('Error revalidating')
  }
}
