import Layout from 'components/Layout'
import { supabase } from 'lib/database'
import Image from 'next/image'

const DriversPage = ({ drivers }) => {
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
  const { data } = await supabase.from('season').select('*')

  return {
    paths: data.map((season) => ({
      params: {
        season: season.year.toString(),
      },
    })),
    fallback: false,
  }
}

const makeName = (driver) => `${driver.first_name} ${driver.last_name}`

export async function getStaticProps({ params }) {
  const driverCols =
    'id, abbreviation, first_name, last_name, number, image_url'
  const { data: constructorDrivers } = await supabase
    .from('constructor_driver')
    .select(
      `id,
      constructor(id, name),
      driver_one:driver_one_id(${driverCols}),
      driver_two:driver_two_id(${driverCols}),
      season!inner(year)`
    )
    .eq('season.year', params.season)

  const drivers = constructorDrivers.reduce(
    (memo, { driver_one, driver_two, constructor }) => {
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
