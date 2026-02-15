import Layout from '@/components/Layout'
import Toggle from '@/components/Toggle'
import ConstructorLink from '@/components/ConstructorLink'
import CarNumber from '@/components/CarNumber'
import { COLORS_BY_CONSTRUCTOR } from '@/constants/index'
import { normalizeConstructorName } from '@/helpers/cars'
import {
  driverRaceResultColumns,
  raceColumns,
  constructorColumns,
} from '@/helpers/supabase'
import {
  getLocationParam,
  getSeasonParam,
  makeName,
  sortArray,
} from '@/helpers/utils'
import { supabase } from '@/lib/database'
import {
  DriverRaceResultWithJoins,
  RaceWithSeason,
  ConstructorWithSeason,
} from '@/types/Unions'
import { GetServerSidePropsContext } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

interface TeamStanding {
  constructor_id: number
  constructor_name: string
  total_points: number
  finish_position_points: number
  grid_difference_points: number
}

interface DriverStanding {
  driver_id: number
  driver_name: string
  constructor_id: number | null
  constructor_name: string | null
  total_points: number
  finish_position_points: number
  grid_difference_points: number
}

interface Props {
  race: RaceWithSeason
  teamStandings: TeamStanding[]
  driverStandings: DriverStanding[]
}

const TABS = ['teams', 'drivers'] as const

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const RaceDetail = ({ race, teamStandings, driverStandings }: Props) => {
  const { query } = useRouter()
  const season = query.season as string
  const [activeTab, setActiveTab] = useState<string>('teams')
  const [showDetail, setShowDetail] = useState<boolean>(false)

  const renderTeamsTable = () => (
    <div className='relative mb-4 overflow-x-auto rounded-lg shadow-md'>
      <table className='w-full text-base text-left text-gray-300 uppercase bg-gray-800 font-secondary'>
        <thead className='bg-gray-700 whitespace-nowrap'>
          <tr>
            <th scope='col' className='px-3 py-3 font-normal sm:px-6'>
              &nbsp;
            </th>
            <th scope='col' className='px-3 py-3 font-normal sm:px-6'>
              Constructor
            </th>
            <th
              scope='col'
              className='px-3 py-3 font-normal text-center sm:px-6'
            >
              {showDetail ? 'Finish Pts' : 'Points'}
            </th>
            {showDetail && (
              <th
                scope='col'
                className='px-3 py-3 font-normal text-center sm:px-6'
              >
                Grid Pts
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {teamStandings.map((team, index) => {
            const normalized = normalizeConstructorName(team.constructor_name)
            const { numberBackground } =
              COLORS_BY_CONSTRUCTOR[season]?.[normalized] || {}
            return (
              <tr
                key={team.constructor_id}
                className='text-lg bg-gray-800 border-b border-gray-700 hover:bg-gray-600 odd:bg-gray-800 even:bg-gray-700'
              >
                <td className='px-3 py-3 text-center sm:px-6 sm:py-4'>
                  {index + 1}
                </td>
                <th scope='row' className='px-3 py-3 sm:px-6 sm:py-4'>
                  <div className='flex items-center gap-2 sm:gap-3'>
                    <ConstructorLink
                      normalizedConstructor={normalized}
                      constructorId={team.constructor_id}
                    >
                      <div
                        className='relative flex-shrink-0 w-8 h-8 p-1.5 rounded-full sm:w-14 sm:h-14 sm:p-3'
                        style={{ backgroundColor: numberBackground }}
                      >
                        <CarNumber constructorName={normalized} size='small' />
                      </div>
                    </ConstructorLink>
                    <ConstructorLink
                      normalizedConstructor={normalized}
                      constructorId={team.constructor_id}
                    >
                      <div className='text-sm hover:text-gray-300 sm:text-lg'>
                        {team.constructor_name}
                      </div>
                    </ConstructorLink>
                  </div>
                </th>
                <td className='px-3 py-3 text-center sm:px-6 sm:py-4'>
                  {showDetail ? team.finish_position_points : team.total_points}
                </td>
                {showDetail && (
                  <td className='px-3 py-3 text-center sm:px-6 sm:py-4'>
                    {team.grid_difference_points}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  const renderDriversTable = () => (
    <div className='relative mb-4 overflow-x-auto rounded-lg shadow-md'>
      <table className='w-full text-base text-left text-gray-300 uppercase bg-gray-800 font-secondary'>
        <thead className='bg-gray-700 whitespace-nowrap'>
          <tr>
            <th scope='col' className='px-3 py-3 font-normal sm:px-6'>
              &nbsp;
            </th>
            <th scope='col' className='px-3 py-3 font-normal sm:px-6'>
              Driver
            </th>
            <th
              scope='col'
              className='hidden px-6 py-3 font-normal sm:table-cell'
            >
              Team
            </th>
            <th
              scope='col'
              className='px-3 py-3 font-normal text-center sm:px-6'
            >
              {showDetail ? 'Finish Pts' : 'Points'}
            </th>
            {showDetail && (
              <th
                scope='col'
                className='px-3 py-3 font-normal text-center sm:px-6'
              >
                Grid Pts
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {driverStandings.map((driver, index) => {
            const normalized = driver.constructor_name
              ? normalizeConstructorName(driver.constructor_name)
              : null
            return (
              <tr
                key={driver.driver_id}
                className='text-lg bg-gray-800 border-b border-gray-700 hover:bg-gray-600 odd:bg-gray-800 even:bg-gray-700'
              >
                <td className='px-3 py-3 text-center sm:px-6 sm:py-4'>
                  {index + 1}
                </td>
                <th scope='row' className='px-3 py-3 sm:px-6 sm:py-4'>
                  <Link
                    href={`/${season}/drivers/${driver.driver_id}`}
                    className='text-sm font-semibold hover:text-gray-300 sm:text-lg'
                  >
                    {driver.driver_name}
                  </Link>
                  {driver.constructor_name && (
                    <div className='text-xs font-normal text-gray-500 normal-case sm:hidden'>
                      {driver.constructor_name}
                    </div>
                  )}
                </th>
                <td className='hidden px-6 py-4 sm:table-cell'>
                  {driver.constructor_name ? (
                    driver.constructor_id ? (
                      <ConstructorLink
                        normalizedConstructor={normalized!}
                        constructorId={driver.constructor_id}
                      >
                        <span className='hover:text-gray-300'>
                          {driver.constructor_name}
                        </span>
                      </ConstructorLink>
                    ) : (
                      driver.constructor_name
                    )
                  ) : (
                    <span className='text-gray-500'>No Team</span>
                  )}
                </td>
                <td className='px-3 py-3 text-center sm:px-6 sm:py-4'>
                  {showDetail
                    ? driver.finish_position_points
                    : driver.total_points}
                </td>
                {showDetail && (
                  <td className='px-3 py-3 text-center sm:px-6 sm:py-4'>
                    {driver.grid_difference_points}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <Layout
      documentTitle={`${race.name} - ${race.location}`}
      description={`Race details and standings for ${race.name}`}
    >
      {/* Race header */}
      <div
        className='w-screen absolute h-48 sm:h-80 left-0 top-[64px] sm:top-[72px]'
        style={{
          background:
            'linear-gradient(135deg, #1e3a5f 0%, #2d1b4e 50%, #4a1942 100%)',
        }}
      />

      {/* Race info overlaid on hero */}
      <div className='relative flex flex-col items-center justify-end text-center h-28 sm:h-56'>
        <h1 className='text-4xl font-bold tracking-normal text-gray-200 uppercase sm:text-6xl lg:text-7xl xl:text-8xl font-primary'>
          {race.name}
        </h1>
        <p className='mt-1 text-xl tracking-wide text-gray-300 sm:mt-2 sm:text-3xl lg:text-4xl font-tertiary'>
          {race.location}, {race.country}
        </p>
        <p className='mt-0.5 text-lg tracking-wide text-gray-400 sm:mt-1 sm:text-2xl lg:text-3xl font-tertiary'>
          {formatDate(race.start_date)}
        </p>
      </div>

      {/* Controls */}
      <div className='relative z-10 flex flex-wrap items-center gap-4 mx-2 mt-6 mb-4 sm:mx-4'>
        <div className='flex gap-2 sm:gap-4 font-tertiary'>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-lg sm:px-6 sm:py-2.5 sm:text-xl font-medium rounded-lg transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <Toggle
          label='Detailed Points'
          checked={showDetail}
          onChange={() => setShowDetail((current) => !current)}
          className='text-gray-200'
        />
      </div>

      {/* Tables */}
      <div className='relative z-10 mx-2 sm:mx-4'>
        {activeTab === 'teams' && renderTeamsTable()}
        {activeTab === 'drivers' && renderDriversTable()}
      </div>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const season = getSeasonParam(context)
  const locationParam = decodeURIComponent(getLocationParam(context))
  const raceId = locationParam.split('-')[0]

  // Fetch race, constructors, and driver results in parallel
  const [{ data: race }, { data: constructors }, { data: driverRaceResults }] =
    await Promise.all([
      supabase
        .from('race')
        .select(raceColumns)
        .eq('season.year', season)
        .eq('id', raceId)
        .returns<RaceWithSeason[]>()
        .single(),
      supabase
        .from('constructor')
        .select(constructorColumns)
        .eq('season.year', season)
        .returns<ConstructorWithSeason[]>(),
      supabase
        .from('driver_race_result')
        .select(driverRaceResultColumns)
        .eq('race.id', raceId)
        .returns<DriverRaceResultWithJoins[]>(),
    ])

  if (!race) {
    return {
      notFound: true,
    }
  }

  const constructorsById = (constructors || []).reduce((memo, constructor) => {
    memo[constructor.id] = constructor
    return memo
  }, {} as Record<number, ConstructorWithSeason>)

  // Calculate team standings
  const teamPointsMap = (driverRaceResults || []).reduce((memo, result) => {
    const constructorId = result.constructor_id
    if (!memo[constructorId]) {
      memo[constructorId] = {
        constructor_id: constructorId,
        constructor_name: constructorsById[constructorId]?.name || 'Unknown',
        total_points: 0,
        finish_position_points: 0,
        grid_difference_points: 0,
      }
    }
    memo[constructorId].total_points +=
      result.finish_position_points + result.grid_difference_points
    memo[constructorId].finish_position_points += result.finish_position_points
    memo[constructorId].grid_difference_points += result.grid_difference_points
    return memo
  }, {} as Record<number, TeamStanding>)

  const teamStandings = sortArray(
    Object.values(teamPointsMap).filter(
      (team) => constructorsById[team.constructor_id]
    ),
    (a: TeamStanding, b: TeamStanding) => b.total_points - a.total_points
  )

  // Calculate driver standings
  const driverStandings = sortArray(
    (driverRaceResults || []).map((result) => {
      const constructor = constructorsById[result.constructor_id]
      return {
        driver_id: result.driver.id,
        driver_name: makeName(result.driver),
        constructor_id: constructor ? result.constructor_id : null,
        constructor_name: constructor ? constructor.name : null,
        total_points:
          result.finish_position_points + result.grid_difference_points,
        finish_position_points: result.finish_position_points,
        grid_difference_points: result.grid_difference_points,
      }
    }),
    (a: DriverStanding, b: DriverStanding) => b.total_points - a.total_points
  )

  return {
    props: {
      race,
      teamStandings,
      driverStandings,
    },
  }
}

export default RaceDetail
