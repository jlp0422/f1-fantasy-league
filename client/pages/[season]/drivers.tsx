import { makeSeasonPaths } from '@/helpers/routes'
import { makeName, sortArray, toNum } from '@/helpers/utils'
import Arrow from '@/components/icons/Arrow'
import Layout from '@/components/Layout'
import { driverRaceResultColumns, raceColumns } from '@/helpers/supabase'
import { supabase } from '@/lib/database'
import { Driver as DriverType } from '@/types/Driver'
import { DriverRaceResult } from '@/types/DriverRaceResult'
import { Season } from '@/types/Season'
import { DriverRaceResultWithJoins, RaceWithSeason } from '@/types/Unions'
import { GetStaticPropsContext } from 'next'
import Image from 'next/image'
import { useState } from 'react'
import { Tooltip as ReactTooltip } from 'react-tooltip'

type CustomDriver = DriverType & { full_name: string }
interface DriverResult {
  driver: CustomDriver
  raceResults: (DriverRaceResult & NoRaceResult)[]
  totalPoints: number
}
interface NoRaceResult {
  didNotRace?: boolean
}
interface Props {
  races: RaceWithSeason[]
  driverRaceResults: DriverResult[]
}

const sortingFns: Record<string, any> = {
  name: (a: DriverResult, b: DriverResult) =>
    a.driver.last_name > b.driver.last_name ? 1 : -1,
  points: (a: DriverResult, b: DriverResult) => b.totalPoints - a.totalPoints,
  default: (raceIndex: string) => (a: DriverResult, b: DriverResult) => {
    const aRace = a.raceResults[toNum(raceIndex)]
    const bRace = b.raceResults[toNum(raceIndex)]
    const aTotal = aRace.finish_position_points + aRace.grid_difference_points
    const bTotal = bRace.finish_position_points + bRace.grid_difference_points
    return bTotal - aTotal
  },
}

