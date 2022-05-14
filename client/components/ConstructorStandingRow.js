import CarNumber from 'components/CarNumber'
import { normalizeConstructorName } from 'helpers/cars'
import { CAR_NUMBER_BACKGROUND_COLORS } from 'constants/index'
import Link from 'next/link'

const ConstructorStandingRow = ({ constructor, points }) => {
  const normalized = normalizeConstructorName(constructor)
  const bgColor = CAR_NUMBER_BACKGROUND_COLORS[normalized]
  return (
    <li className="w-full px-4 py-2.5 border-b border-gray-600 first-of-type:rounded-t-lg last-of-type:rounded-b-lg odd:bg-gray-800 even:bg-gray-700">
      <div className="flex items-center space-x-4">
        <div className="flex items-center flex-1 min-w-0">
          <div
            className={`relative w-14 h-14 sm:w-20 sm:h-20 sm:p-4 p-3 ${bgColor} rounded-full`}
          >
            <CarNumber constructor={constructor} size="small" />
          </div>
          <p className="ml-4 text-base font-medium text-white truncate sm:text-2xl">
            <Link
              href={{
                pathname: '/constructors/[name]',
                query: {
                  name: encodeURIComponent(
                    normalizeConstructorName(constructor)
                  ),
                },
              }}
            >
              <a className="hover:text-gray-300">{constructor}</a>
            </Link>
          </p>
        </div>
        <div className="inline-flex items-center text-base font-semibold text-white sm:text-2xl">
          {points} points
        </div>
      </div>
    </li>
  )
}

export default ConstructorStandingRow
