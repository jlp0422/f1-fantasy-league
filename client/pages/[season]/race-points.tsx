import Layout from '@/components/Layout'
import RacePointsChart from '@/components/RacePointsChart'
import RacePointsTable from '@/components/RacePointsTable'
import { makeSeasonPaths } from '@/helpers/routes'
import { indexBy } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import {
  ConstructorsById,
  ConstructorTotalPoints,
  GenericObject,
  IndexedRacePoints,
} from '@/types/Common'
import { Season } from '@/types/Season'
import { ConstructorWithSeason, RaceWithSeason } from '@/types/Unions'
import { GetStaticPropsContext } from 'next'
import { useState } from 'react'

interface TotalPointsByConstructorByRace {
  constructor_id: number
  race_id: number
  total_points: number
}

interface Props {
  chartsEnabled: boolean
  cumulativePointsByConstructor: GenericObject[]
  races: RaceWithSeason[]
  standings: ConstructorTotalPoints[]
  constructorsById: ConstructorsById
  indexedRacePoints: IndexedRacePoints
  constructors: ConstructorWithSeason[]
}

const RacePoints = ({
  chartsEnabled,
  cumulativePointsByConstructor,
  races,
  standings,
  constructorsById,
  indexedRacePoints,
  constructors,
}: Props) => {
  const tabOptions = ['table', 'chart']
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('table')
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState<boolean>(false)
  const [selectedChartConstructors, setSelectedChartConstructors] = useState<
    string[]
  >([])
  const chartLines = selectedChartConstructors.length
    ? selectedChartConstructors
    : constructors.map(({ name }) => name)

  return (
    <Layout
      documentTitle="Points by Race"
      description="Points by Race for all Constructors"
      fullWidth
    >
      {chartsEnabled && (
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
      )}
      <div className="relative mx-2 mb-4 overflow-x-auto rounded-lg sm:mx-4">
        {activeTab === 'table' && (
          <RacePointsTable
            races={races}
            standings={standings}
            constructorsById={constructorsById}
            indexedRacePoints={indexedRacePoints}
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

export async function getStaticPaths() {
  const { data } = (await supabase.from('season').select('*')) as {
    data: Season[]
  }

  return makeSeasonPaths(data)
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const { data: totalPointsByConstructorByRace } = (await supabase
    .rpc('total_points_by_constructor_by_race', { season: params?.season })
    .select('*')) as { data: TotalPointsByConstructorByRace[] }

  const indexedRacePoints = totalPointsByConstructorByRace.reduce(
    (memo: IndexedRacePoints, item) => {
      const constructorId = item.constructor_id
      const raceId = item.race_id
      const existingRace = memo[raceId]
      if (existingRace) {
        memo[raceId] = {
          ...existingRace,
          [constructorId]: {
            race_points: item.total_points,
          },
        }
      } else {
        memo[raceId] = {
          [constructorId]: {
            race_points: item.total_points,
          },
        }
      }
      return memo
    },
    {}
  )

  const { data: races } = (await supabase
    .from('race')
    .select('id, location, country, start_date, season!inner(year)')
    .eq('season.year', params?.season)
    .order('start_date', { ascending: true })) as { data: RaceWithSeason[] }

  const { data: constructors } = (await supabase
    .from('constructor')
    .select('id, name, season!inner(year)')
    .eq('season.year', params?.season)) as { data: ConstructorWithSeason[] }

  const { data: standings } = (await supabase
    .rpc('sum_constructor_points_by_season', { season: params?.season })
    .select('id, name, total_points')
    .order('total_points', { ascending: false })) as {
    data: ConstructorTotalPoints[]
  }

  const constructorsById = indexBy('id')(standings)

  const cumulativePointsByConstructor = totalPointsByConstructorByRace.reduce(
    (memo: Record<string, number[]>, item) => {
      const constructorId = item.constructor_id
      const points = item.total_points
      if (memo[constructorId]) {
        const arr = memo[constructorId]
        const prevTotal = arr[arr.length - 1]
        memo[constructorId].push(prevTotal + points)
      } else {
        memo[constructorId] = [points]
      }
      return memo
    },
    {}
  )

  const chartData = races.reduce((memo: GenericObject[], race, index) => {
    const data: GenericObject = { race: race.country }
    let hasRaceData = false
    constructors.forEach((c) => {
      const cPoints = cumulativePointsByConstructor[c.id][index]
      data[c.name] = cPoints
      hasRaceData = !isNaN(cPoints)
    })

    if (hasRaceData) {
      memo.push(data)
    }
    return memo
  }, [])

  return {
    props: {
      chartsEnabled: process.env.CHARTS_ENABLED === 'true',
      cumulativePointsByConstructor: chartData,
      races,
      standings,
      constructorsById,
      indexedRacePoints,
      constructors,
    },
  }
}

export default RacePoints
