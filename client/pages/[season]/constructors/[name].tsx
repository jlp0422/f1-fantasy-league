import CarImage from '@/components/CarImage'
import TickXAxis from '@/components/charts/TickXAxis'
import TickYAxis from '@/components/charts/TickYAxis'
import Layout from '@/components/Layout'
import { COLORS_BY_CONSTRUCTOR } from '@/constants/index'
import { getCloudinaryCarUrl, normalizeConstructorName } from '@/helpers/cars'
import {
  constructorColumns,
  driverRaceResultColumns,
  raceColumns,
} from '@/helpers/supabase'
import { indexBy, makeName, sum } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import { GenericObject } from '@/types/Common'
import { DriverRaceResult } from '@/types/DriverRaceResult'
import { Race } from '@/types/Race'
import {
  ConstructorDriverWithJoins,
  ConstructorWithSeason,
  DriverRaceResultWithJoins,
  RaceWithSeason,
} from '@/types/Unions'
import { GetStaticPropsContext } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface DriverPoints {
  completedRaceIds: number[]
  total: number
}

type DriverPointsByRace = Record<string, Record<string, DriverRaceResult>>

interface Props {
  races: RaceWithSeason[]
  constructor: ConstructorWithSeason
  totalPoints: number
  driverPointsByRace: DriverPointsByRace
  driversWithPoints: string[]
  currentDriverNames: string[]
  racePointsByDriver: Record<string, DriverPoints>
  pointsByDriverChartData: GenericObject[]
  chartsEnabled: boolean
}

