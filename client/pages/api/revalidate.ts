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
  // should not need this endpoint anymore now that no pages are static
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.REVALIDATE_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  const season = req.query.season
  console.log('revalidating for season: ', season)
  try {
    //   const constructorResponse = await fetch(
    //     `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/constructor?season.year=eq.${season}&select=id,name,season!inner(year)`,
    //     {
    //       headers: {
    //         apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    //         Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    //       } as HeadersInit,
    //     }
    //   )

    //   const driverResponse = await fetch(
    //     `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/driver?season.year=eq.${season}&select=id,season!inner(year)`,
    //     {
    //       headers: {
    //         apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    //         Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    //       } as HeadersInit,
    //     }
    //   )

    //   const constructorData: Constructor[] = await constructorResponse.json()
    //   const driverData: Driver[] = await driverResponse.json()
    //   const constructorRoutes = constructorData
    //     .map(({ id, name }) => `${id}-${normalizeConstructorName(name)}`)
    //     .map((url) => `/${season}/constructors/${url}`)
    //   const driverRoutes = driverData.map(({ id }) => `/${season}/drivers/${id}`)

    //   console.log('revalidating /standings route...')
    //   await res.revalidate(`/${season}/standings`)

    //   console.log('revalidating /race-points route...')
    //   await res.revalidate(`/${season}/race-points`)

    //   console.log('revalidating /drivers route...')
    //   await res.revalidate(`/${season}/drivers`)

    //   console.log('revalidating /swap-drivers route...')
    //   await res.revalidate(`/${season}/swap-drivers`)

    //   console.log(
    //     'revalidating constructor routes: ',
    //     JSON.stringify(constructorRoutes)
    //   )
    //   await Promise.all(constructorRoutes.map((route) => res.revalidate(route)))

    //   console.log('revalidating driver routes: ', JSON.stringify(driverRoutes))
    //   await Promise.all(driverRoutes.map((route) => res.revalidate(route)))

    return res.status(200).json({ revalidated: true })
  } catch (err) {
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).send({ message: 'Error revalidating' })
  }
}
