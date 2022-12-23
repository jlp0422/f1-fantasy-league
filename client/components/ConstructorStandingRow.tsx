import CarNumber from '@/components/CarNumber'
import ConstructorLink from '@/components/ConstructorLink'
import { COLORS_BY_CONSTRUCTOR } from '@/constants/index'
import { normalizeConstructorName } from '@/helpers/cars'

interface Props {
  //TODO make type
  constructor: string
  principal: string
  points: string
  id: string
}

const ConstructorStandingRow = ({
  constructor,
  principal,
  points,
  id,
}: Props) => {
  const normalized = normalizeConstructorName(constructor)
  const { numberBackground, numberText } = COLORS_BY_CONSTRUCTOR[normalized]
  return (
    <li
      className="w-full pr-3 pl-1 py-3 sm:px-8 sm:py-2.5 border-b border-gray-600"
      style={{ backgroundColor: numberBackground }}
    >
      <div className="flex items-center mx-auto space-x-3 max-w-7xl">
        <div className="flex items-center flex-1 min-w-0 truncate">
          <div
            className="relative min-w-[48px] min-h-[48px] w-12 h-12 p-2 rounded-full sm:w-20 sm:h-20 sm:p-4"
            style={{ backgroundColor: numberBackground }}
          >
            <CarNumber constructorName={normalized} size="small" />
          </div>
          <div className="flex flex-col ml-1 truncate sm:ml-4">
            <ConstructorLink
              normalizedConstructor={normalized}
              constructorId={id}
            >
              <a>
                <p
                  className="pr-[2px] text-2xl font-bold tracking-tight uppercase truncate md:tracking-normal sm:text-4xl sm:hover:underline font-primary"
                  style={{ color: numberText }}
                >
                  {constructor}
                </p>
              </a>
            </ConstructorLink>
            <p
              className="invisible hidden italic font-semibold uppercase sm:visible sm:block sm:text-lg font-secondary"
              style={{ color: numberText, lineHeight: 1.25 }}
            >
              Team Principal: {principal}
            </p>
          </div>
        </div>
        <p
          className="items-center invisible hidden font-bold uppercase sm:visible sm:inline-flex sm:text-3xl md:text-4xl font-primary"
          style={{ color: numberText }}
        >
          {points} points
        </p>
        <p
          className="inline-flex items-center visible text-xl font-bold uppercase sm:hidden sm:invisible sm:text-2xl font-primary"
          style={{ color: numberText }}
        >
          {points} pts
        </p>
      </div>
    </li>
  )
}

export default ConstructorStandingRow
