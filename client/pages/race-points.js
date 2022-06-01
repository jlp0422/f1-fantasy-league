import CarNumber from 'components/CarNumber'
import ConstructorLink from 'components/ConstructorLink'
import Layout from 'components/Layout'
import RacePointsChart from 'components/RacePointsChart'
import { COLORS_BY_CONSTRUCTOR } from 'constants/index'
import { google } from 'googleapis'
import { googleAuth } from 'helpers/auth'
import { normalizeConstructorName } from 'helpers/cars'
import { sortArray, sum, toNum } from 'helpers/utils'
import { useState } from 'react'

const sheets = google.sheets('v4')

const RacePoints = ({
  racePointTable,
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
  const [selectedChartConstructor, setSelectedChartConstructor] = useState(null)
  const totalRaces = Object.keys(raceColumnByIndex).length
  const chartLines = selectedChartConstructor
    ? [selectedChartConstructor]
    : constructors

  // console.log({
  //   racePointTable,
  //   racePointsByConstructor,
  //   raceColumnByIndex,
  //   racePointsByConstructorByRace,
  //   cumulativePointsByConstructor,
  // })

  return (
    <Layout
      documentTitle="Points by Race"
      description="Points by Race for all Constructors"
      fullWidth
    >
      <div className="relative mx-2 my-4 overflow-x-auto rounded-lg sm:m-4">
        <div className="relative font-tertiary">
          <button
            onClick={() => setIsTabDropdownOpen((open) => !open)}
            id="dropdownDefault"
            data-dropdown-toggle="dropdown"
            className="text-white mt-2 my-4 w-40 font-medium rounded-lg text-xl px-4 py-2.5 text-center inline-flex items-center justify-between bg-blue-600 hover:bg-blue-700 capitalize"
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
              } divide-y divide-gray-100 rounded shadow w-40 bg-gray-700 absolute top-[52px]`}
            >
              <ul
                className="py-1 mt-2 text-xl text-gray-200"
                aria-labelledby="dropdownDefault"
              >
                {tabOptions.map((tab) => (
                  <li>
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
        {activeTab === 'table' && (
          <table className="w-full text-base text-left text-gray-300 uppercase bg-gray-800 font-secondary">
            <thead className="bg-gray-700 whitespace-nowrap">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 sticky invisible hidden sm:table-cell sm:visible sm:w-[310px] sm:min-w-[310px] sm:max-w-[310px] left-0 bg-gray-700"
                >
                  Constructor
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 visible table-cell sticky left-0 w-[88px] min-w-[88px] max-w-[88px] bg-gray-700 sm:invisible sm:hidden"
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
                      className="sticky w-[88px] min-w-[88px] max-w-[88px] sm:w-[310px] sm:min-w-[310px] sm:max-w-[310px] left-0 "
                    >
                      <div className="flex items-center justify-center gap-3 px-2 py-3 font-semibold text-gray-100 sm:justify-start sm:px-6 sm:py-4 whitespace-nowrap">
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
                      </div>
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
        )}

        {/* cumulative points line chart */}
        {chartsEnabled && activeTab === 'chart' && (
          <RacePointsChart
            setIsChartDropdownOpen={setIsChartDropdownOpen}
            selectedChartConstructor={selectedChartConstructor}
            isChartDropdownOpen={isChartDropdownOpen}
            setSelectedChartConstructor={setSelectedChartConstructor}
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
