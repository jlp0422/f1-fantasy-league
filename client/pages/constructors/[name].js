import { google } from 'googleapis'
import Header from '../../components/Header'
import { googleAuth } from '../../helpers/auth'
import { toNum } from '../../helpers/utils'

const sheets = google.sheets('v4')

const Constructor = ({
  constructorName,
  drivers,
  racePointsByDriver,
  totalPointsByRace,
  teamPrincipal,
  raceColumnByIndex,
}) => {
  console.log({
    constructorName,
    teamPrincipal,
    drivers,
    racePointsByDriver,
    totalPointsByRace,
    raceColumnByIndex,
  })
  return (
    <div>
      <Header />
      {/* <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
        <a href="#">
          <img
            className="mx-auto rounded-t-lg"
            src="https://www.fillmurray.com/g/300/300"
            alt=""
          />
        </a>
        <div className="p-5">
          <a href="#">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Noteworthy technology acquisitions 2021
            </h5>
          </a>
          <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
            Here are the biggest enterprise technology acquisitions of 2021 so
            far, in reverse chronological order.
          </p>
          <a
            href="#"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Read more
          </a>
        </div>
      </div> */}
      <div className="">
        <h1 className="mx-2 my-2 text-3xl font-bold tracking-tight text-gray-900 sm:mx-4 dark:text-gray-900">
          {constructorName}
        </h1>
        <h2 className="mx-2 my-2 text-2xl font-bold tracking-tight text-gray-900 sm:mx-4 dark:text-gray-900">
          Team Principal: {teamPrincipal}
        </h2>
        <h2 className="mx-2 my-2 text-2xl font-bold tracking-tight text-gray-900 sm:mx-4 dark:text-gray-900">
          Total Points: {racePointsByDriver.total}
        </h2>
        <div className="relative mx-4 my-4 overflow-x-auto rounded-lg shadow-md sm:mx-8">
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
                  Object.keys(raceColumnByIndex).length -
                  pointsByRace.length -
                  1
                const extraColumns = new Array(numExtraColumns).fill(0)
                return (
                  <tr
                    key={driver}
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
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
      </div>
    </div>
  )
}

export async function getServerSideProps({ params }) {
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

  if (!constructorRacePoints.length) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      constructorName,
      drivers: constructorRacePoints.map((row) => row[2]),
      teamPrincipal: constructorRacePoints.map((row) => row[1])[0],
      racePointsByDriver,
      totalPointsByRace,
      raceColumnByIndex,
    },
  }
}

export default Constructor
