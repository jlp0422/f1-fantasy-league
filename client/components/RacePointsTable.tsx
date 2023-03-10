import CarNumber from '@/components/CarNumber'
import ConstructorLink from '@/components/ConstructorLink'
import Arrow from '@/components/icons/Arrow'
import { COLORS_BY_CONSTRUCTOR } from '@/constants/index'
import { normalizeConstructorName } from '@/helpers/cars'
import { sortArray } from '@/helpers/utils'
import {
  ConstructorsById,
  ConstructorTotalPoints,
  IndexedRacePoints,
} from '@/types/Common'
import { Race } from '@/types/Race'
import { useRouter } from 'next/router'
import { useState } from 'react'

interface Props {
  races: Race[]
  standings: ConstructorTotalPoints[]
  constructorsById: ConstructorsById
  indexedRacePoints: IndexedRacePoints
}

const sortingFns: Record<string, any> = {
  name: (a: ConstructorTotalPoints, b: ConstructorTotalPoints) =>
    a.name > b.name ? 1 : -1,
  points: (a: ConstructorTotalPoints, b: ConstructorTotalPoints) =>
    b.total_points - a.total_points,
  default:
    (raceId: string, indexedRacePoints: IndexedRacePoints) =>
    (a: ConstructorTotalPoints, b: ConstructorTotalPoints) =>
      indexedRacePoints[raceId][b.id].race_points -
      indexedRacePoints[raceId][a.id].race_points,
}

const RacePointsTable = ({
  races,
  standings,
  constructorsById,
  indexedRacePoints,
}: Props) => {
  const { query } = useRouter()
  const season = query.season as string
  const [sortBy, setSortBy] = useState<string>('points')
  const sortFn =
    sortingFns[sortBy] || sortingFns.default(sortBy, indexedRacePoints)
  const sortedStandings: ConstructorTotalPoints[] = sortArray(standings, sortFn)

  const renderSortButton = (label: string, sortKey: string) => (
    <button
      className='flex gap-0.5 uppercase items-center'
      onClick={() => setSortBy(sortKey)}
    >
      {label}
      {sortBy === sortKey ? <Arrow /> : null}
    </button>
  )

  return (
    <table className='w-full text-base text-left text-gray-300 uppercase bg-gray-800 font-secondary'>
      <thead className='bg-gray-700 whitespace-nowrap'>
        <tr>
          <th
            key='Constructor'
            scope='col'
            className='px-6 py-3 sticky invisible hidden sm:table-cell sm:visible sm:w-[310px] sm:min-w-[310px] sm:max-w-[310px] left-0 bg-gray-700'
          >
            {renderSortButton('Constructor', 'name')}
          </th>
          <th
            scope='col'
            className='px-6 py-3 visible table-cell sticky left-0 w-[88px] min-w-[88px] max-w-[88px] bg-gray-700 sm:invisible sm:hidden'
          >
            &nbsp;
          </th>
          <th
            key='Total Points'
            scope='col'
            className='px-6 py-3 font-normal text-center'
          >
            {renderSortButton('Total Points', 'points')}
          </th>
          {races.map((race) => (
            <th
              key={race.id}
              scope='col'
              className='px-6 py-3 font-normal text-center'
            >
              {renderSortButton(race.country, race.id.toString())}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedStandings.map((constructor) => {
          const normalized = normalizeConstructorName(constructor.name)
          const { numberBackground } = COLORS_BY_CONSTRUCTOR[season][normalized]
          return (
            <tr
              key={constructor.name}
              className='text-lg bg-gray-800 border-b border-gray-700 th-child:odd:bg-gray-800 th-child:even:bg-gray-700 sm:hover:bg-gray-600 th-child:sm:hover:bg-gray-600 odd:bg-gray-800 even:bg-gray-700'
            >
              <th
                scope='row'
                className='sticky w-[88px] min-w-[88px] max-w-[88px] sm:w-[310px] sm:min-w-[310px] sm:max-w-[310px] left-0'
              >
                <div className='flex items-center justify-center px-2 py-3 font-semibold text-gray-100 gap-3 sm:justify-start sm:px-6 sm:py-4 whitespace-nowrap'>
                  <ConstructorLink
                    normalizedConstructor={normalized}
                    constructorId={constructor.id}
                  >
                    <div
                      className='relative w-10 h-10 p-2 rounded-full sm:w-14 sm:h-14 sm:p-3'
                      style={{ backgroundColor: numberBackground }}
                    >
                      <CarNumber constructorName={normalized} size='small' />
                    </div>
                  </ConstructorLink>
                  <ConstructorLink
                    normalizedConstructor={normalized}
                    constructorId={constructor.id}
                  >
                    <div className='invisible hidden sm:block sm:visible sm:hover:text-gray-300'>
                      {constructor.name}
                    </div>
                  </ConstructorLink>
                </div>
              </th>
              <td className='px-6 py-4 text-center '>
                {constructorsById[constructor.id].total_points}
              </td>
              {races.map((race) => (
                <td
                  className='px-6 py-4 text-center'
                  key={`${constructor.id}-${race.id}`}
                >
                  {indexedRacePoints[race.id]
                    ? indexedRacePoints[race.id][constructor.id].race_points
                    : null}
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default RacePointsTable
