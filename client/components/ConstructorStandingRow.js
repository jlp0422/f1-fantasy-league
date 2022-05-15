import CarNumber from 'components/CarNumber'
import { CAR_NUMBER_BACKGROUND_COLORS } from 'constants/index'
import { normalizeConstructorName } from 'helpers/cars'
import Link from 'next/link'

const ConstructorStandingRow = ({ constructor, principal, points }) => {
  const normalized = normalizeConstructorName(constructor)
  const numberBgColor = CAR_NUMBER_BACKGROUND_COLORS[normalized]
  return (
    <li className="w-full px-4 py-2.5 border-b border-gray-600 first-of-type:rounded-t-lg last-of-type:rounded-b-lg odd:bg-gray-800 even:bg-gray-700">
      <div className="flex items-center space-x-4">
        <div className="flex items-center flex-1 min-w-0">
          <div
            className={`relative w-14 h-14 sm:w-20 sm:h-20 sm:p-4 p-3 rounded-full`}
            style={{ backgroundColor: numberBgColor }}
          >
            <CarNumber constructor={constructor} size="small" />
          </div>
          <div className="flex flex-col ml-4">
            <Link
              href={{
                pathname: '/constructors/[name]',
                query: {
                  name: encodeURIComponent(normalized),
                },
              }}
            >
              <a>
                <p className="text-base font-medium truncate text-gray-50 sm:text-2xl hover:text-gray-300">
                  {constructor}
                </p>
              </a>
            </Link>
            <p className="invisible hidden text-gray-300 sm:visible sm:block sm:text-base">
              Team Principal: {principal}
            </p>
          </div>
        </div>
        <div className="inline-flex items-center text-base font-semibold text-white sm:text-2xl">
          {points} points
        </div>
      </div>
    </li>
  )
}

export default ConstructorStandingRow