const Constructor = ({
  races,
  constructor,
  totalPoints,
  driverPointsByRace,
  driversWithPoints,
  racePointsByDriver,
  pointsByDriverChartData,
  currentDriverNames,
  chartsEnabled,
}: Props) => {
  const { query } = useRouter()
  const season = query.season as string
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const data = [
    {
      value: constructor.name,
      label: 'Constructor',
    },
    {
      value: constructor.team_principal,
      label: 'Team Principal',
    },
    {
      value: totalPoints,
      label: 'Total Points',
    },
  ]

  const normalized = normalizeConstructorName(constructor.name)
  const {
    primary: primaryColor,
    secondary: secondaryColor,
    tertiary: tertiaryColor,
  } = COLORS_BY_CONSTRUCTOR[season][normalized]

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <Layout
      documentTitle={constructor.name}
      description={`Constructor information for ${constructor.name}`}
      metaImageUrl={getCloudinaryCarUrl(normalized, season)}
    >
      <div
        className='bg-cover bg-center w-screen absolute h-80 sm:h-[336px] left-0 top-[64px] sm:top-[72px] shadow-inset-black-7'
        style={{
          backgroundImage: `url(${getCloudinaryCarUrl(normalized, season, {
            format: 'webp',
          })})`,
        }}
      />
      <div className='relative flex flex-col items-center sm:flex-row'>
        <CarImage constructorName={normalized} size='large' />
        <div className='mx-4 my-2 text-center sm:mx-8 sm:text-left'>
          {data.map(({ value, label }, index) => {
            const fontSizeClass =
              index > 0 ? 'text-4xl lg:text-5xl' : 'text-5xl lg:text-6xl'
            return (
              <div key={label} className='flex flex-col mt-4 lg:mt-2'>
                <h2
                  className={`font-bold tracking-normal font-primary uppercase sm:text-gray-200 marker:text-gray-900 ${fontSizeClass}`}
                >
                  {value}
                </h2>
                <p className='text-2xl leading-none tracking-wide text-gray-600 font-tertiary sm:text-gray-300'>
                  {label}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* mobile points table */}
      <div className='relative visible block my-4 overflow-x-auto rounded-lg shadow-md md:hidden md:invisible'>
        <table className='w-full text-base text-left text-gray-300 bg-gray-800 font-secondary'>
          <thead className='uppercase bg-gray-700'>
            <tr>
              <th scope='col' className='p-3'>
                &nbsp;
              </th>
              {driversWithPoints.map((driver) => {
                const isCurrentDriver = currentDriverNames.includes(driver)
                return (
                  <th
                    key={driver}
                    scope='col'
                    className='p-3 text-center text-gray-100'
                  >
                    {driver}
                    {isCurrentDriver ? '*' : null}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <tr className='border-b border-gray-700 odd:bg-gray-800 even:bg-gray-700'>
              <th scope='col' className='p-3 text-left'>
                Total Points
              </th>
              {driversWithPoints.map((driver) => (
                <td className='p-3 text-center text-gray-100' key={driver}>
                  {racePointsByDriver[driver].total}
                </td>
              ))}
            </tr>
            {races.map((race) => (
              <tr
                key={race.id}
                className='border-b border-gray-700 odd:bg-gray-800 even:bg-gray-700'
              >
                <th key={race.id} scope='col' className='p-3 text-left'>
                  {race.country}
                </th>
                {driversWithPoints.map((driver) => {
                  const { completedRaceIds } = racePointsByDriver[driver]
                  if (completedRaceIds.includes(race.id)) {
                    const points = driverPointsByRace[race.id][driver]
                    return (
                      <td
                        key={`${driver}-${race.id}`}
                        className='p-3 text-center text-gray-100'
                      >
                        {points.finish_position_points +
                          points.grid_difference_points}
                      </td>
                    )
                  }

                  return (
                    <td
                      className='p-3 text-center text-gray-100'
                      key={`${driver}-${race.id}`}
                    >
                      {null}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* desktop points table */}
      <div className='relative invisible hidden my-10 overflow-x-auto rounded-lg shadow-md md:block md:visible'>
        <table className='w-full text-base text-left text-gray-300 uppercase bg-gray-800 font-secondary'>
          <thead className='bg-gray-700 whitespace-nowrap'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 font-normal sticky w-44 min-w-[176px] max-w-[176px] left-0 bg-gray-700'
              >
                Driver
              </th>
              <th scope='col' className='px-6 py-3 font-normal text-center'>
                Total Points
              </th>
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
            {driversWithPoints.map((driver) => {
              const isCurrentDriver = currentDriverNames.includes(driver)
              const { completedRaceIds, total } = racePointsByDriver[driver]
              return (
                <tr
                  key={driver}
                  className='text-base font-semibold text-gray-100 border-b border-gray-700 bg-gray-50 hover:bg-gray-600 odd:bg-gray-800 even:bg-gray-700 th-child:odd:bg-gray-800 th-child:even:bg-gray-700 th-child:hover:bg-gray-600'
                >
                  <th
                    scope='row'
                    className='px-6 py-4 whitespace-nowrap sticky w-44 min-w-[176px] max-w-[176px] left-0 '
                  >
                    {driver}
                    {isCurrentDriver ? '*' : null}
                  </th>
                  <td className='px-6 py-4 text-center'>{total}</td>
                  {races.map((race) => {
                    if (completedRaceIds.includes(race.id)) {
                      const points = driverPointsByRace[race.id][driver]
                      const tooltipString = `Finish Pts: ${points.finish_position_points}, Grid Pts: ${points.grid_difference_points}`
                      return (
                        <td
                          className='px-6 py-4 text-center'
                          key={`${driver}-${race.id}`}
                        >
                          <a
                            data-tooltip-id='driver-points-tooltips'
                            data-tooltip-content={tooltipString}
                          >
                            {points.finish_position_points +
                              points.grid_difference_points}
                          </a>
                        </td>
                      )
                    }

                    return (
                      <td
                        className='px-6 py-4 text-center'
                        key={`${driver}-${race.id}`}
                      >
                        {null}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        {isMounted && (
          <ReactTooltip
            id='driver-points-tooltips'
            className='text-base font-bold font-secondary'
          />
        )}
      </div>

      {/* charts */}
      {chartsEnabled && (
        <div className='invisible hidden sm:visible sm:block'>
          <h2 className='text-xl font-bold tracking-tight text-gray-900 font-secondary md:text-2xl lg:text-3xl'>
            Driver Points by Race
          </h2>
          <div className='w-full mt-4 rounded-lg bg-slate-600 h-500'>
            <ResponsiveContainer>
              <LineChart
                data={pointsByDriverChartData}
                margin={{ top: 30, right: 30, bottom: 30, left: 10 }}
              >
                <CartesianGrid stroke='#ccc' strokeDasharray='4 4' />
                <XAxis
                  dataKey='race'
                  padding={{ left: 10, right: 0 }}
                  interval={0}
                  tick={<TickXAxis />}
                  axisLine={{ stroke: '#ccc' }}
                  tickLine={{ stroke: '#ccc' }}
                />
                <YAxis
                  domain={[-2, 22]}
                  tickCount={7}
                  tick={<TickYAxis />}
                  axisLine={{ stroke: '#ccc' }}
                  tickLine={{ stroke: '#ccc' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#475569',
                    color: '#fff',
                    fontFamily: 'Teko',
                    fontSize: '20px',
                  }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '50px',
                    fontFamily: 'Teko',
                    fontSize: '24px',
                  }}
                />
                {driversWithPoints.map((driver, index) => {
                  const colorIndex = index + 1
                  const mod3 = colorIndex % 3
                  const mod2 = colorIndex % 2
                  return (
                    <Line
                      key={driver}
                      type='monotone'
                      dataKey={driver}
                      stroke={
                        !mod3
                          ? tertiaryColor
                          : !mod2
                          ? secondaryColor
                          : primaryColor
                      }
                      strokeWidth={5}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Layout>
  )
}

export async function getStaticPaths() {
  const { data: constructors } = (await supabase
    .from('constructor')
    .select(constructorColumns)) as { data: ConstructorWithSeason[] }

  return {
    paths: constructors.map((constructor) => ({
      params: {
        name: encodeURIComponent(
          `${constructor.id}-${normalizeConstructorName(constructor.name)}`
        ),
        season: constructor.season.year.toString(),
      },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const constructorNameParam = decodeURIComponent(params?.name as string)
  const constructorId = constructorNameParam.split('-')[0]

  const { data: constructor } = (await supabase
    .from('constructor')
    .select(constructorColumns)
    .eq('season.year', params?.season)
    .eq('id', constructorId)
    .limit(1)
    .single()) as { data: ConstructorWithSeason }

  const { data: races } = (await supabase
    .from('race')
    .select(raceColumns)
    .eq('season.year', params?.season)
    .order('start_date', { ascending: true })) as { data: Race[] }

  const { data: currentDrivers } = (await supabase
    .from('constructor_driver')
    .select(
      `
      id,
      driver_one:driver_one_id(
        id,
        first_name,
        last_name
      ),
      driver_two:driver_two_id(
        id,
        first_name,
        last_name
      ),
      season!inner(year)`
    )
    .eq('season.year', params?.season)
    .eq('constructor_id', constructorId)
    .limit(1)
    .single()) as { data: ConstructorDriverWithJoins }

  const currentDriverNames = [
    makeName(currentDrivers.driver_one),
    makeName(currentDrivers.driver_two),
  ]

  const racesById = indexBy('id')(races)

  const { data: driverRaceResults } = (await supabase
    .from('driver_race_result')
    .select(driverRaceResultColumns)
    .eq('race.season.year', constructor.season.year)
    .eq('constructor_id', constructor.id)
    .order('start_date', { ascending: true, foreignTable: 'race' })) as {
    data: DriverRaceResultWithJoins[]
  }

  const racePointsByDriver = driverRaceResults.reduce(
    (memo: Record<string, DriverPoints>, item: DriverRaceResultWithJoins) => {
      const driverName = makeName(item.driver)
      const current = memo[driverName]
      const finishAndGridPoints =
        item.finish_position_points + item.grid_difference_points
      if (current) {
        memo[driverName] = {
          total: current.total + finishAndGridPoints,
          completedRaceIds: current.completedRaceIds.concat(item.race.id),
        }
      } else {
        memo[driverName] = {
          total: finishAndGridPoints,
          completedRaceIds: [item.race.id],
        }
      }
      return memo
    },
    {}
  )

  const driverPointsByRace = driverRaceResults.reduce(
    (memo: DriverPointsByRace, item: DriverRaceResultWithJoins) => {
      const driverName = makeName(item.driver)
      if (memo[item.race.id]) {
        memo[item.race.id][driverName] = item
      } else {
        memo[item.race.id] = {
          [driverName]: item,
        }
      }
      return memo
    },
    {}
  )

  const pointsByDriverChartData = Object.entries(driverPointsByRace).map(
    ([raceId, drivers]) => ({
      race: racesById[raceId].country,
      ...Object.keys(drivers).reduce(
        (memo: Record<string, number>, driverName) => {
          const driver = drivers[driverName]
          const totalPoints =
            driver.finish_position_points + driver.grid_difference_points
          return Object.assign({}, memo, {
            [driverName]: totalPoints,
          })
        },
        {}
      ),
    })
  )

  const totalPoints = sum(
    Object.keys(racePointsByDriver).map(
      (driver) => racePointsByDriver[driver].total
    )
  )

  const driversWithPoints = Object.entries(racePointsByDriver)
    .map(([driver, { total }]) => ({ driver, total }))
    .sort((a, b) => b.total - a.total)
    .map(({ driver }) => driver)

  if (!constructor) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      races,
      constructor,
      totalPoints,
      driverPointsByRace,
      driversWithPoints,
      racePointsByDriver,
      pointsByDriverChartData,
      currentDriverNames,
      chartsEnabled: process.env.CHARTS_ENABLED === 'true',
    },
  }
}

export default Constructor
