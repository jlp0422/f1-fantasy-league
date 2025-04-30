import { normalizeConstructorName } from '@/helpers/cars'
import { makeName } from '@/helpers/utils'
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
    const { data: constructorDriverResp } = await supabase
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

    if (!constructorDriverResp) {
      return createResponse(400, 'Constructor does not exist')
    }

    const constructorDriver =
      constructorDriverResp as ConstructorDriverWithJoins

    const { data: oldDriver } = await supabase
      .from('driver')
      .select(
        `
        id,
        first_name,
        last_name,
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
      constructorDriver.driver_one_id !== (oldDriver as Driver).id &&
      constructorDriver.driver_two_id !== (oldDriver as Driver).id
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
        first_name,
        last_name,
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
      constructorDriver.driver_one_id === +old_driver_id
        ? 'driver_one_id'
        : 'driver_two_id'

    const { error } = await supabase
      .from('constructor_driver')
      .update({ [driverKey]: +new_driver_id })
      .eq('id', constructorDriver.id)

    if (error) {
      throw new Error(error as any)
    }

    return res.status(201).json({
      success: true,
      message: `Success! ${makeName(oldDriver)} was replaced with ${makeName(
        newDriver
      )}`,
      statusCode: 201,
    })
  } catch (err) {
    console.error('** error', err)
    return createResponse(500, 'Error trying to swap drivers')
  }
}
