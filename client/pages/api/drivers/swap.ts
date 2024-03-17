import { supabase } from '@/lib/database'
import type { NextApiRequest, NextApiResponse } from 'next'

interface Data {
  success?: boolean
  message?: string
  data?: any
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Check for valid API key -- CREATE IT FIRST
  // if (req.query.secret !== process.env.REVALIDATE_TOKEN) {
  //   return res.status(401).json({ message: 'Invalid token' })
  // }

  const { season, constructor_id, old_driver_id, new_driver_id } = req.query

  if (!season || !constructor_id || !old_driver_id || !new_driver_id) {
    return res
      .status(405)
      .json({ success: false, message: 'Invalid parameters' })
  }

  try {
    const { data: constructor } = await supabase
      .from('constructor_driver')
      .select(
        `
        id,
        constructor!inner(
          id,
          name
        ),
        driver_one_id,
        driver_two_id,
        season!inner(year)
      `
      )
      .eq('constructor_id', constructor_id)
      .eq('season.year', season)
      .limit(1)
      .single()

    if (!constructor)
      return res
        .status(405)
        .json({ success: false, message: 'Constructor does not exist' })

    const { data: oldDriver } = await supabase
      .from('driver')
      .select(
        `
        id,
        abbreviation,
        season!inner(year)
      `
      )
      .eq('id', old_driver_id)
      .eq('season.year', season)
      .limit(1)
      .single()

    if (!oldDriver)
      return res
        .status(405)
        .json({ success: false, message: 'Old Driver does not exist' })

    if (
      constructor.driver_one_id !== oldDriver.id &&
      constructor.driver_two_id !== oldDriver.id
    )
      return res.status(405).json({
        success: false,
        message: 'Old Driver is not assigned to the selected Constructor',
      })

    const { data: newDriver } = await supabase
      .from('driver')
      .select(
        `
        id,
        abbreviation,
        season!inner(year)
      `
      )
      .eq('id', new_driver_id)
      .eq('season.year', season)
      .limit(1)
      .single()

    if (!newDriver)
      return res
        .status(405)
        .json({ success: false, message: 'New Driver does not exist' })

    const { data: driverOneMatch } = await supabase
      .from('constructor_driver')
      .select(
        `
        id,
        driver_one_id,
        season!inner(year)`
      )
      .eq('season.year', season)
      .eq('driver_one_id', new_driver_id)
      .limit(1)
      .single()

    const { data: driverTwoMatch } = await supabase
      .from('constructor_driver')
      .select(
        `
        id,
        driver_two_id,
        season!inner(year)`
      )
      .eq('season.year', season)
      .eq('driver_two_id', new_driver_id)
      .limit(1)
      .single()

    if (driverOneMatch || driverTwoMatch)
      return res.status(405).json({
        success: false,
        message: `New Driver is already assigned to a constructor`,
      })

    return res.status(200).json({
      success: true,
      data: {
        constructor,
        oldDriver,
        newDriver,
        driverOneMatch,
        driverTwoMatch,
      },
    })
  } catch (err) {
    console.error('** error', err)
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).send({ message: 'Error revalidating' })
  }
}
