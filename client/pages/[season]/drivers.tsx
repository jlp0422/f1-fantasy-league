import { Constructor } from '@/types/Constructor'
import { Driver } from '@/types/Driver'
import { Season } from '@/types/Season'
import { ConstructorDriverWithJoins } from '@/types/Unions'
import Layout from 'components/Layout'
import { supabase } from 'lib/database'
import { GetStaticPropsContext } from 'next'
import Image from 'next/image'

type CustomDriver = Driver & { full_name: string; constructor: Constructor }

interface Props {
  drivers: CustomDriver[]
}

const DriversPage = ({ drivers }: Props) => {
  console.log({ drivers })
  if (!drivers) {
    return null
  }
  return (
    <Layout documentTitle="Drivers">
      <div className="flex flex-col">
        {drivers.map((driver) => {
          return (
            <div key={driver.id}>
              <p>{driver.full_name}</p>
              <Image
                width={100}
                height={100}
                src={driver.image_url}
                alt={driver.full_name}
              />
            </div>
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

const makeName = (driver: Driver) => `${driver.first_name} ${driver.last_name}`

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
    },
  }
}

export default DriversPage
