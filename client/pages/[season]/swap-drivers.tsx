import Layout from '@/components/Layout'
import { makeSeasonPaths } from '@/helpers/routes'
import { constructorColumns } from '@/helpers/supabase'
import { supabase } from '@/lib/database'
import { Season } from '@/types/Season'
import {
  ConstructorDriverWithJoins,
  ConstructorWithSeason,
  DriverWithSeason,
} from '@/types/Unions'
import { GetStaticPropsContext } from 'next'
import { Fragment, useState } from 'react'
import { Data } from '@/pages/api/drivers/swap'
import { useRouter } from 'next/router'

interface Props {
  constructors: ConstructorWithSeason[]
  selectedDrivers: ConstructorDriverWithJoins[]
  availableDrivers: DriverWithSeason[]
}

const SwapDrivers = ({
  selectedDrivers,
  constructors,
  availableDrivers,
}: Props) => {
  const { query } = useRouter()
  const season = query.season
  const [constructorId, setConstructorId] = useState<number>()
  const [oldDriverId, setOldDriverId] = useState<number>()
  const [newDriverId, setNewDriverId] = useState<number>()
  const [swapResponse, setSwapResponse] = useState<Data>()
  console.log({ swapResponse })
  return (
    <Layout documentTitle='Swap Drivers' description='Swap Drivers'>
      <div className='relative mx-2 mt-2 text-xl font-secondary sm:mx-4'>
        <div className='flex flex-wrap items-center justify-between w-full gap-8'>
          <div className='flex-1'>
            <h3 className='mb-2 text-2xl'>Constructor</h3>
            <select
              name='Constructor'
              id='Constructor'
              defaultValue=''
              onChange={(ev) => setConstructorId(+ev.target.value)}
              className='w-full px-1'
            >
              <option key='default' value='' disabled>
                Select
              </option>
              {constructors.map((constructor) => (
                <option key={constructor.id} value={constructor.id}>
                  {constructor.name}
                </option>
              ))}
            </select>
          </div>
          <div className='flex-1'>
            <h3 className='mb-2 text-2xl'>Driver to Replace</h3>
            <select
              name='Old Driver'
              id='Old Driver'
              defaultValue=''
              disabled={!constructorId}
              onChange={(ev) => setOldDriverId(+ev.target.value)}
              className='w-full px-1'
            >
              <option key='default' value='' disabled>
                Select
              </option>
              {selectedDrivers
                .filter(
                  (constructorDrivers) =>
                    constructorDrivers.constructor_id === constructorId
                )
                .map((constructorDrivers) => (
                  <Fragment key={constructorDrivers.constructor_id}>
                    <option value={constructorDrivers.driver_one.id}>
                      {constructorDrivers.driver_one.first_name}{' '}
                      {constructorDrivers.driver_one.last_name}
                    </option>
                    <option value={constructorDrivers.driver_two.id}>
                      {constructorDrivers.driver_two.first_name}{' '}
                      {constructorDrivers.driver_two.last_name}
                    </option>
                  </Fragment>
                ))}
            </select>
          </div>
          <div className='flex-1'>
            <h3 className='mb-2 text-2xl'>New Driver</h3>
            <select
              name='New Driver'
              id='New Driver'
              defaultValue=''
              disabled={!constructorId || !oldDriverId}
              onChange={(ev) => setNewDriverId(+ev.target.value)}
              className='w-full px-1'
            >
              <option key='default' value='' disabled>
                Select
              </option>
              {availableDrivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.first_name} {driver.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className='flex items-center justify-center mt-4'>
          <button
            type='button'
            onClick={async () => {
              const resp = await fetch(
                `/api/drivers/swap?season=${season}&constructor_id=${constructorId}&old_driver_id=${oldDriverId}&new_driver_id=${newDriverId}`,
                {
                  method: 'POST',
                }
              )
              const data = await resp.json()
              setSwapResponse(data)
            }}
            className='px-4 py-2 mb-2 text-xl text-white bg-green-700 rounded-lg focus:outline-none hover:bg-green-800 focus:ring-4 focus:ring-green-300 me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'
          >
            Swap
          </button>
        </div>
      </div>
    </Layout>
  )
}

export async function getStaticPaths() {
  const { data } = (await supabase.from('season').select('*')) as {
    data: Season[]
  }

  return makeSeasonPaths(data)
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const { data: constructors } = (await supabase
    .from('constructor')
    .select(constructorColumns)
    .eq('season.year', params?.season)) as { data: ConstructorWithSeason[] }

  const { data: selectedDrivers } = (await supabase
    .from('constructor_driver')
    .select(
      `
        id,
        driver_one:driver_one_id(
          id,
          first_name,
          last_name
        ),
        driver_two:driver_two_id(
          id,
          first_name,
          last_name
        ),
        constructor_id,
        season!inner(year)`
    )
    .eq('season.year', params?.season)) as {
    data: ConstructorDriverWithJoins[]
  }
  const { data: allDrivers } = (await supabase
    .from('driver')
    .select(
      `
        id,
        first_name,
        last_name,
        is_full_time,
        season!inner(year)`
    )
    .eq('season.year', params?.season)
    .eq('is_full_time', true)) as {
    data: DriverWithSeason[]
  }

  const selectedDriverIds = selectedDrivers.flatMap((driver) => [
    driver.driver_one.id,
    driver.driver_two.id,
  ])

  const availableDrivers = allDrivers.filter(
    (driver) => !selectedDriverIds.includes(driver.id)
  )

  return {
    props: {
      constructors,
      selectedDrivers,
      availableDrivers,
    },
  }
}

export default SwapDrivers
