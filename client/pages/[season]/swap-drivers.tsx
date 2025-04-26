import Layout from '@/components/Layout'
import { constructorColumns } from '@/helpers/supabase'
import { getSeasonParam, makeName } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import { Data } from '@/pages/api/drivers/swap'
import {
  ConstructorDriverWithJoins,
  ConstructorWithSeason,
  DriverWithSeason,
} from '@/types/Unions'
import { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router'
import { Fragment, useState } from 'react'

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
  const [isSwapping, setIsSwapping] = useState<boolean>(false)
  const [swapResponse, setSwapResponse] = useState<Data>()
  const disableButton =
    !constructorId || !oldDriverId || !newDriverId || isSwapping
  return (
    <Layout documentTitle='Swap Drivers' description='Swap Drivers'>
      <div className='relative mx-2 mt-2 text-xl font-secondary sm:mx-4'>
        <div className='flex flex-col w-full max-w-3xl gap-6 mx-auto'>
          <div className='flex-1 min-w-full'>
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
          <div className='flex-1 min-w-full'>
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
                      {makeName(constructorDrivers.driver_one)}
                    </option>
                    <option value={constructorDrivers.driver_two.id}>
                      {makeName(constructorDrivers.driver_two)}
                    </option>
                  </Fragment>
                ))}
            </select>
          </div>
          <div className='flex-1 min-w-full'>
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
                  {makeName(driver)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className='flex items-center justify-center mt-8'>
          <button
            type='button'
            className='px-4 py-2 mb-2 text-xl text-white bg-green-700 rounded-lg focus:outline-none hover:bg-green-800 focus:ring-4 focus:ring-green-300 me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'
            disabled={disableButton}
            onClick={async () => {
              setIsSwapping(true)
              const resp = await fetch(
                `/api/drivers/swap?season=${season}&constructor_id=${constructorId}&old_driver_id=${oldDriverId}&new_driver_id=${newDriverId}`,
                { method: 'POST' }
              )
              setIsSwapping(false)
              const data = await resp.json()
              setSwapResponse(data)
            }}
          >
            Swap
          </button>
        </div>
        <p className='text-center'>{swapResponse?.message}</p>
      </div>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const season = getSeasonParam(context)
  const { data: constructors } = await supabase
    .from('constructor')
    .select(constructorColumns)
    .eq('season.year', season)
    .order('name', { ascending: true })
    .returns<ConstructorWithSeason[]>()

  const { data: selectedDrivers } = await supabase
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
    .eq('season.year', season)
    .returns<ConstructorDriverWithJoins[]>()

  const { data: allDrivers } = await supabase
    .from('driver')
    .select(
      `
        id,
        first_name,
        last_name,
        is_full_time,
        season!inner(year)`
    )
    .eq('season.year', season)
    .order('last_name', { ascending: true })
    .returns<DriverWithSeason[]>()

  const selectedDriverIds = selectedDrivers!.flatMap((driver) => [
    driver.driver_one.id,
    driver.driver_two.id,
  ])

  const availableDrivers = allDrivers!.filter(
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
