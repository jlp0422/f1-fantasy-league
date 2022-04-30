import { toNum } from '../../helpers/utils'
import { google } from 'googleapis'
import { googleAuth } from '../../helpers/auth'
import Header from '../../components/Header'

const sheets = google.sheets('v4')

const Constructor = ({
  constructorName,
  drivers,
  racePointsByDriver,
  totalPointsByRace,
  teamPrincipal,
}) => {
  console.log({
    constructorName,
    teamPrincipal,
    drivers,
    racePointsByDriver,
    totalPointsByRace,
  })
  return (
    <div>
      <Header />
      <h1>{constructorName}</h1>
      <h2>Team Principal: {teamPrincipal}</h2>
      <h2>Drivers: {drivers.join(', ')}</h2>
      <h2>Total Points: {racePointsByDriver.total}</h2>
      <div>
        {drivers.map((driver) => {
          const { pointsByRace, total } = racePointsByDriver[driver]
          return (
            <div style={{ display: 'flex', gap: '10px' }} key={driver}>
              <p>{driver}</p>
              <p>{total}</p>
              {pointsByRace.map((points, index) => (
                <p key={`${points}-${index}`}>{points}</p>
              ))}
            </div>
          )
        })}
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
    },
  }
}

export default Constructor
