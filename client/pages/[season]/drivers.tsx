import Driver from '@/components/Driver'
import { indexBy } from '@/helpers/utils'

import { Constructor } from '@/types/Constructor'
import { Driver as DriverType } from '@/types/Driver'
import { Season } from '@/types/Season'
import {
  ConstructorDriverWithJoins,
  DriverRaceResultWithRaceAndSeason,
  RaceWithSeason,
} from '@/types/Unions'
import Layout from 'components/Layout'
import { supabase } from 'lib/database'
import { GetStaticPropsContext } from 'next'

type CustomDriver = DriverType & { full_name: string; constructor: Constructor }

interface Props {
  drivers: CustomDriver[]
  resultsByDriverId: Record<string, DriverRaceResultWithRaceAndSeason[]>
  // resultsByRaceId: any
  races: RaceWithSeason[]
  raceResults: any
  driverRaceResults: any
}

const DriversPage = ({ drivers, resultsByDriverId, races, driverRaceResults }: Props) => {
  // console.log({ drivers, resultsByDriverId, races, driverRaceResults })
  if (!drivers) {
    return null
  }
  return (
    <Layout documentTitle="Drivers" fullWidth>
      <div className="relative mx-2 mb-4 overflow-x-auto rounded-lg sm:mx-4">
        {/* <div className="flex flex-col">
        <div className='flex'>
        {races.map(race => (
          <p key={race.id}>{race.country}</p>
        ))}
        </div>
        {drivers.slice(0, 1).map((driver) => {
          return (
            <Driver
              key={driver.id}
              driver={driver}
              results={resultsByDriverId[driver.id]}
            />
          )
        })}
      </div> */}
        <table className="w-full text-base text-left text-gray-300 uppercase bg-gray-800 font-secondary">
          <thead className="bg-gray-700 whitespace-nowrap">
            <tr>
              <th
                key="Constructor"
                scope="col"
                className="px-6 py-3 sticky invisible hidden sm:table-cell sm:visible sm:w-[310px] sm:min-w-[310px] sm:max-w-[310px] left-0 bg-gray-700"
              >
                Driver
              </th>
              <th
                scope="col"
                className="px-6 py-3 visible table-cell sticky left-0 w-[88px] min-w-[88px] max-w-[88px] bg-gray-700 sm:invisible sm:hidden"
              >
                &nbsp;
              </th>
              {races.map((race) => (
                <th
                  key={race.id}
                  scope="col"
                  className="px-6 py-3 font-normal text-center"
                >
                  {race.country}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {driverRaceResults.map((result: any) => {
          return (
            <tr
              key={result.driver.id}
              className="text-lg bg-gray-800 border-b border-gray-700 th-child:odd:bg-gray-800 th-child:even:bg-gray-700 sm:hover:bg-gray-600 th-child:sm:hover:bg-gray-600 odd:bg-gray-800 even:bg-gray-700"
            >
              <th
                scope="row"
                className="sticky w-[88px] min-w-[88px] max-w-[88px] sm:w-[310px] sm:min-w-[310px] sm:max-w-[310px] left-0 "
              >
                <div className="flex items-center justify-center gap-3 px-2 py-3 font-semibold text-gray-100 sm:justify-start sm:px-6 sm:py-4 whitespace-nowrap">
                {result.driver.full_name}
                </div>
              </th>
              {/* <td className="px-6 py-4 text-center ">
                {constructorsById[constructor.id].total_points}
              </td> */}
              {result.raceResults.map((raceResult: any) => (
                <td
                  className="px-6 py-4 text-center"
                  key={raceResult?.id}
                >
                  {raceResult?.grid_difference_points + raceResult?.finish_position_points}
                </td>
              ))}
            </tr>
          )
        })}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

export async function getStaticPaths() {
  const { data } = (await supabase.from('season').select('*')) as {
    data: Season[]
  }

  return {
    paths: data.map((season) => ({
      params: {
        season: season.year.toString(),
      },
    })),
    fallback: false,
  }
}

const makeName = (driver: DriverType) =>
  `${driver.first_name} ${driver.last_name}`

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const driverCols =
    'id, abbreviation, first_name, last_name, number, image_url'
  const { data: constructorDrivers } = (await supabase
    .from('constructor_driver')
    .select(
      `id,
      constructor(id, name),
      driver_one:driver_one_id(${driverCols}),
      driver_two:driver_two_id(${driverCols}),
      season!inner(year)`
    )
    .eq('season.year', params?.season)) as {
    data: ConstructorDriverWithJoins[]
  }

  const { data: races } = (await supabase
    .from('race')
    .select('id, location, country, start_date, season!inner(year)')
    .eq('season.year', params?.season)
    .order('start_date', { ascending: true })) as { data: RaceWithSeason[] }

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
        start_date,
        season!inner(
          id,
          year
        )
      ),
      driver_id
    `
    )
    .eq('race.season.year', params?.season)
    .order('start_date', { ascending: true, foreignTable: 'race' })) as {
    data: DriverRaceResultWithRaceAndSeason[]
  }

  const resultsByDriverId = raceResults?.reduce((memo: any, result) => {
    const driverId = result.driver_id.toString()
    const raceId = result.race.id.toString()
    if (memo[driverId]) {
      memo[driverId][raceId] = result
    } else {
      memo[driverId] = { [raceId]: result }
    }
    return memo
  }, {})

  const drivers = constructorDrivers.reduce(
    (memo: CustomDriver[], { driver_one, driver_two, constructor }) => {
      return memo.concat([
        {
          ...driver_one,
          full_name: makeName(driver_one),
          constructor: constructor,
        },
        {
          ...driver_two,
          full_name: makeName(driver_two),
          constructor: constructor,
        },
      ])
    },
    []
  )

  const driverRaceResults = drivers.map(driver => {
    const result = { driver, raceResults: [] } as Record<string, any>
    races.forEach(race => {
      const driverResult = resultsByDriverId[driver.id][race.id] || null
      result.raceResults.push(driverResult)
    })
    return result
  })

  return {
    props: {
      drivers,
      races,
      driverRaceResults,
      resultsByDriverId,
      // resultsByRaceId,
      raceResults,
    },
  }
}

export default DriversPage
