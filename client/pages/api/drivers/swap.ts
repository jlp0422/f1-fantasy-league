import { supabase } from '@/lib/database'
import type { NextApiRequest, NextApiResponse } from 'next'

interface Data {
  success?: boolean
  message?: string
  data?: any
}

const responseCreator =
  (res: NextApiResponse<Data>) => (status: number, message: string) => {
    return res.status(status).json({ success: false, message })
  }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Check for valid API key -- CREATE IT FIRST
  // if (req.query.secret !== process.env.REVALIDATE_TOKEN) {
  //   return res.status(401).json({ message: 'Invalid token' })
  // }
  const createResponse = responseCreator(res)

  const { season, constructor_id, old_driver_id, new_driver_id } = req.query

  if (!season) {
    return createResponse(405, 'Invalid parameters, missing `season`')
  }
  if (!constructor_id) {
    return createResponse(405, 'Invalid parameters, missing `constructor_id`')
  }
  if (!old_driver_id) {
    return createResponse(405, 'Invalid parameters, missing `old_driver_id`')
  }
  if (!new_driver_id) {
    return createResponse(405, 'Invalid parameters, missing `new_driver_id`')
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

    if (!constructor) {
      return createResponse(405, 'Constructor does not exist')
    }

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

    if (!oldDriver) {
      return createResponse(405, 'Old Driver does not exist')
    }

    if (
      constructor.driver_one_id !== oldDriver.id &&
      constructor.driver_two_id !== oldDriver.id
    ) {
      return createResponse(
        405,
        'Old Driver is not assigned to the selected Constructor'
      )
    }

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

    if (!newDriver) {
      return createResponse(405, 'New Driver does not exist')
    }

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

    if (driverOneMatch || driverTwoMatch) {
      return createResponse(
        405,
        `New Driver is already assigned to a constructor`
      )
    }

    const driverKey =
      constructor.driver_one_id === +old_driver_id
        ? 'driver_one_id'
        : 'driver_two_id'

    // const { data, error } = await supabase
    //   .from('constructor_driver')
    //   .update({ [driverKey]: +new_driver_id })
    //   .match({ [driverKey]: +old_driver_id, constructor_id: +constructor_id })

    return res.status(200).json({
      success: true,
      data: {
        constructor,
        oldDriver,
        newDriver,
        driverOneMatch,
        driverTwoMatch,
        // data,error
      },
    })
  } catch (err) {
    console.error('** error', err)
    return createResponse(500, 'Error trying to swap drivers')
  }
}
