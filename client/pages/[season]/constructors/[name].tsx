import CarImage from '@/components/CarImage'
import TickXAxis from '@/components/charts/TickXAxis'
import TickYAxis from '@/components/charts/TickYAxis'
import Layout from '@/components/Layout'
import Toggle from '@/components/Toggle'
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
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
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
  id: number
}

type DriverPointsByRace = Record<string, Record<string, DriverRaceResult>>
type DriversWithPoints = { name: string; id: number }

interface Props {
  races: RaceWithSeason[]
  constructor: ConstructorWithSeason
  totalPoints: number
  driverPointsByRace: DriverPointsByRace
  driversWithPoints: DriversWithPoints[]
  currentDriverNames: string[]
  racePointsByDriver: Record<string, DriverPoints>
  pointsByDriverChartData: GenericObject[]
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
}: Props) => {
  const { query } = useRouter()
  const season = query.season as string
  const [showDetail, setShowDetail] = useState<boolean>(false)
  const data = [
    {
      value: constructor.name,
      label: 'Constructor',
      classNames: 'text-5xl sm:text-4xl md:text-5xl lg:text-6xl',
    },
    {
      value: constructor.team_principal,
      label: 'Team Principal',
      classNames: 'text-4xl sm:text-3xl md:text-4xl lg:text-5xl',
    },
    {
      value: totalPoints,
      label: 'Total Points',
      classNames: 'text-4xl sm:text-3xl md:text-4xl lg:text-5xl',
    },
  ]

  const normalized = normalizeConstructorName(constructor.name)
  const {
    primary: primaryColor,
    secondary: secondaryColor,
    tertiary: tertiaryColor,
  } = COLORS_BY_CONSTRUCTOR[season][normalized]

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
          {data.map(({ value, label, classNames }) => {
            return (
              <div key={label} className='flex flex-col mt-4 lg:mt-2'>
                <h2
                  className={`font-bold tracking-normal font-primary uppercase sm:text-gray-200 marker:text-gray-900 ${classNames}`}
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

      <Toggle
        label='Detailed Points'
        checked={showDetail}
        onChange={() => setShowDetail((current) => !current)}
        className='mt-2 sm:mt-10'
      />

      {/* mobile points table */}
      <div className='relative visible block mb-4 overflow-x-auto rounded-lg shadow-md md:hidden md:invisible'>
        <table className='w-full text-base text-left text-gray-300 bg-gray-800 font-secondary'>
          <thead className='uppercase bg-gray-700'>
            <tr>
              <th scope='col' className='p-3'>
                &nbsp;
              </th>
              {driversWithPoints.map((driver) => {
                const isCurrentDriver = currentDriverNames.includes(driver.name)
                return (
                  <th
                    key={driver.name}
                    scope='col'
                    className='p-3 text-center text-gray-100'
                  >
                    <Link
                      href={`/${season}/drivers/${driver.id}`}
                      className='font-semibold text-left text-gray-100 whitespace-nowrap hover:text-gray-300'
                    >
                      {driver.name}
                    </Link>
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
                <td className='p-3 text-center text-gray-100' key={driver.name}>
                  {racePointsByDriver[driver.name].total}
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
                  const { completedRaceIds } = racePointsByDriver[driver.name]
                  if (completedRaceIds.includes(race.id)) {
                    const points = driverPointsByRace[race.id][driver.name]
                    if (showDetail) {
                      return (
                        <td
                          className='px-3 py-1 text-base font-normal text-center text-gray-100'
                          key={`${driver}-${race.id}`}
                        >
                          <p className='leading-5'>
                            Finish:&nbsp;{points.finish_position_points}
                          </p>
                          <p className='leading-5'>
                            Grid:&nbsp;{points.grid_difference_points}
                          </p>
                        </td>
                      )
                    }

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
      <div className='relative invisible hidden mt-1 mb-10 overflow-x-auto rounded-lg shadow-md md:block md:visible'>
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
              const isCurrentDriver = currentDriverNames.includes(driver.name)
              const { completedRaceIds, total } =
                racePointsByDriver[driver.name]
              return (
                <tr
                  key={driver.name}
                  className='text-lg font-semibold text-gray-100 border-b border-gray-700 bg-gray-50 hover:bg-gray-600 odd:bg-gray-800 even:bg-gray-700 th-child:odd:bg-gray-800 th-child:even:bg-gray-700 th-child:hover:bg-gray-600'
                >
                  <th
                    scope='row'
                    className='px-6 py-4 whitespace-nowrap sticky w-44 min-w-[176px] max-w-[176px] left-0 '
                  >
                    <Link
                      href={`/${season}/drivers/${driver.id}`}
                      className='font-semibold text-left text-gray-100 whitespace-nowrap hover:text-gray-300'
                    >
                      {driver.name}
                    </Link>
                    {isCurrentDriver ? '*' : null}
                  </th>
                  <td className='px-6 py-4 text-center'>{total}</td>
                  {races.map((race) => {
                    if (completedRaceIds.includes(race.id)) {
                      const points = driverPointsByRace[race.id][driver.name]

                      if (showDetail) {
                        return (
                          <td
                            className='px-4 py-2 text-base font-normal text-center'
                            key={`${driver}-${race.id}`}
                          >
                            <p className='leading-5'>
                              Finish:&nbsp;{points.finish_position_points}
                            </p>
                            <p className='leading-5'>
                              Grid:&nbsp;{points.grid_difference_points}
                            </p>
                          </td>
                        )
                      }

                      return (
                        <td
                          className='px-6 py-4 text-center'
                          key={`${driver}-${race.id}`}
                        >
                          {points.finish_position_points +
                            points.grid_difference_points}
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
      </div>

      {/* charts */}
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
                    key={driver.name}
                    type='monotone'
                    dataKey={driver.name}
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
          id: item.driver.id,
        }
      } else {
        memo[driverName] = {
          total: finishAndGridPoints,
          completedRaceIds: [item.race.id],
          id: item.driver.id,
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
    .map(([driver, { total, id }]) => ({ driver, total, driverId: id }))
    .sort((a, b) => b.total - a.total)
    .map(({ driver, driverId }) => ({ name: driver, id: driverId }))

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
    },
  }
}

export default Constructor
