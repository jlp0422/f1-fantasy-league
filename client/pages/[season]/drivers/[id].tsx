import Layout from '@/components/Layout'
import Toggle from '@/components/Toggle'
import { constructorColumns, raceColumns } from '@/helpers/supabase'
import { makeName } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import { Driver } from '@/types/Driver'
import { Race } from '@/types/Race'
import {
  ConstructorDriverWithJoins,
  DriverRaceResultWithJoins,
} from '@/types/Unions'
import { GetStaticPropsContext } from 'next'
import { useState } from 'react'

interface Props {
  driver: Driver
  raceResults: DriverRaceResultWithJoins[]
  constructor: ConstructorDriverWithJoins[]
  races: Race[]
  seasonPoints: Record<'finishPoints' | 'gridPoints', number>
}

const DriverPage = ({
  driver,
  raceResults,
  constructor,
  seasonPoints,
  races,
}: Props) => {
  const [showDetail, setShowDetail] = useState<boolean>(false)
  const fullName = makeName(driver)
  // console.log({ driver, raceResults, constructor, seasonPoints })
  return (
    <Layout documentTitle={fullName}>
      <Toggle
        label='Detailed Points'
        checked={showDetail}
        onChange={() => setShowDetail((current) => !current)}
        className='mt-2 sm:mt-10'
      />
      {/* mobile points table */}
      <div className='relative visible block mb-4 overflow-x-auto rounded-lg shadow-md md:hidden md:invisible'>
        <table className='w-full text-base text-left text-gray-300 bg-gray-800 font-secondary'>
          <tbody>
            {races.map((race) => {
              const raceResult = raceResults.find(
                (result) => result.race.id === race.id
              )
              return (
                <tr
                  key={race.id}
                  className='border-b border-gray-700 odd:bg-gray-800 even:bg-gray-700'
                >
                  <th
                    key={race.id}
                    scope='col'
                    className='p-3 text-left uppercase'
                  >
                    {race.country}
                  </th>
                  {raceResult ? (
                    showDetail ? (
                      <td
                        className='px-3 py-1 text-base font-normal text-center text-gray-100'
                        key={race.id}
                      >
                        <p className='leading-5'>
                          Finish:&nbsp;{raceResult.finish_position_points}
                        </p>
                        <p className='leading-5'>
                          Grid:&nbsp;{raceResult.grid_difference_points}
                        </p>
                      </td>
                    ) : (
                      <td
                        key={race.id}
                        className='px-3 py-1 text-base font-normal text-center text-gray-100'
                      >
                        {raceResult.finish_position_points +
                          raceResult.grid_difference_points}
                      </td>
                    )
                  ) : (
                    <td
                      className='px-3 py-1 text-base font-normal text-center text-gray-100'
                      key={race.id}
                    >
                      {null}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* desktop points table */}
      <div className='relative invisible hidden mt-1 mb-10 overflow-x-auto rounded-lg shadow-md md:block md:visible'>
        <table className='w-full text-base text-left text-gray-300 uppercase bg-gray-800 font-secondary'>
          <thead className='bg-gray-700 whitespace-nowrap'>
            <tr>
              {races.map((race) => (
                <th
                  key={race.id}
                  scope='col'
                  className='px-6 py-3 font-normal text-center'
                >
                  {race.country}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className='text-lg font-semibold text-gray-100 border-b border-gray-700 bg-gray-50 hover:bg-gray-600 odd:bg-gray-800 even:bg-gray-700 th-child:odd:bg-gray-800 th-child:even:bg-gray-700 th-child:hover:bg-gray-600'>
              {races.map((race) => {
                const raceResult = raceResults.find(
                  (result) => result.race.id === race.id
                )
                if (raceResult) {
                  if (showDetail) {
                    return (
                      <td
                        className='px-4 py-2 text-base font-normal text-center'
                        key={race.id}
                      >
                        <p className='leading-5'>
                          Finish:&nbsp;{raceResult.finish_position_points}
                        </p>
                        <p className='leading-5'>
                          Grid:&nbsp;{raceResult.grid_difference_points}
                        </p>
                      </td>
                    )
                  }

                  return (
                    <td className='px-6 py-4 text-center' key={race.id}>
                      {raceResult.finish_position_points +
                        raceResult.grid_difference_points}
                    </td>
                  )
                }

                return (
                  <td className='px-6 py-4 text-center' key={race.id}>
                    {null}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

export async function getStaticPaths() {
  const { data: drivers } = (await supabase
    .from('driver')
    .select('id, season!inner(id, year)')) as { data: any[] }

  return {
    paths: drivers.map((driver) => ({
      params: {
        id: driver.id.toString(),
        season: driver.season.year.toString(),
      },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const { data: driver } = await supabase
    .from('driver')
    .select(
      `
      id,
      first_name,
      last_name,
      number,
      abbreviation,
      constructor_name,
      image_url
    `
    )
    .eq('id', params?.id)
    .limit(1)
    .single()

  const { data: raceResults } = (await supabase
    .from('driver_race_result')
    .select(
      `
    id,
    finish_position_points,
    grid_difference_points,
    race!inner(
      id,
      name,
      location,
      country,
      start_date,
      season!inner(
        id,
        year
      )
    )
  `
    )
    .eq('race.season.year', params?.season)
    .eq('driver_id', params?.id)
    .order('start_date', { ascending: true, foreignTable: 'race' })) as {
    data: DriverRaceResultWithJoins[]
  }

  const { data: driverOneMatch } = (await supabase
    .from('constructor_driver')
    .select(
      `
      id,
      driver_one_id,
      driver_two_id,
      constructor!inner(${constructorColumns}),
      season!inner(year)`
    )
    .eq('season.year', params?.season)
    .eq('driver_one_id', params?.id)
    .limit(1)
    .single()) as {
    data: ConstructorDriverWithJoins
  }
  const { data: driverTwoMatch } = (await supabase
    .from('constructor_driver')
    .select(
      `
      id,
      driver_one_id,
      driver_two_id,
      constructor!inner(${constructorColumns}),
      season!inner(year)`
    )
    .eq('season.year', params?.season)
    .eq('driver_two_id', params?.id)
    .limit(1)
    .single()) as {
    data: ConstructorDriverWithJoins
  }

  const { data: races } = (await supabase
    .from('race')
    .select(raceColumns)
    .eq('season.year', params?.season)
    .order('start_date', { ascending: true })) as { data: Race[] }

  const seasonPoints = raceResults.reduce(
    (memo, result) => {
      memo.finishPoints += result.finish_position_points
      memo.gridPoints += result.grid_difference_points
      return memo
    },
    { finishPoints: 0, gridPoints: 0 }
  )

  return {
    props: {
      driver,
      raceResults,
      seasonPoints,
      races,
      constructor: (driverOneMatch ?? driverTwoMatch).constructor,
    },
  }
}

export default DriverPage
