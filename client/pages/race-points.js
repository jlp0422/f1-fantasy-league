import Layout from 'components/Layout'
import RacePointsChart from 'components/RacePointsChart'
import RacePointsTable from 'components/RacePointsTable'
import { indexBy, sum } from 'helpers/utils'
import { supabase } from 'lib/database'
import { useState } from 'react'

const RacePoints = ({
  chartsEnabled,
  cumulativePointsByConstructor,
  races,
  standings,
  constructorsById,
  totalCompletedRaces,
  indexedRacePoints,
  constructors,
}) => {
  const tabOptions = ['table', 'chart']
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('table')
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false)
  const [selectedChartConstructors, setSelectedChartConstructors] = useState([])
  const chartLines = selectedChartConstructors.length
    ? selectedChartConstructors
    : constructors.map(({ name }) => name)

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
            races={races}
            // results={results}
            standings={standings}
            constructorsById={constructorsById}
            indexedRacePoints={indexedRacePoints}
            totalCompletedRaces={totalCompletedRaces}
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
  const { data: racePointsByConstructorByRace } = await supabase
    .rpc('total_points_by_constructor_by_race')
    .select('*')

  const indexedRacePoints = racePointsByConstructorByRace.reduce(
    (memo, item) => {
      const constructorId = item.constructor_id
      const raceId = item.race_id
      const existingRace = memo[raceId]
      const prevRaceId = raceId - 1
      const prevRacePoints =
        memo[prevRaceId]?.[constructorId]?.total_points || 0

      if (existingRace) {
        memo[raceId] = {
          ...existingRace,
          [constructorId]: {
            race_points: item.total_points,
            total_points: prevRacePoints + item.total_points,
          },
        }
      } else {
        memo[raceId] = {
          [constructorId]: {
            race_points: item.total_points,
            total_points: prevRacePoints + item.total_points,
          },
        }
      }
      return memo
    },
    {}
  )

  const totalCompletedRaces = new Set(
    racePointsByConstructorByRace.map(({ race_id }) => race_id)
  ).size

  const { data: races } = await supabase
    .from('race')
    .select('id, location, start_date, season(year)')
    .eq('season.year', 2022)
    .order('start_date', { ascending: true })

  const { data: constructors } = await supabase
    .from('constructor')
    .select('id, name')

  const { data: standings } = await supabase
    .rpc('sum_constructor_points')
    .select('id, name, total_points')
    .order('total_points', { ascending: false })

  const constructorsById = indexBy('id')(standings)
  const racesById = indexBy('id')(races)

  const cumulativePointsByConstructor = Object.entries(indexedRacePoints).map(
    ([raceId, data]) => {
      const dataArray = Object.entries(data).reduce(
        (memo, [constructorId, { total_points }]) =>
          Object.assign({}, memo, {
            [constructorsById[constructorId].name]: total_points,
          }),
        {}
      )
      return {
        race: racesById[raceId].location,
        ...dataArray,
      }
    }
  )

  return {
    props: {
      chartsEnabled: process.env.CHARTS_ENABLED === 'true',
      cumulativePointsByConstructor,
      races,
      standings,
      constructorsById,
      indexedRacePoints,
      constructors,
      totalCompletedRaces,
    },
  }
}

export default RacePoints
