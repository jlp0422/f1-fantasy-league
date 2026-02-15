import Arrow from '@/components/icons/Arrow'
import Layout from '@/components/Layout'
import Toggle from '@/components/Toggle'
import { driverRaceResultColumns, raceColumns } from '@/helpers/supabase'
import { getSeasonParam, makeName, sortArray, toNum } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import { Driver as DriverType } from '@/types/Driver'
import { DriverRaceResult } from '@/types/DriverRaceResult'
import {
  ConstructorDriverWithJoins,
  DriverRaceResultWithJoins,
  RaceWithSeason,
} from '@/types/Unions'
import { GetServerSidePropsContext } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

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
  const { query } = useRouter()
  const season = query.season as string
  const [sortBy, setSortBy] = useState<string>('points')
  const [showDetail, setShowDetail] = useState<boolean>(false)
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
      <div className='mx-2 my-4 sm:mx-4'>
        <Toggle
          label='Detailed Points'
          checked={showDetail}
          onChange={() => setShowDetail((current) => !current)}
          className='mb-1 text-gray-900'
        />
        <div className='relative overflow-x-auto overflow-y-hidden rounded-lg'>
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
                        <div className='flex flex-col p-4 sm:px-6 sm:py-4'>
                          <Link
                            href={`/${season}/drivers/${seasonResult.driver.id}`}
                            className='font-semibold text-left text-gray-100 whitespace-nowrap hover:text-gray-300'
                          >
                            {seasonResult.driver.full_name}
                          </Link>
                          <h2 className='text-base font-normal leading-4 font-tertiary'>
                            {seasonResult.driver.constructor?.name}
                          </h2>
                        </div>
                      </div>
                    </th>
                    <td className='px-6 py-4 text-center'>
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

                      if (showDetail) {
                        return (
                          <td
                            className='px-4 py-2 text-base text-center'
                            key={index}
                          >
                            <p className='leading-5'>
                              Finish:&nbsp;{raceResult?.finish_position_points}
                            </p>
                            <p className='leading-5'>
                              Grid:&nbsp;{raceResult?.grid_difference_points}
                            </p>
                          </td>
                        )
                      }
                      const totalPoints =
                        raceResult?.grid_difference_points +
                        raceResult?.finish_position_points
                      return (
                        <td className='px-6 py-4 text-center' key={index}>
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
      </div>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const season = getSeasonParam(context)
  const { data: races } = await supabase
    .from('race')
    .select(raceColumns)
    .eq('season.year', season)
    .order('start_date', { ascending: true })
    .returns<RaceWithSeason[]>()

  const { data: raceResults } = await supabase
    .from('driver_race_result')
    .select(driverRaceResultColumns)
    .eq('race.season.year', season)
    .order('start_date', { ascending: true, foreignTable: 'race' })
    .returns<DriverRaceResultWithJoins[]>()

  const { data: currentDrivers } = await supabase
    .from('constructor_driver')
    .select(
      `
      id,
      driver_one_id,
      driver_two_id,
      constructor(
        id,
        name
      ),
      season!inner(year)`
    )
    .eq('season.year', season)
    .returns<ConstructorDriverWithJoins[]>()

  const constructorByDriverId = currentDrivers!.reduce(
    (memo: Record<any, any>, d) => {
      memo[d.driver_one_id] = d.constructor
      memo[d.driver_two_id] = d.constructor
      return memo
    },
    {}
  )

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

  const uniqueDriversById = raceResults!
    .map((result) => ({
      ...result.driver,
      constructor: constructorByDriverId[result.driver.id] ?? {},
    }))
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
    races!.forEach((race) => {
      const driverResult: DriverRaceResultWithJoins & NoRaceResult =
        resultsByDriverId![driver.id][race.id] || {
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
