import { constructorColumns, driverRaceResultColumns } from '@/helpers/supabase'
import { supabase } from '@/lib/database'
import { Driver } from '@/types/Driver'
import {
  ConstructorDriverWithJoins,
  DriverRaceResultWithJoins,
} from '@/types/Unions'
import { GetStaticPropsContext } from 'next'

interface Props {
  driver: Driver
  raceResults: DriverRaceResultWithJoins
  currentDrivers: ConstructorDriverWithJoins[]
}

const DriverPage = ({ driver, raceResults, currentDrivers }: Props) => {
  console.log({ driver, raceResults, currentDrivers })
  return <div />
}

export async function getStaticPaths() {
  const { data: drivers } = (await supabase
    .from('driver')
    .select('id, season!inner(id, year)')) as { data: any[] }

  return {
    paths: drivers.map((driver) => ({
      params: {
        id: driver.id.toString(),
        season: driver.season.year.toString(),
      },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const { data: driver } = await supabase
    .from('driver')
    .select(
      `
    id,
    first_name,
    last_name,
    number,
    abbreviation,
    constructor_name,
    image_url
    `
    )
    .eq('id', params?.id)
    .limit(1)
    .single()

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
    )
  `
    )
    .eq('race.season.year', params?.season)
    .eq('driver_id', params?.id)
    .order('start_date', { ascending: true, foreignTable: 'race' })) as {
    data: DriverRaceResultWithJoins[]
  }

  const { data: currentDrivers } = (await supabase
    .from('constructor_driver')
    .select(
      `
      id,
      driver_one:driver_one_id(
        id,
      ),
      driver_two:driver_two_id(
        id,
      ),
      constructor!inner(${constructorColumns}),
      season!inner(year)`
    )
    .eq('season.year', params?.season)
    .or(`driver_one_id.${params?.id},driver_two_id.${params?.id}`)) as {
    data: ConstructorDriverWithJoins[]
  }

  return {
    props: {
      driver,
      raceResults,
      currentDrivers,
    },
  }
}

export default DriverPage
