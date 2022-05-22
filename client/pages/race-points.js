import CarNumber from 'components/CarNumber'
import Layout from 'components/Layout'
import { COLORS_BY_CONSTRUCTOR } from 'constants/index'
import { google } from 'googleapis'
import { googleAuth } from 'helpers/auth'
import { normalizeConstructorName } from 'helpers/cars'
import { sortArray, sum, toNum } from 'helpers/utils'
import Link from 'next/link'

const sheets = google.sheets('v4')

const RacePoints = ({
  racePointTable,
  racePointsByConstructor,
  raceColumnByIndex,
  racePointsByConstructorByRace,
}) => {
  const totalRaces = Object.keys(raceColumnByIndex).length
  // console.log({
  //   racePointTable,
  //   racePointsByConstructor,
  //   raceColumnByIndex,
  //   racePointsByConstructorByRace,
  // })
  return (
    <Layout
      documentTitle="Points by Race"
      description="Points by Race for all Constructors"
    >
      <div className="relative my-4 overflow-x-auto rounded-lg shadow-md">
        <table className="w-full text-sm text-left text-gray-400 bg-gray-800">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700">
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
            {sortArray(
              Object.entries(racePointsByConstructorByRace),
              ([_a, aPoints], [_b, bPoints]) => sum(bPoints) - sum(aPoints)
            ).map(([constructor, pointsByRace]) => {
              const normalized = normalizeConstructorName(constructor)
              const { numberBackground } = COLORS_BY_CONSTRUCTOR[normalized]
              // minus 1 to account for total points column
              const numExtraColumns = totalRaces - pointsByRace.length - 1
              const extraColumns = new Array(numExtraColumns).fill(0)
              return (
                <tr
                  key={constructor}
                  className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600 odd:bg-gray-800 even:bg-gray-700"
                >
                  <th
                    scope="row"
                    className="flex items-center gap-3 px-6 py-4 font-medium text-white whitespace-nowrap w-max"
                  >
                    <div
                      className={`relative w-10 h-10 sm:w-14 sm:h-14 sm:p-3 p-2 rounded-full`}
                      style={{ backgroundColor: numberBackground }}
                    >
                      <CarNumber constructor={constructor} size="small" />
                    </div>
                    <Link
                      href={{
                        pathname: '/constructors/[name]',
                        query: {
                          name: encodeURIComponent(normalized),
                        },
                      }}
                    >
                      <a className="text-sm sm:text-base hover:text-gray-300">
                        {constructor}
                      </a>
                    </Link>
                  </th>
                  <td className="px-6 py-4 text-sm text-center sm:text-base">
                    {racePointsByConstructor[constructor].total}
                  </td>
                  {pointsByRace.map((pointValue, index) => (
                    <td
                      className="px-6 py-4 text-sm text-center sm:text-base"
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
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

export async function getStaticProps() {
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
