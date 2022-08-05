import CarNumber from 'components/CarNumber'
import ConstructorLink from 'components/ConstructorLink'
import { COLORS_BY_CONSTRUCTOR } from 'constants/index'
import { normalizeConstructorName } from 'helpers/cars'

const RacePointsTable = ({
  races,
  standings,
  constructorsById,
  indexedRacePoints,
}) => {
  return (
    <table className="w-full text-base text-left text-gray-300 uppercase bg-gray-800 font-secondary">
      <thead className="bg-gray-700 whitespace-nowrap">
        <tr>
          <th
            key="Constructor"
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
          <th
            key="Total Points"
            scope="col"
            className="px-6 py-3 font-normal text-center"
          >
            Total points
          </th>
          {races.map((race) => (
            <th
              key={race.id}
              scope="col"
              className="px-6 py-3 font-normal text-center"
            >
              {race.location}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {standings.map((constructor) => {
          const normalized = normalizeConstructorName(constructor.name)
          const { numberBackground } = COLORS_BY_CONSTRUCTOR[normalized]
          return (
            <tr
              key={constructor.name}
              className="text-lg bg-gray-800 border-b border-gray-700 th-child:odd:bg-gray-800 th-child:even:bg-gray-700 sm:hover:bg-gray-600 th-child:sm:hover:bg-gray-600 odd:bg-gray-800 even:bg-gray-700"
            >
              <th
                scope="row"
                className="sticky w-[88px] min-w-[88px] max-w-[88px] sm:w-[310px] sm:min-w-[310px] sm:max-w-[310px] left-0 "
              >
                <div className="flex items-center justify-center gap-3 px-2 py-3 font-semibold text-gray-100 sm:justify-start sm:px-6 sm:py-4 whitespace-nowrap">
                  <ConstructorLink
                    normalizedConstructor={normalized}
                    constructorId={constructor.id}
                  >
                    <a
                      className="relative w-10 h-10 p-2 rounded-full sm:w-14 sm:h-14 sm:p-3"
                      style={{ backgroundColor: numberBackground }}
                    >
                      <CarNumber constructor={constructor.name} size="small" />
                    </a>
                  </ConstructorLink>
                  <ConstructorLink
                    normalizedConstructor={normalized}
                    constructorId={constructor.id}
                  >
                    <a className="invisible hidden sm:block sm:visible sm:hover:text-gray-300">
                      {constructor.name}
                    </a>
                  </ConstructorLink>
                </div>
              </th>
              <td className="px-6 py-4 text-center ">
                {constructorsById[constructor.id].total_points}
              </td>
              {races.map((race) => (
                // use optional chaining
                <td
                  className="px-6 py-4 text-center"
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