const DriversPage = ({ races, driverRaceResults }: Props) => {
  const [sortBy, setSortBy] = useState<string>('points')
  const sortFn = sortingFns[sortBy] || sortingFns.default(sortBy)
  const sortedDriverRaceResults: DriverResult[] = sortArray(
    driverRaceResults,
    sortFn
  )

  const renderSortButton = (label: string, sortKey: string) => (
    <button
      className='flex gap-0.5 uppercase items-center'
      onClick={() => setSortBy(sortKey)}
    >
      {label}
      {sortBy === sortKey ? <Arrow /> : null}
    </button>
  )
  return (
    <Layout documentTitle='Drivers' fullWidth>
      <div className='relative mx-2 my-4 overflow-x-auto overflow-y-hidden rounded-lg sm:mx-4'>
        <table className='w-full text-base text-left text-gray-300 uppercase bg-gray-800 font-secondary'>
          <thead className='bg-gray-700 whitespace-nowrap'>
            <tr>
              <th
                key='Constructor'
                scope='col'
                className='px-6 py-3 sticky invisible hidden sm:table-cell sm:visible sm:w-[310px] sm:min-w-[310px] sm:max-w-[310px] left-0 bg-gray-700'
              >
                {renderSortButton('Driver', 'name')}
              </th>
              <th
                scope='col'
                className='px-6 py-3 visible table-cell sticky left-0 w-[88px] min-w-[88px] max-w-[88px] bg-gray-700 sm:invisible sm:hidden'
              >
                &nbsp;
              </th>
              <th
                key='Total Points'
                scope='col'
                className='px-6 py-3 font-normal text-center'
              >
                {renderSortButton('Total Points', 'points')}
              </th>
              {races.map((race, index) => (
                <th
                  key={race.id}
                  scope='col'
                  className='px-6 py-3 font-normal text-center'
                >
                  {renderSortButton(race.country, index.toString())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedDriverRaceResults.map((seasonResult) => {
              return (
                <tr
                  key={seasonResult.driver.id}
                  className='text-lg bg-gray-800 border-b border-gray-700 th-child:odd:bg-gray-800 th-child:even:bg-gray-700 sm:hover:bg-gray-600 th-child:sm:hover:bg-gray-600 odd:bg-gray-800 even:bg-gray-700'
                >
                  <th
                    scope='row'
                    className='sticky w-[150px] min-w-[150px] max-w-[150px] sm:w-[310px] sm:min-w-[310px] sm:max-w-[310px] left-0'
                  >
                    <div className='sm:flex sm:items-center'>
                      <div className='invisible hidden sm:visible sm:block sm:h-[75px] sm:w-[75px]'>
                        <Image
                          width={75}
                          height={75}
                          src={seasonResult.driver.image_url}
                          alt={seasonResult.driver.full_name}
                        />
                      </div>
                      <div className='flex items-center justify-start gap-3 px-4 py-4 font-semibold text-left text-gray-100 sm:justify-center sm:px-6 sm:py-4 whitespace-nowrap sm:text-center'>
                        {seasonResult.driver.full_name}
                      </div>
                    </div>
                  </th>
                  <td className='px-6 py-4 text-center '>
                    {seasonResult.totalPoints}
                  </td>
                  {seasonResult.raceResults.map((raceResult, index) => {
                    if (raceResult.didNotRace) {
                      return (
                        <td className='px-6 py-4 text-center' key={index}>
                          N/A
                        </td>
                      )
                    }
                    const totalPoints =
                      raceResult?.grid_difference_points +
                      raceResult?.finish_position_points
                    return (
                      <td className='px-6 py-4 text-center' key={index}>
                        <a
                          data-tooltip-id='points-tooltip'
                          data-tooltip-content={`Finish Pts: ${raceResult?.finish_position_points}, Grid Pts: ${raceResult?.grid_difference_points}`}
                        >
                          {totalPoints}
                        </a>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        <ReactTooltip
          id='points-tooltip'
          className='text-base font-bold font-secondary'
        />
      </div>
    </Layout>
  )
}

export async function getStaticPaths() {
  const { data } = (await supabase.from('season').select('*')) as {
    data: Season[]
  }

  return makeSeasonPaths(data)
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const { data: races } = (await supabase
    .from('race')
    .select(raceColumns)
    .eq('season.year', params?.season)
    .order('start_date', { ascending: true })) as { data: RaceWithSeason[] }

  const { data: raceResults } = (await supabase
    .from('driver_race_result')
    .select(driverRaceResultColumns)
    .eq('race.season.year', params?.season)
    .order('start_date', { ascending: true, foreignTable: 'race' })) as {
    data: DriverRaceResultWithJoins[]
  }

  const resultsByDriverId = raceResults?.reduce(
    (
      memo: Record<string, Record<string, DriverRaceResultWithJoins>>,
      result
    ) => {
      const driverId = result.driver.id.toString()
      const raceId = result.race.id.toString()
      if (memo[driverId]) {
        memo[driverId][raceId] = result
      } else {
        memo[driverId] = { [raceId]: result }
      }
      return memo
    },
    {}
  )

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

  const driverRaceResults = drivers.map((driver) => {
    const result = { driver, raceResults: [], totalPoints: 0 } as DriverResult
    races.forEach((race) => {
      const driverResult: DriverRaceResultWithJoins & NoRaceResult =
        resultsByDriverId[driver.id][race.id] || {
          didNotRace: true,
        }

      if (!driverResult.didNotRace) {
        result.totalPoints =
          result.totalPoints +
          driverResult.grid_difference_points +
          driverResult.finish_position_points
      }
      result.raceResults.push(driverResult)
    })
    return result
  })

  const sortedRaceResults = sortArray(
    driverRaceResults,
    (a: DriverResult, b: DriverResult) => b.totalPoints - a.totalPoints
  )

  return {
    props: {
      races,
      driverRaceResults: sortedRaceResults,
    },
  }
}

export default DriversPage
