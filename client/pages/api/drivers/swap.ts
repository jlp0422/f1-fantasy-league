import { normalizeConstructorName } from '@/helpers/cars'
import { supabase } from '@/lib/database'
import { ConstructorDriver } from '@/types/ConstructorDriver'
import { Driver } from '@/types/Driver'
import { ConstructorDriverWithJoins } from '@/types/Unions'
import type { NextApiRequest, NextApiResponse } from 'next'

export interface Data {
  success?: boolean
  message?: string
  statusCode?: number
}

const errorResponseCreator =
  (res: NextApiResponse<Data>) => (statusCode: number, message: string) => {
    return res.status(statusCode).json({ success: false, message, statusCode })
  }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const createResponse = errorResponseCreator(res)
  if (req.method !== 'POST') {
    return createResponse(405, 'Method not allowed')
  }

  const { season, constructor_id, old_driver_id, new_driver_id } = req.query

  if (!season) {
    return createResponse(400, 'Invalid parameters, missing "season"')
  }
  if (!constructor_id) {
    return createResponse(400, 'Invalid parameters, missing "constructor_id"')
  }
  if (!old_driver_id) {
    return createResponse(400, 'Invalid parameters, missing "old_driver_id"')
  }
  if (!new_driver_id) {
    return createResponse(400, 'Invalid parameters, missing "new_driver_id"')
  }

  try {
    const { data: constructorDriver } = await supabase
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
      .returns<ConstructorDriverWithJoins>()
      .single()

    if (!constructorDriver) {
      return createResponse(400, 'Constructor does not exist')
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
      .returns<Driver>()
      .single()

    if (!oldDriver) {
      return createResponse(400, 'Old Driver does not exist')
    }

    if (
      constructorDriver['driver_one_id'] !== oldDriver['id'] &&
      constructorDriver['driver_two_id'] !== oldDriver['id']
    ) {
      return createResponse(
        400,
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
      .returns<Driver>()
      .single()

    if (!newDriver) {
      return createResponse(400, 'New Driver does not exist')
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
      .returns<ConstructorDriver>()
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
      .returns<ConstructorDriver>()
      .single()

    if (driverOneMatch || driverTwoMatch) {
      return createResponse(
        400,
        `New Driver is already assigned to a constructor`
      )
    }

    const driverKey =
      constructorDriver['driver_one_id'] === +old_driver_id
        ? 'driver_one_id'
        : 'driver_two_id'

    // neither the supabase update or the API update are working
    // the api call works in postmant though

    // const { data, error } = await supabase
    //   .from('constructor_driver')
    //   .update({ [driverKey]: +new_driver_id })
    //   .eq('id', constructorDriver["id"])
    //   .select()

    // const resp = await fetch(
    //   `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/constructor_driver?${driverKey}=eq.${old_driver_id}`,
    //   {
    //     headers: {
    //       apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    //       Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    //       'Content-Type': 'application/json',
    //     } as HeadersInit,
    //     method: 'PATCH',
    //     body: JSON.stringify({ [driverKey]: +new_driver_id }),
    //   }
    // )

    // if (!resp.ok) {
    //   throw new Error(resp.statusText)
    // }

    // const routesToRevalidate = [
    //   `/${season}/drivers`,
    //   `/${season}/drivers/${old_driver_id}`,
    //   `/${season}/drivers/${new_driver_id}`,
    //   `/${season}/swap-drivers`,
    //   `/${season}/constructors/${
    //     constructor.constructor.id
    //   }-${normalizeConstructorName(constructor.constructor.name)}`,
    // ]

    // await Promise.all(routesToRevalidate.map((route) => res.revalidate(route)))

    return res.status(201).json({
      success: true,
      message: `
      url is: constructor_driver?${driverKey}=eq.${old_driver_id}

      json is { [${driverKey}]: ${new_driver_id} }`,
      statusCode: 201,
    })
  } catch (err) {
    console.error('** error', err)
    return createResponse(500, 'Error trying to swap drivers')
  }
}
