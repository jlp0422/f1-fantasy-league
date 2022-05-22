import CarNumber from 'components/CarNumber'
import { COLORS_BY_CONSTRUCTOR } from 'constants/index'
import { normalizeConstructorName } from 'helpers/cars'
import Link from 'next/link'

const ConstructorStandingRow = ({ constructor, principal, points }) => {
  const normalized = normalizeConstructorName(constructor)
  const { numberBackground, numberText } = COLORS_BY_CONSTRUCTOR[normalized]
  return (
    <li
      className="w-full px-4 py-2 sm:px-8 sm:py-2.5 border-b border-gray-600"
      style={{ backgroundColor: numberBackground }}
    >
      <div className="flex items-center mx-auto space-x-4 max-w-7xl">
        <div className="flex items-center flex-1 min-w-0 truncate">
          <div
            className="relative min-w-[48px] min-h-[48px] w-14 h-14 p-2 rounded-full sm:w-20 sm:h-20 sm:p-4"
            style={{ backgroundColor: numberBackground }}
          >
            <CarNumber constructor={constructor} size="small" />
          </div>
          <div className="flex flex-col ml-2 truncate sm:ml-4">
            <Link
              href={{
                pathname: '/constructors/[name]',
                query: {
                  name: encodeURIComponent(normalized),
                },
              }}
            >
              <a>
                <p
                  className="text-xl font-bold truncate sm:text-4xl hover:underline"
                  style={{ color: numberText }}
                >
                  {constructor}
                </p>
              </a>
            </Link>
            <p
              className="invisible hidden italic sm:visible sm:block sm:text-base"
              style={{ color: numberText }}
            >
              Team Principal: {principal}
            </p>
          </div>
        </div>
        <p
          className="items-center invisible hidden font-bold sm:visible sm:inline-flex sm:text-2xl md:text-3xl"
          style={{ color: numberText }}
        >
          {points} points
        </p>
        <p
          className="inline-flex items-center visible text-xl font-bold sm:hidden sm:invisible sm:text-2xl"
          style={{ color: numberText }}
        >
          {points} pts
        </p>
      </div>
    </li>
  )
}

export default ConstructorStandingRow
