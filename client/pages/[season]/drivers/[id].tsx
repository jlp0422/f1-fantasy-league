import Layout from '@/components/Layout'
import Toggle from '@/components/Toggle'
import TickXAxis from '@/components/charts/TickXAxis'
import TickYAxis from '@/components/charts/TickYAxis'
import {
  COLORS_BY_CONSTRUCTOR,
  COLORS_BY_SEASON,
  HAS_IMAGES_BY_SEASON,
} from '@/constants/index'
import {
  getCloudinaryCarUrl,
  normalizeConstructorName,
  rgbDataURL,
} from '@/helpers/cars'
import { constructorColumns, raceColumns } from '@/helpers/supabase'
import { getIdParam, getSeasonParam, indexBy, makeName } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import { GenericObject } from '@/types/Common'
import { Driver } from '@/types/Driver'
import { DriverRaceResult } from '@/types/DriverRaceResult'
import { Race } from '@/types/Race'
import {
  ConstructorDriverWithJoins,
  DriverRaceResultWithJoins,
} from '@/types/Unions'
import hexRgb from 'hex-rgb'
import { GetServerSidePropsContext } from 'next'
import Image from 'next/image'
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

type DriverPointsByRace = Record<string, Record<string, DriverRaceResult>>
interface Props {
  driver: Driver
  raceResults: DriverRaceResultWithJoins[]
  constructor: ConstructorDriverWithJoins
  races: Race[]
  seasonPoints: Record<'finishPoints' | 'gridPoints', number>
  pointsByDriverChartData: GenericObject[]
}

const DriverPage = ({
  driver,
  raceResults,
  constructor,
  seasonPoints,
  races,
  pointsByDriverChartData,
}: Props) => {
  const [showDetail, setShowDetail] = useState<boolean>(false)
  const { query } = useRouter()
  const season = query.season as string
  const fullName = makeName(driver)
  const normalized = normalizeConstructorName(constructor.name ?? '')
  const { primary: primaryColor } = constructor.name
    ? COLORS_BY_CONSTRUCTOR[season][normalized]
    : COLORS_BY_SEASON[season]

  const stats = [
    {
      value: seasonPoints.finishPoints + seasonPoints.gridPoints,
      label: 'Total Points',
    },
    { value: constructor.name ?? 'N/A', label: 'Constructor' },
    { value: driver.number, label: 'Number' },
    { value: driver.constructor_name, label: 'Racing Team' },
  ]

  const hasImages = HAS_IMAGES_BY_SEASON[season]
  const { red, blue, green } = hexRgb(primaryColor)
  const carImageUrl = constructor.name
    ? getCloudinaryCarUrl(normalized, season, { format: 'webp' })
    : rgbDataURL(red, green, blue)

  return (
    <Layout documentTitle={fullName}>
      <div
        className='bg-cover bg-center w-screen absolute h-80 sm:h-[336px] left-0 top-[64px] sm:top-[72px] shadow-inset-black-7'
        style={{
          backgroundImage: `url(${
            hasImages ? carImageUrl : rgbDataURL(red, green, blue)
          })`,
        }}
      />
      <div className='relative flex flex-col items-center sm:flex-row'>
        <Image
          src={driver.image_url}
          alt={fullName}
          width={288}
          height={288}
          priority
          className='rounded-lg shadow-lg w-72 h-72'
        />
        <div className='mx-4 my-2 text-center sm:mx-8 sm:text-left'>
          <h2 className='font-bold tracking-normal font-primary uppercase text-gray-900 sm:text-gray-200 text-5xl sm:text-4xl md:text-5xl lg:text-6xl mt-4 lg:mt-2'>
            {fullName}
          </h2>
          <div className='grid grid-cols-2 gap-x-8 gap-y-2 mt-4'>
            {stats.map(({ value, label }) => (
              <div key={label} className='flex flex-col'>
                <h3 className='text-3xl font-bold tracking-normal font-primary uppercase text-gray-900 sm:text-gray-200 sm:text-2xl md:text-3xl'>
                  {value}
                </h3>
                <p className='text-xl leading-none tracking-wide text-gray-600 font-tertiary sm:text-gray-300'>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Toggle
        label='Detailed Points'
        checked={showDetail}
        onChange={() => setShowDetail((current) => !current)}
        className='mt-2 text-gray-900 sm:mt-10 flex items-center'
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
                  <th scope='col' className='p-3 text-left uppercase'>
                    {race.country}
                  </th>
                  {raceResult ? (
                    showDetail ? (
                      <td className='px-3 py-1 text-base font-normal text-center text-gray-100'>
                        <p className='leading-5'>
                          Finish:&nbsp;{raceResult.finish_position_points}
                        </p>
                        <p className='leading-5'>
                          Grid:&nbsp;{raceResult.grid_difference_points}
                        </p>
                      </td>
                    ) : (
                      <td className='px-3 py-1 text-base font-normal text-center text-gray-100'>
                        {raceResult.finish_position_points +
                          raceResult.grid_difference_points}
                      </td>
                    )
                  ) : (
                    <td className='px-3 py-1 text-base font-normal text-center text-gray-100'>
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

      <div className='invisible hidden sm:visible sm:block'>
        <h2 className='text-xl font-bold tracking-tight text-gray-900 font-secondary md:text-2xl lg:text-3xl'>
          Points by Race
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
              <Line
                key={fullName}
                type='monotone'
                dataKey={fullName}
                stroke={primaryColor}
                strokeWidth={5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const season = getSeasonParam(context)
  const driverId = getIdParam(context)
  const [
    { data: driver },
    { data: raceResults },
    { data: constructorDriverMatch },
    { data: races },
  ] = await Promise.all([
    supabase
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
      .eq('id', driverId)
      .limit(1)
      .returns<Driver>()
      .single(),
    supabase
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
      .eq('race.season.year', season)
      .eq('driver_id', driverId)
      .order('start_date', { ascending: true, foreignTable: 'race' })
      .returns<DriverRaceResultWithJoins[]>(),
    supabase
      .from('constructor_driver')
      .select(
        `
      id,
      driver_one_id,
      driver_two_id,
      constructor!inner(${constructorColumns}),
      season!inner(year)`
      )
      .eq('season.year', season)
      .or(`driver_one_id.eq.${driverId},driver_two_id.eq.${driverId}`)
      .limit(1)
      .returns<ConstructorDriverWithJoins>()
      .single(),
    supabase
      .from('race')
      .select(raceColumns)
      .eq('season.year', season)
      .order('start_date', { ascending: true })
      .returns<Race[]>(),
  ])

  const racesById = indexBy('id')(races!)

  const seasonPoints = raceResults!.reduce(
    (memo, result) => {
      memo.finishPoints += result.finish_position_points
      memo.gridPoints += result.grid_difference_points
      return memo
    },
    { finishPoints: 0, gridPoints: 0 }
  )

  const driverPointsByRace = raceResults!.reduce(
    (memo: DriverPointsByRace, item: DriverRaceResultWithJoins) => {
      const driverName = makeName(driver!)
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

  return {
    props: {
      driver,
      raceResults,
      seasonPoints,
      races,
      constructor: constructorDriverMatch?.['constructor'] ?? {},
      pointsByDriverChartData,
    },
  }
}

export default DriverPage
