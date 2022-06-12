import Layout from 'components/Layout'
import RacePointsChart from 'components/RacePointsChart'
import RacePointsTable from 'components/RacePointsTable'
import { google } from 'googleapis'
import { googleAuth } from 'helpers/auth'
import { sum, toNum } from 'helpers/utils'
import { useState } from 'react'

const sheets = google.sheets('v4')

const RacePoints = ({
  // racePointTable,
  racePointsByConstructor,
  raceColumnByIndex,
  racePointsByConstructorByRace,
  constructors,
  chartsEnabled,
  cumulativePointsByConstructor,
}) => {
  const tabOptions = ['table', 'chart']
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('table')
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false)
  const [selectedChartConstructors, setSelectedChartConstructors] = useState([])
  const totalRaces = Object.keys(raceColumnByIndex).length
  const chartLines = selectedChartConstructors.length
    ? selectedChartConstructors
    : constructors

  return (
    <Layout
      documentTitle="Points by Race"
      description="Points by Race for all Constructors"
      fullWidth
    >
      <div className="relative mx-2 mt-2 font-tertiary sm:mx-4">
        <button
          onClick={() => setIsTabDropdownOpen((open) => !open)}
          id="dropdownDefault"
          data-dropdown-toggle="dropdown"
          className="text-white mt-2 my-4 w-40 font-medium rounded-lg text-xl px-4 py-2.5 text-center inline-flex items-center justify-between bg-gray-600 hover:bg-gray-700 capitalize"
          type="button"
        >
          {activeTab}
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>
        {isTabDropdownOpen && (
          <div
            id="dropdown"
            className={`z-10 ${
              isTabDropdownOpen ? 'block' : 'hidden'
            } divide-y divide-gray-100 rounded shadow w-40 bg-gray-500 absolute top-[58px] left-2`}
          >
            <ul
              className="py-1 mt-2 text-xl text-gray-200"
              aria-labelledby="dropdownDefault"
            >
              {tabOptions.map((tab) => (
                <li key={tab}>
                  <button
                    onClick={() => {
                      setActiveTab(tab)
                      setIsTabDropdownOpen(false)
                    }}
                    className="block w-full px-4 py-2 text-left capitalize hover:bg-gray-600 hover:text-white"
                  >
                    {tab}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="relative mx-2 mb-4 overflow-x-auto rounded-lg sm:mx-4">
        {activeTab === 'table' && (
          <RacePointsTable
            raceColumnByIndex={raceColumnByIndex}
            racePointsByConstructorByRace={racePointsByConstructorByRace}
            racePointsByConstructor={racePointsByConstructor}
            totalRaces={totalRaces}
          />
        )}

        {/* cumulative points line chart */}
        {chartsEnabled && activeTab === 'chart' && (
          <RacePointsChart
            setIsChartDropdownOpen={setIsChartDropdownOpen}
            selectedChartConstructors={selectedChartConstructors}
            isChartDropdownOpen={isChartDropdownOpen}
            setSelectedChartConstructors={setSelectedChartConstructors}
            cumulativePointsByConstructor={cumulativePointsByConstructor}
            constructors={constructors}
            chartLines={chartLines}
          />
        )}
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

  const constructors = Object.keys(racePointsByConstructorByRace)
  const totalRaces = Object.values(racePointsByConstructorByRace)[0].length
  const cumulativePointsByConstructor = Object.values(raceColumnByIndex)
    .slice(1, totalRaces + 1)
    .map((race, index) => {
      const data = { race }
      constructors.forEach((constructor) => {
        const racePoints = racePointsByConstructorByRace[constructor]
        const races = racePoints.slice(0, index + 1)
        data[constructor] = sum(races)
      })
      return data
    })

  return {
    props: {
      racePointTable: racePoints,
      racePointsByConstructor,
      raceColumnByIndex,
      racePointsByConstructorByRace,
      chartsEnabled: process.env.CHARTS_ENABLED === 'true',
      cumulativePointsByConstructor,
      constructors,
    },
  }
}

export default RacePoints
