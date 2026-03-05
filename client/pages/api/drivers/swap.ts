import { makeName } from '@/helpers/utils'
import { supabase } from '@/lib/database'
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

  const { season, constructor_id, old_driver_id, new_driver_id, admin } =
    req.query

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

  if (+old_driver_id === +new_driver_id) {
    return createResponse(400, 'Old and new driver cannot be the same')
  }

  try {
    const { data: constructorDriverResp } = await supabase
      .from('constructor_driver')
      .select(
        `
        id,
        constructor_id,
        season_id,
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
    const constructorDriver =
      constructorDriverResp as unknown as ConstructorDriverWithJoins

    if (!constructorDriver) {
      return createResponse(400, 'Constructor does not exist')
    }

    const [
      { data: oldDriverResp },
      { data: newDriverResp },
      { data: existingDriverMatch },
    ] = await Promise.all([
      supabase
        .from('driver')
        .select(`id, first_name, last_name, abbreviation, season!inner(year)`)
        .eq('id', old_driver_id)
        .eq('season.year', season)
        .limit(1)
        .returns<Driver>()
        .single(),
      supabase
        .from('driver')
        .select(`id, first_name, last_name, abbreviation, season!inner(year)`)
        .eq('id', new_driver_id)
        .eq('season.year', season)
        .limit(1)
        .returns<Driver>()
        .single(),
      supabase
        .from('constructor_driver')
        .select(`id, season!inner(year)`)
        .eq('season.year', season)
        .or(
          `driver_one_id.eq.${new_driver_id},driver_two_id.eq.${new_driver_id}`
        )
        .limit(1),
    ])

    const oldDriver = oldDriverResp as unknown as Driver
    const newDriver = newDriverResp as unknown as Driver

    if (!oldDriver) {
      return createResponse(400, 'Old Driver does not exist')
    }

    if (
      constructorDriver.driver_one_id !== oldDriver.id &&
      constructorDriver.driver_two_id !== oldDriver.id
    ) {
      return createResponse(
        400,
        'Old Driver is not assigned to the selected Constructor'
      )
    }

    if (!newDriver) {
      return createResponse(400, 'New Driver does not exist')
    }

    if (existingDriverMatch && existingDriverMatch.length > 0) {
      return createResponse(
        400,
        'New Driver is already assigned to a constructor'
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

    const { error: transactionError } = await supabase
      .from('transaction')
      .insert({
        constructor_id: constructorDriver.constructor_id,
        season_id: constructorDriver.season_id,
        current_driver_id: +old_driver_id,
        replacement_driver_id: +new_driver_id,
        transaction_type: 'WAIVER',
        is_admin: admin === 'true',
      })

    if (transactionError) {
      console.error('** transaction log error', transactionError)
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
