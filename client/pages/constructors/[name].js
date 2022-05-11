import CarImage from 'components/CarImage'
import Layout from 'components/Layout'
import { CONSTRUCTOR_NAMES } from 'constants/index'
import { google } from 'googleapis'
import { googleAuth } from 'helpers/auth'
import { toNum } from 'helpers/utils'
import Image from 'next/image'
import { useRouter } from 'next/router'
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

const sheets = google.sheets('v4')

const Constructor = ({
  constructorName,
  drivers,
  racePointsByDriver,
  totalPointsByRace,
  teamPrincipal,
  raceColumnByIndex,
  pointsByDriverChartData,
}) => {
  // console.log({
  //   constructorName,
  //   teamPrincipal,
  //   drivers,
  //   racePointsByDriver,
  //   totalPointsByRace,
  //   raceColumnByIndex,
  // })
  const router = useRouter()

  if (router.isFallback) {
    const fallbackData = [
      {
        value: '&nbsp',
        label: 'Constructor',
      },
      {
        value: '&nbsp;',
        label: 'Team Principal',
      },
      {
        value: '&nbsp;',
        label: 'Total Points',
      },
    ]
    return (
      <Layout documentTitle="Loading constructor">
        <div className="flex flex-col items-center sm:flex-row">
          {/* fix this at some point */}
          <Image
            src={`/cars/winning-formula.jpg`}
            width={288}
            height={288}
            className="rounded-lg shadow-lg w-72 h-72"
          />
          <div className="mx-4 my-2 text-center sm:mx-8 sm:text-left">
            {fallbackData.map(({ value, label }, index) => {
              const fontSizeClass =
                index > 0
                  ? 'text-3xl md:text-4xl lg:text-5xl'
                  : 'text-4xl md:text-5xl lg:text-6xl'
              return (
                <div key={label} className="flex flex-col mt-4 lg:mt-2">
                  <h2
                    className={`font-bold tracking-tight text-gray-900 dark:text-gray-900 ${fontSizeClass}`}
                    dangerouslySetInnerHTML={{ __html: value }}
                  />

                  <p className="leading-none tracking-wide text-gray-600 text-md lg:text-lg dark:text-gray-600">
                    {label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </Layout>
    )
  }

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
      value: racePointsByDriver.total,
      label: 'Total Points',
    },
  ]

  return (
    <Layout documentTitle={constructorName}>
      <div className="flex flex-col items-center sm:flex-row">
        <CarImage constructor={constructorName} size="large" />
        <div className="mx-4 my-2 text-center sm:mx-8 sm:text-left">
          {data.map(({ value, label }, index) => {
            const fontSizeClass =
              index > 0
                ? 'text-3xl md:text-4xl lg:text-5xl'
                : 'text-4xl md:text-5xl lg:text-6xl'
            return (
              <div key={label} className="flex flex-col mt-4 lg:mt-2">
                <h2
                  className={`font-bold tracking-tight text-gray-900 dark:text-gray-900 ${fontSizeClass}`}
                >
                  {value}
                </h2>
                <p className="leading-none tracking-wide text-gray-600 text-md lg:text-lg dark:text-gray-600">
                  {label}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* mobile points table */}
      <div className="relative visible block my-4 overflow-x-auto rounded-lg shadow-md md:hidden md:invisible">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 dark:bg-gray-800">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-3 py-3">
                &nbsp;
              </th>
              {drivers.map((driver) => (
                <th key={driver} scope="col" className="px-6 py-3 text-center">
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
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 odd:bg-white even:bg-gray-50 odd:dark:bg-gray-800 even:dark:bg-gray-700"
                >
                  <th
                    key={race}
                    scope="col"
                    className="py-3 pl-6 pr-3 text-left"
                  >
                    {race}
                  </th>
                  <td className="px-6 py-4 text-center">
                    {index > 0
                      ? driverOnePoints.pointsByRace[index - 1]
                      : driverOnePoints.total}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {index > 0
                      ? driverTwoPoints.pointsByRace[index - 1]
                      : driverTwoPoints.total}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* desktop points table */}
      <div className="relative invisible hidden my-8 overflow-x-auto rounded-lg shadow-md md:block md:visible">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 dark:bg-gray-800">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Driver
              </th>
              {Object.values(raceColumnByIndex).map((race) => (
                <th key={race} scope="col" className="px-6 py-3 text-center">
                  {race}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => {
              const { pointsByRace, total } = racePointsByDriver[driver]
              // minus 1 to account for total points column
              const numExtraColumns =
                Object.keys(raceColumnByIndex).length - pointsByRace.length - 1
              const extraColumns = new Array(numExtraColumns).fill(0)
              return (
                <tr
                  key={driver}
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 odd:bg-white even:bg-gray-50 odd:dark:bg-gray-800 even:dark:bg-gray-700"
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap"
                  >
                    {driver}
                  </th>
                  <td className="px-6 py-4 text-center">{total}</td>
                  {pointsByRace.map((pointValue, index) => (
                    <td
                      className="px-6 py-4 text-center"
                      key={`${driver}-${pointValue}-${index}`}
                    >
                      {pointValue}
                    </td>
                  ))}
                  {extraColumns.map((_, index) => (
                    <td
                      className="px-6 py-4 text-center"
                      key={`empty-${driver}-${index}`}
                    />
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* charts */}
      <div className="invisible hidden sm:visible sm:block">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-900 md:text-3xl lg:text-4xl">
          Driver Points by Race
        </h2>
        <div className="w-full h-96">
          <ResponsiveContainer>
            <LineChart
              data={pointsByDriverChartData}
              margin={{ top: 20, right: 30, bottom: 5, left: 0 }}
            >
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="race" padding={{ left: 10, right: 10 }} />
              <YAxis domain={[-2, 22]} tickCount={7} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={drivers[0]}
                stroke="#228120"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey={drivers[1]}
                stroke="#1436EA"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  )
}

export async function getStaticPaths() {
  return {
    paths: CONSTRUCTOR_NAMES.map((constructor) => ({
      params: { name: encodeURIComponent(constructor) },
    })),
    fallback: true,
  }
}

export async function getStaticProps({ params }) {
  const constructorName = decodeURIComponent(params.name)
  google.options({ auth: googleAuth })

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
    (row) => row[0] === constructorName
  )

  const drivers = constructorRacePoints.map((row) => row[2])

  const racePointsByDriver = constructorRacePoints.reduce((memo, item) => {
    const [_constructor, _principal, driver, totalPoints, ...pointsByRace] =
      item
    const driverTotalPoints = toNum(totalPoints)

    return Object.assign({}, memo, {
      [driver]: {
        total: driverTotalPoints,
        pointsByRace,
      },
      total: (memo.total || 0) + driverTotalPoints,
    })
  }, {})

  const totalPointsByRace = Object.values(racePointsByDriver)
    .filter((item) => item.pointsByRace)
    .reduce((memo, driver) => {
      if (!memo.length) {
        return driver.pointsByRace
      }
      return memo.map(
        (points, index) => toNum(points) + toNum(driver.pointsByRace[index])
      )
    }, [])

  const pointsByDriverChartData = Object.values(raceColumnByIndex)
    .filter((_race, index) => index > 0)
    .reduce((memo, race, index) => {
      const [driverA, driverB] = drivers
      const driverAPointsByRace =
        racePointsByDriver[driverA].pointsByRace[index]
      const driverBPointsByRace =
        racePointsByDriver[driverB].pointsByRace[index]

      if (driverAPointsByRace && driverBPointsByRace) {
        memo.push({
          race,
          [driverA]: driverAPointsByRace,
          [driverB]: driverBPointsByRace,
        })
      }
      return memo
    }, [])

  if (!constructorRacePoints.length) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      constructorName,
      drivers,
      teamPrincipal: constructorRacePoints.map((row) => row[1])[0],
      racePointsByDriver,
      totalPointsByRace,
      raceColumnByIndex,
      pointsByDriverChartData,
    },
  }
}

export default Constructor
