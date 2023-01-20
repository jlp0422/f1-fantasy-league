import Driver from '@/components/Driver'
import { Constructor } from '@/types/Constructor'
import { Driver as DriverType } from '@/types/Driver'
import { Season } from '@/types/Season'
import {
  ConstructorDriverWithJoins,
  DriverRaceResultWithRaceAndSeason,
  RaceWithSeason,
} from '@/types/Unions'
import Layout from 'components/Layout'
import { supabase } from 'lib/database'
import { GetStaticPropsContext } from 'next'

type CustomDriver = DriverType & { full_name: string; constructor: Constructor }

interface Props {
  drivers: CustomDriver[]
  resultsByDriverId: Record<string, DriverRaceResultWithRaceAndSeason[]>
  races: RaceWithSeason[]
}

const DriversPage = ({ drivers, resultsByDriverId, races }: Props) => {
  console.log({ drivers, resultsByDriverId, races })
  if (!drivers) {
    return null
  }
  return (
    <Layout documentTitle="Drivers">
      <div className="flex flex-col">
        {drivers.slice(0, 1).map((driver) => {
          return (
            <Driver
              key={driver.id}
              driver={driver}
              results={resultsByDriverId[driver.id]}
            />
          )
        })}
      </div>
    </Layout>
  )
}

export async function getStaticPaths() {
  const { data } = (await supabase.from('season').select('*')) as {
    data: Season[]
  }

  return {
    paths: data.map((season) => ({
      params: {
        season: season.year.toString(),
      },
    })),
    fallback: false,
  }
}

const makeName = (driver: DriverType) =>
  `${driver.first_name} ${driver.last_name}`

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const driverCols =
    'id, abbreviation, first_name, last_name, number, image_url'
  const { data: constructorDrivers } = (await supabase
    .from('constructor_driver')
    .select(
      `id,
      constructor(id, name),
      driver_one:driver_one_id(${driverCols}),
      driver_two:driver_two_id(${driverCols}),
      season!inner(year)`
    )
    .eq('season.year', params?.season)) as {
    data: ConstructorDriverWithJoins[]
  }

  const { data: races } = (await supabase
    .from('race')
    .select('id, location, country, start_date, season!inner(year)')
    .eq('season.year', params?.season)
    .order('start_date', { ascending: true })) as { data: RaceWithSeason[] }

  const { data: raceResults } = (await supabase
    .from('driver_race_result')
    .select(
      `
      id,
      finish_position_points,
      grid_difference_points,
      race!inner(
        id,
        name,
        location,
        start_date,
        season!inner(
          id,
          year
        )
      ),
      driver_id
    `
    )
    .eq('race.season.year', params?.season)) as {
    data: DriverRaceResultWithRaceAndSeason[]
  }

  const resultsByDriverId = raceResults?.reduce(
    (memo: Record<string, DriverRaceResultWithRaceAndSeason[]>, result) => {
      const driverId = result.driver_id.toString()
      if (memo[driverId]) {
        memo[driverId].push(result)
      } else {
        memo[driverId] = [result]
      }
      return memo
    },
    {}
  )

  const drivers = constructorDrivers.reduce(
    (memo: CustomDriver[], { driver_one, driver_two, constructor }) => {
      return memo.concat([
        {
          ...driver_one,
          full_name: makeName(driver_one),
          constructor: constructor,
        },
        {
          ...driver_two,
          full_name: makeName(driver_two),
          constructor: constructor,
        },
      ])
    },
    []
  )

  return {
    props: {
      drivers,
      races,
      resultsByDriverId,
    },
  }
}

export default DriversPage
