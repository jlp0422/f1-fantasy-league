import type { NextApiRequest, NextApiResponse } from 'next'
import { normalizeConstructorName } from '@/helpers/cars'
import { Constructor } from '@/types/Constructor'
import { Driver } from '@/types/Driver'

interface Data {
  revalidated?: boolean
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.REVALIDATE_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  try {
    const season = req.query.season
    const constructorResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/constructor?season.year=eq.${season}&select=id,name,season!inner(year)`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        } as HeadersInit,
      }
    )

    const driverResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/driver?season.year=eq.${season}&select=id,season!inner(year)`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        } as HeadersInit,
      }
    )

    const constructorData: Constructor[] = await constructorResponse.json()
    const driverData: Driver[] = await driverResponse.json()
    const constructorRoutes = constructorData
      .map(({ id, name }) => `${id}-${normalizeConstructorName(name)}`)
      .map((url) => `/${season}/constructors/${url}`)
    const driverRoutes = driverData.map(({ id }) => `/${season}/drivers/${id}`)

    await res.revalidate(`/${season}/standings`)
    await res.revalidate(`/${season}/race-points`)
    await res.revalidate(`/${season}/drivers`)
    await res.revalidate(`/${season}/swap-drivers`)
    await Promise.all(constructorRoutes.map((route) => res.revalidate(route)))
    await Promise.all(driverRoutes.map((route) => res.revalidate(route)))

    return res.status(200).json({ revalidated: true })
  } catch (err) {
    console.error('** error', err)
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).send({ message: 'Error revalidating' })
  }
}
