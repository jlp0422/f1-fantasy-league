import { sortArray } from '@/helpers/utils'

import { Driver as DriverType } from '@/types/Driver'
import { DriverRaceResult } from '@/types/DriverRaceResult'
import { Season } from '@/types/Season'
import { DriverRaceResultWithJoins, RaceWithSeason } from '@/types/Unions'
import Layout from 'components/Layout'
import { supabase } from 'lib/database'
import { GetStaticPropsContext } from 'next'
import Image from 'next/image'

type CustomDriver = DriverType & { full_name: string }
type DriverResult = { driver: CustomDriver } & {
  raceResults: (DriverRaceResult & { didNotRace?: boolean })[]
}

interface Props {
  drivers: CustomDriver[]
  races: RaceWithSeason[]
  driverRaceResults: DriverResult[]
}

const DriversPage = ({ drivers, races, driverRaceResults }: Props) => {
  if (!drivers) {
    return null
  }
  return (
    <Layout documentTitle="Drivers" fullWidth>
      <div className="relative mx-2 my-4 overflow-x-auto rounded-lg sm:mx-4">
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
            {driverRaceResults.map((result) => {
              return (
                <tr
                  key={result.driver.id}
                  className="text-lg bg-gray-800 border-b border-gray-700 th-child:odd:bg-gray-800 th-child:even:bg-gray-700 sm:hover:bg-gray-600 th-child:sm:hover:bg-gray-600 odd:bg-gray-800 even:bg-gray-700"
                >
                  <th
                    scope="row"
                    className="sticky w-[150px] min-w-[150px] max-w-[150px] sm:w-[310px] sm:min-w-[310px] sm:max-w-[310px] left-0 flex items-center"
                  >
                    <div className="invisible hidden sm:visible sm:block sm:h-[75px] sm:w-[75px]">
                      <Image
                        width={75}
                        height={75}
                        src={result.driver.image_url}
                        alt={result.driver.full_name}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-3 px-4 py-4 font-semibold text-left text-gray-100 sm:justify-start sm:px-6 sm:py-4 whitespace-nowrap sm:text-center">
                      {result.driver.full_name}
                    </div>
                  </th>
                  {result.raceResults.map((raceResult, index) => {
                    if (raceResult.didNotRace) {
                      return (
                        <td className="px-6 py-4 text-center" key={index}>
                          N/A
                        </td>
                      )
                    }
                    const totalPoints =
                      raceResult?.grid_difference_points +
                      raceResult?.finish_position_points
                    return (
                      <td className="px-6 py-4 text-center" key={index}>
                        {totalPoints}
                      </td>
                    )
                  })}
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

// make util function
const makeName = (driver: DriverType) =>
  `${driver.first_name} ${driver.last_name}`

export async function getStaticProps({ params }: GetStaticPropsContext) {
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
      driver(
        id,
        abbreviation,
        first_name,
        last_name,
        number,
        image_url
      )
    `
    )
    .eq('race.season.year', params?.season)
    .order('start_date', { ascending: true, foreignTable: 'race' })) as {
    data: DriverRaceResultWithJoins[]
  }

  const resultsByDriverId = raceResults?.reduce((memo: any, result) => {
    const driverId = result.driver.id.toString()
    const raceId = result.race.id.toString()
    if (memo[driverId]) {
      memo[driverId][raceId] = result
    } else {
      memo[driverId] = { [raceId]: result }
    }
    return memo
  }, {})

  const uniqueDriversById = raceResults
    .map((result) => result.driver)
    .reduce((memo: Record<string, DriverType>, driver) => {
      if (!memo[driver.id]) {
        memo[driver.id] = driver
      }
      return memo
    }, {})

  const drivers = Object.values(uniqueDriversById).reduce(
    (memo: CustomDriver[], driver) => {
      return memo.concat([
        {
          ...driver,
          full_name: makeName(driver),
        },
      ])
    },
    []
  )

  const sortedDrivers = sortArray(
    drivers,
    (a: CustomDriver, b: CustomDriver) => {
      if (a.last_name > b.last_name) {
        return 1
      }
      return -1
    }
  )

  const driverRaceResults = sortedDrivers.map((driver) => {
    const result = { driver, raceResults: [] } as DriverResult
    races.forEach((race) => {
      const driverResult = resultsByDriverId[driver.id][race.id] || {
        didNotRace: true,
      }
      result.raceResults.push(driverResult)
    })
    return result
  })

  return {
    props: {
      drivers: sortedDrivers,
      races,
      driverRaceResults,
    },
  }
}

export default DriversPage
