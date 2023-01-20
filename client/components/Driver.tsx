import { Constructor } from '@/types/Constructor'
import { Driver as DriverType } from '@/types/Driver'
import { DriverRaceResultWithRaceAndSeason } from '@/types/Unions'
import Image from 'next/image'

type CustomDriver = DriverType & { full_name: string; constructor: Constructor }

const getTime = (result: DriverRaceResultWithRaceAndSeason) =>
  new Date(result.race.start_date).getTime()

interface Props {
  driver: CustomDriver
  results: DriverRaceResultWithRaceAndSeason[]
}

const Driver = ({ driver, results }: Props) => {
  const sortedResults = results.sort((a, b) => getTime(a) - getTime(b))
  console.log({ results })
  return (
    <div>
      <p>{driver.full_name}</p>
      <Image
        width={100}
        height={100}
        src={driver.image_url}
        alt={driver.full_name}
      />
      <div>
        {sortedResults.map(result => {
          return (
            <p key={result.id}>
              {result.grid_difference_points + result.finish_position_points}
            </p>
          )
        })}
        </div>
    </div>
  )
}

export default Driver
