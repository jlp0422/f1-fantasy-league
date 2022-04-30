import { google } from 'googleapis'
import { googleAuth } from '../helpers/auth'
import { toNum } from '../helpers/utils'
import Header from '../components/Header'

const sheets = google.sheets('v4')

function RacePoints({
  racePointTable,
  racePointsByConstructor,
  raceColumnByIndex,
  racePointsByConstructorByRace,
}) {
  return (
    <div>
      <Header />
      <h1>2022 Race Points</h1>
      <table>
        <thead>
          <tr>
            <th>Constructor</th>
            {Object.values(raceColumnByIndex).map((race) => (
              <th key={race}>{race}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(racePointsByConstructorByRace).map(
            ([constructor, pointsByRace]) => (
              <tr key={constructor}>
                <td>{constructor}</td>
                {pointsByRace.map((point, index) => (
                  <td key={index}>{point}</td>
                ))}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  )
}

export async function getServerSideProps(context) {
  google.options({ auth: googleAuth })

  const existingColumnData = await sheets.spreadsheets.get({
    ranges: ["'RACE POINTS'!A1:Z17"],
    spreadsheetId: process.env.SPREADSHEET_ID,
    includeGridData: true,
  })

  const racePoints = existingColumnData.data.sheets[0].data[0].rowData.map(
    (row) =>
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
    const [constructor, driver, totalPoints, ...pointsByRace] = item
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
