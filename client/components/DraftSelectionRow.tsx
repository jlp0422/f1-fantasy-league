import CarNumber from '@/components/CarNumber'
import ConstructorLink from '@/components/ConstructorLink'
import { COLORS_BY_CONSTRUCTOR } from '@/constants/index'
import { normalizeConstructorName } from '@/helpers/cars'
import { makeName, ordinal } from '@/helpers/utils'
import { DraftSelectionWithDriverAndConstructor } from '@/types/Unions'
import Image from 'next/image'
import { useRouter } from 'next/router'
import DriverLink from './DriverLink'

interface Props {
  draftSelection: DraftSelectionWithDriverAndConstructor
}

const DraftSelectionRow = ({ draftSelection }: Props) => {
  const { query } = useRouter()
  const season = query.season as string
  const normalized = normalizeConstructorName(draftSelection.constructor.name)
  const { numberBackground, numberText } =
    COLORS_BY_CONSTRUCTOR[season][normalized]
  const roundNumber = Math.floor(draftSelection.pick_number / 8) // draftSelection.pick_number <= 8 ? 1 : 2
  const roundPickNumber = draftSelection.pick_number - 8 * (roundNumber - 1)
  return (
    <li
      className='w-full pr-3 pl-1 py-3 sm:px-8 sm:py-2.5 border-b border-gray-600'
      style={{ backgroundColor: numberBackground }}
    >
      <div className='flex items-center mx-auto space-x-3 max-w-7xl'>
        <div className='flex items-center flex-1 min-w-0'>
          <div
            className='relative sm:h-[75px] sm:w-[75px] w-12 h-12 rounded-full'
            style={{ backgroundColor: numberBackground }}
          >
            <Image
              width={75}
              height={75}
              src={draftSelection.driver.image_url}
              alt={makeName(draftSelection.driver)}
            />
          </div>
          <div className='flex flex-col ml-1 sm:ml-4'>
            <DriverLink driverId={draftSelection.driver.id}>
              <p
                className='pr-[2px] text-2xl font-bold tracking-tight uppercase md:tracking-normal sm:text-4xl sm:hover:underline font-primary'
                style={{ color: numberText }}
              >
                {makeName(draftSelection.driver)}
              </p>
            </DriverLink>
            <ConstructorLink
              constructorId={draftSelection.constructor.id}
              normalizedConstructor={normalized}
            >
              <p
                className='invisible hidden italic font-semibold uppercase hover:underline sm:visible sm:block sm:text-lg font-secondary'
                style={{ color: numberText, lineHeight: 1.25 }}
              >
                {draftSelection.constructor.name}
              </p>
            </ConstructorLink>
          </div>
        </div>
        <p
          className='items-center invisible hidden font-bold uppercase sm:visible sm:block sm:text-3xl md:text-4xl font-primary'
          style={{ color: numberText }}
        >
          {ordinal(draftSelection.pick_number)} Overall Pick
          <p className='text-xl'>
            Round {roundNumber}, Pick {roundPickNumber}
          </p>
        </p>
        <p
          className='inline-flex items-center visible text-xl font-bold uppercase sm:hidden sm:invisible sm:text-2xl font-primary'
          style={{ color: numberText }}
        >
          {ordinal(draftSelection.pick_number)} Pick
        </p>
      </div>
    </li>
  )
}

export default DraftSelectionRow
