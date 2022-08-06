import CarImage from 'components/CarImage'
import TickXAxis from 'components/charts/TickXAxis'
import TickYAxis from 'components/charts/TickYAxis'
import Layout from 'components/Layout'
import { COLORS_BY_CONSTRUCTOR, CONSTRUCTOR_NAMES } from 'constants/index'
import { google } from 'googleapis'
import { googleAuth } from 'helpers/auth'
import { getCloudinaryCarUrl, normalizeConstructorName } from 'helpers/cars'
import { toNum } from 'helpers/utils'
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
import { supabase } from 'lib/database'

const sheets = google.sheets('v4')

const Constructor = ({
  constructorName,
  drivers,
  racePointsByDriver,
  result,
  // totalPointsByRace,
  teamPrincipal,
  raceColumnByIndex,
  driverPointsByRace,
  pointsByDriverChartData,
  races,
  chartsEnabled,
}) => {
  console.log({
    result,
    racePointsByDriver,
    driverPointsByRace,
  })

  const data = [
    {
      value: constructorName,
      label: 'Constructor',
    },
    {
      value: teamPrincipal,
      label: 'Team Principal',
    },
    {
      // get from somewhere else
      value: racePointsByDriver.total,
      label: 'Total Points',
    },
  ]

  const constructorCarImageUrl = normalizeConstructorName(constructorName)
  const { primary: primaryColor, secondary: secondaryColor } =
    COLORS_BY_CONSTRUCTOR[constructorCarImageUrl]
  const imagePath = `/cars/${constructorCarImageUrl}.webp`

  return (
    <Layout
      documentTitle={constructorName}
      description={`Constructor information for ${constructorName}`}
      metaImageUrl={getCloudinaryCarUrl(constructorCarImageUrl)}
    >
      <div
        className="bg-cover bg-center w-screen absolute h-80 sm:h-[336px] left-0 top-[64px] sm:top-[72px] shadow-inset-black-7"
        style={{ backgroundImage: `url(${imagePath})` }}
      />
      <div className="relative flex flex-col items-center sm:flex-row">
        <CarImage constructor={constructorName} size="large" />
        <div className="mx-4 my-2 text-center sm:mx-8 sm:text-left">
          {data.map(({ value, label }, index) => {
            const fontSizeClass =
              index > 0 ? 'text-4xl lg:text-5xl' : 'text-5xl lg:text-6xl'
            return (
              <div key={label} className="flex flex-col mt-4 lg:mt-2">
                <h2
                  className={`font-bold tracking-normal font-primary uppercase sm:text-gray-200 marker:text-gray-900 ${fontSizeClass}`}
                >
                  {value}
                </h2>
                <p className="text-2xl leading-none tracking-wide text-gray-600 font-tertiary sm:text-gray-300">
                  {label}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* mobile points table */}
      {/* <div className="relative visible block my-4 overflow-x-auto rounded-lg shadow-md md:hidden md:invisible">
        <table className="w-full text-base text-left text-gray-300 bg-gray-800 font-secondary">
          <thead className="uppercase bg-gray-700">
            <tr>
              <th scope="col" className="p-3">
                &nbsp;
              </th>
              {drivers.map((driver) => (
                <th
                  key={driver}
                  scope="col"
                  className="p-3 text-center text-gray-100"
                >
                  {driver}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.values(raceColumnByIndex).map((race, index) => {
              const driverOne = drivers[0]
              const driverTwo = drivers[1]
              const driverOnePoints = racePointsByDriver[driverOne]
              const driverTwoPoints = racePointsByDriver[driverTwo]
              return (
                <tr
                  key={race}
                  className="border-b border-gray-700 odd:bg-gray-800 even:bg-gray-700"
                >
                  <th key={race} scope="col" className="p-3 text-left">
                    {race}
                  </th>
                  <td className="p-3 text-center text-gray-100">
                    {index > 0
                      ? driverOnePoints.pointsByRace[index - 1]
                      : driverOnePoints.total}
                  </td>
                  <td className="p-3 text-center text-gray-100">
                    {index > 0
                      ? driverTwoPoints.pointsByRace[index - 1]
                      : driverTwoPoints.total}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div> */}

      {/* desktop points table */}
      <div className="relative invisible hidden my-10 overflow-x-auto rounded-lg shadow-md md:block md:visible">
        <table className="w-full text-base text-left text-gray-300 uppercase bg-gray-800 font-secondary">
          <thead className="bg-gray-700 whitespace-nowrap">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 font-normal sticky w-44 min-w-[176px] max-w-[176px] left-0 bg-gray-700"
              >
                Driver
              </th>
              <th scope="col" className="px-6 py-3 font-normal text-center">
                Total Points
              </th>
              {races.map((race) => (
                <th
                  key={race.id}
                  scope="col"
                  className="px-6 py-3 font-normal text-center"
                >
                  {race.location}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(racePointsByDriver).map((driver) => {
              const { completedRaceIds, pointsByRace, total } = racePointsByDriver[driver]
              {/* // minus 1 to account for total points column
              const numExtraColumns =
                Object.keys(raceColumnByIndex).length - pointsByRace.length - 1
              const extraColumns = new Array(numExtraColumns).fill(0) */}
              return (
                <tr
                  key={driver}
                  className="text-base font-semibold text-gray-100 border-b border-gray-700 bg-gray-50 hover:bg-gray-600 odd:bg-gray-800 even:bg-gray-700 th-child:odd:bg-gray-800 th-child:even:bg-gray-700 th-child:hover:bg-gray-600"
                >
                  <th
                    scope="row"
                    className="px-6 py-4 whitespace-nowrap sticky w-44 min-w-[176px] max-w-[176px] left-0 "
                  >
                    {driver}
                  </th>
                  <td className="px-6 py-4 text-center">{total}</td>
                  {pointsByRace.map(({ raceId, points }, index) => {
                    const correspondingRace = races[index]
                    console.log('matching race!', raceId, driver)
                    return (
                    <td
                      className="px-6 py-4 text-center"
                      key={`${driver}-${points}-${index}`}
                    >
                      {correspondingRace ? points : "0"}
                    </td>
                  )})}
                  {/* {extraColumns.map((_, index) => (
                    <td
                      className="px-6 py-4 text-center"
                      key={`empty-${driver}-${index}`}
                    />
                  ))} */}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* charts */}
      {chartsEnabled && (
        <div className="invisible hidden sm:visible sm:block">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 font-secondary md:text-2xl lg:text-3xl">
            Driver Points by Race
          </h2>
          <div className="w-full mt-4 rounded-lg bg-slate-600 h-500">
            <ResponsiveContainer>
              <LineChart
                data={pointsByDriverChartData}
                margin={{ top: 30, right: 30, bottom: 30, left: 10 }}
              >
                <CartesianGrid stroke="#ccc" strokeDasharray="4 4" />
                <XAxis
                  dataKey="race"
                  padding={{ left: 10, right: 0 }}
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
                  type="monotone"
                  dataKey={drivers[0]}
                  stroke={primaryColor}
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey={drivers[1]}
                  stroke={secondaryColor}
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Layout>
  )
}

export async function getStaticPaths() {
  const { data: constructors } = await supabase
    .from('constructor')
    .select('id, name, season(year)')
    .eq('season.year', 2022)

  return {
    paths: constructors.map((constructor) => ({
      params: {
        name: encodeURIComponent(
          `${constructor.id}-${normalizeConstructorName(constructor.name)}`
        ),
      },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const constructorNameParam = decodeURIComponent(params.name)
  const constructorName = constructorNameParam.split('-').slice(1).join('-')
  google.options({ auth: googleAuth })
  const constructorId = constructorNameParam.split('-')[0]

  const { data: constructor } = await supabase
    .from('constructor')
    .select('id, name, team_principal, season(id, year)')
    .eq('season.year', 2022)
    .eq('id', constructorId)
    .limit(1)
    .single()

  const { data: rawDrivers } = await supabase
    .from('constructor_driver')
    .select(
      `id,
      driver_one:driver_one_id(id, first_name, last_name),
      driver_two:driver_two_id(id, first_name, last_name)
    `
    )
    .eq('season_id', constructor.season.id)
    .eq('constructor_id', constructor.id)

  const makeName = (driver) => `${driver.first_name} ${driver.last_name}`

  const cDrivers = rawDrivers
    .map(({ driver_one, driver_two }) => [
      makeName(driver_one),
      makeName(driver_two),
    ])
    .flat()

  const { data: races } = await supabase
    .from('race')
    .select('id, location, country, start_date, season(year)')
    .eq('season.year', 2022)
    .order('start_date', { ascending: true })

  const driverIds = rawDrivers
    .map(({ driver_one, driver_two }) => [driver_one.id, driver_two.id])
    .flat()

  const { data: result } = await supabase
    .from('driver_race_result')
    .select(
      `
      id,
      finish_position_points,
      driver(
        id,
        abbreviation,
        first_name,
        last_name
      ),
      race!inner(
        id,
        location,
        season!inner(
          id,
          year
        )
      )`
    )
    .eq('race.season.year', constructor.season.year)
    .eq('constructor_id', constructor.id)
    .order('race_id', { ascending: true })

  const racePointsByDriver2 = result.reduce((memo, item) => {
    const driverName = makeName(item.driver)
    const current = memo[driverName]
    if (current) {
      memo[driverName] = {
        total: current.total + item.finish_position_points,
        pointsByRace: current.pointsByRace.concat({ raceId: item.race.id, points: item.finish_position_points}),
        completedRaceIds: current.completedRaceIds.concat(item.race.id),
      }
    } else {
      memo[driverName] = {
        total: item.finish_position_points,
        pointsByRace: [{ raceId: item.race.id, points: item.finish_position_points}],
        completedRaceIds: [item.race.id],
      }
    }
    return memo
  }, {})

  const driverPointsByRace = result.reduce((memo, item) => {
    const driverName = `${item.driver.first_name} ${item.driver.last_name}`
    if (memo[item.race.id]) {
      memo[item.race.id][driverName] = item.finish_position_points
    } else {
      memo[item.race.id] = {
        [driverName]: item.finish_position_points,
      }
    }
    return memo
  }, {})

  const pointsByDriverChartData2 = Object.entries(driverPointsByRace).map(
    ([race, drivers]) => ({
      race,
      ...drivers,
    })
  )

  const racePointsData = await sheets.spreadsheets.get({
    ranges: ["'RACE POINTS'!A1:AA17"],
    spreadsheetId: process.env.SPREADSHEET_ID,
    includeGridData: true,
  })

  const racePoints = racePointsData.data.sheets[0].data[0].rowData.map((row) =>
    row.values.map((value) => value.formattedValue || null).filter(Boolean)
  )

  const raceColumnByIndex = racePoints
    .slice(0, 1)[0]
    .slice(3)
    .reduce(
      (memo, item, index) =>
        Object.assign({}, memo, {
          [index]: item,
        }),
      {}
    )

  const constructorRacePoints = racePoints.filter(
    (row) => normalizeConstructorName(row[0]) === constructorName
  )
  // const racePointsByDriver = constructorRacePoints.reduce((memo, item) => {
  //   const [_constructor, _principal, driver, totalPoints, ...pointsByRace] =
  //     item
  //   const driverTotalPoints = toNum(totalPoints)

  //   return Object.assign({}, memo, {
  //     [driver]: {
  //       total: driverTotalPoints,
  //       pointsByRace,
  //     },
  //     total: (memo.total || 0) + driverTotalPoints,
  //   })
  // }, {})

  // const totalPointsByRace = Object.values(racePointsByDriver)
  //   .filter((item) => item.pointsByRace)
  //   .reduce((memo, driver) => {
  //     if (!memo.length) {
  //       return driver.pointsByRace
  //     }
  //     return memo.map(
  //       (points, index) => toNum(points) + toNum(driver.pointsByRace[index])
  //     )
  //   }, [])

  // const pointsByDriverChartData = Object.values(raceColumnByIndex)
  //   .filter((_race, index) => index > 0)
  //   .reduce((memo, race, index) => {
  //     const [driverA, driverB] = cDrivers
  //     const driverAPointsByRace =
  //       racePointsByDriver2[driverA].pointsByRace[index]
  //     const driverBPointsByRace =
  //       racePointsByDriver2[driverB].pointsByRace[index]

  //     if (driverAPointsByRace && driverBPointsByRace) {
  //       memo.push({
  //         race,
  //         [driverA]: driverAPointsByRace,
  //         [driverB]: driverBPointsByRace,
  //       })
  //     }
  //     return memo
  //   }, [])

  if (!constructorRacePoints.length) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      constructorName: constructor.name, // constructorRacePoints[0][0],
      drivers: cDrivers,
      teamPrincipal: constructor.team_principal, //constructorRacePoints.map((row) => row[1])[0],
      racePointsByDriver: racePointsByDriver2,
      // totalPointsByRace,
      raceColumnByIndex,
      pointsByDriverChartData: pointsByDriverChartData2,
      chartsEnabled: process.env.CHARTS_ENABLED === 'true',
      result,
      driverPointsByRace,
      races,
    },
  }
}

export default Constructor
