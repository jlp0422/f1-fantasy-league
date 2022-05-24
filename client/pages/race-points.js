import CarNumber from 'components/CarNumber'
import ConstructorLink from 'components/ConstructorLink'
import Layout from 'components/Layout'
import { COLORS_BY_CONSTRUCTOR } from 'constants/index'
import { google } from 'googleapis'
import { googleAuth } from 'helpers/auth'
import { normalizeConstructorName } from 'helpers/cars'
import { sortArray, sum, toNum } from 'helpers/utils'

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
      fullWidth
    >
      <div className="relative mx-2 my-4 overflow-x-auto rounded-lg shadow-md sm:m-4">
        <table className="w-full text-base text-left text-gray-300 uppercase bg-gray-800 font-secondary">
          <thead className="bg-gray-700 whitespace-nowrap">
            <tr>
              <th
                scope="col"
                className="sticky left-0 invisible hidden px-6 py-3 bg-gray-700 sm:block sm:visible"
              >
                Constructor
              </th>
              <th
                scope="col"
                className="px-6 py-3 visible block sticky left-0 w-[88px] min-w-[88px] max-w-[88px] bg-gray-700 sm:invisible sm:hidden"
              >
                &nbsp;
              </th>
              {Object.values(raceColumnByIndex).map((race) => (
                <th
                  key={race}
                  scope="col"
                  className="px-6 py-3 font-normal text-center"
                >
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
                  className="text-lg bg-gray-800 border-b border-gray-700 th-child:odd:bg-gray-800 th-child:even:bg-gray-700 sm:hover:bg-gray-600 th-child:sm:hover:bg-gray-600 odd:bg-gray-800 even:bg-gray-700"
                >
                  <th
                    scope="row"
                    className="flex justify-center sm:justify-start items-center sticky w-[88px] min-w-[88px] max-w-[88px] sm:w-[310px] sm:min-w-[310px] sm:max-w-[310px] left-0 gap-3 px-2 py-3 sm:px-6 sm:py-4 font-semibold text-gray-100 whitespace-nowrap"
                  >
                    <ConstructorLink normalizedConstructor={normalized}>
                      <a
                        className="relative w-10 h-10 p-2 rounded-full sm:w-14 sm:h-14 sm:p-3"
                        style={{ backgroundColor: numberBackground }}
                      >
                        <CarNumber constructor={constructor} size="small" />
                      </a>
                    </ConstructorLink>
                    <ConstructorLink normalizedConstructor={normalized}>
                      <a className="invisible hidden sm:block sm:visible sm:hover:text-gray-300">
                        {constructor}
                      </a>
                    </ConstructorLink>
                  </th>
                  <td className="px-6 py-4 text-center ">
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
