import { google } from 'googleapis'
import Link from 'next/link'
import Header from '../components/Header'
import { googleAuth } from '../helpers/auth'
import { toNum } from '../helpers/utils'

const sheets = google.sheets('v4')

function RacePoints({
  racePointTable,
  racePointsByConstructor,
  raceColumnByIndex,
  racePointsByConstructorByRace,
}) {
  console.log({
    racePointTable,
    racePointsByConstructor,
    raceColumnByIndex,
    racePointsByConstructorByRace,
  })
  return (
    <div>
      <Header />
      {/* account for dark */}
      <h1 className="my-2 mx-2 sm:mx-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-900">
        2022 Race Points
      </h1>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4 mx-2">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 dark:bg-gray-800">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Constructor
              </th>
              {Object.values(raceColumnByIndex).map((race) => (
                <th key={race} scope="col" className="px-6 py-3 text-center">
                  {race}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(racePointsByConstructorByRace).map(
              ([constructor, pointsByRace]) => {
                // minus 1 to account for total points column
                const numExtraColumns =
                  Object.keys(raceColumnByIndex).length -
                  pointsByRace.length -
                  1
                const extraColumns = new Array(numExtraColumns).fill(0)
                return (
                  <tr
                    key={constructor}
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap"
                    >
                      <Link
                        href={{
                          pathname: '/constructors/[name]',
                          query: { name: encodeURIComponent(constructor) },
                        }}
                      >
                        <a>{constructor}</a>
                      </Link>
                    </th>
                    <td className="px-6 py-4 text-center">
                      {racePointsByConstructor[constructor].total}
                    </td>
                    {pointsByRace.map((pointValue, index) => (
                      <td
                        className="px-6 py-4 text-center"
                        key={`${constructor}-${pointValue}-${index}`}
                      >
                        {pointValue}
                      </td>
                    ))}
                    {extraColumns.map((_, index) => (
                      <td
                        className="px-6 py-4 text-center"
                        key={`empty-${constructor}-${index}`}
                      />
                    ))}
                  </tr>
                )
              }
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export async function getServerSideProps(context) {
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

  const racePointsByConstructor = racePoints.slice(1).reduce((memo, item) => {
    const [constructor, _principal, driver, totalPoints, ...pointsByRace] = item
    const driverTotalPoints = toNum(totalPoints)
    if (!memo[constructor]) {
      memo[constructor] = {}
    }
    memo[constructor] = Object.assign({}, memo[constructor], {
      [driver]: {
        total: driverTotalPoints,
        pointsByRace,
      },
      total: (memo[constructor].total || 0) + driverTotalPoints,
    })

    return memo
  }, {})

  const constructorDrivers = Object.entries(racePointsByConstructor)
  const racePointsByConstructorByRace = constructorDrivers.reduce(
    (memo, [constructor, drivers]) => {
      const [driver1, driver2] = Object.values(drivers).filter(
        (item) => item.pointsByRace
      )
      memo[constructor] = driver1.pointsByRace.map(
        (points, index) => toNum(points) + toNum(driver2.pointsByRace[index])
      )
      return memo
    },
    {}
  )

  return {
    props: {
      racePointTable: racePoints,
      racePointsByConstructor,
      raceColumnByIndex,
      racePointsByConstructorByRace,
    },
  }
}

export default RacePoints
