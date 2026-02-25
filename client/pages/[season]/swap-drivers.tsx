import Layout from '@/components/Layout'
import { IDENTITY_KEY, IdentityValue } from '@/pages/[season]/identity'
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
import { Fragment, useEffect, useState } from 'react'

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
  const router = useRouter()
  const { query } = router
  const season = query.season as string
  const isAdmin = query.admin === 'true'
  const [constructorId, setConstructorId] = useState<number | undefined>()
  const [oldDriverId, setOldDriverId] = useState<number | undefined>()
  const [newDriverId, setNewDriverId] = useState<number | undefined>()
  const [isSwapping, setIsSwapping] = useState<boolean>(false)
  const [swapResponse, setSwapResponse] = useState<Data>()
  const [identityLoaded, setIdentityLoaded] = useState<boolean>(false)

  useEffect(() => {
    if (!season) return
    const stored = localStorage.getItem(IDENTITY_KEY)
    if (!stored) {
      router.replace(`/${season}/identity?redirect=/${season}/swap-drivers`)
      return
    }
    const parsed = JSON.parse(stored)
    const val: IdentityValue | undefined = parsed[season]
    if (!val?.id) {
      router.replace(`/${season}/identity?redirect=/${season}/swap-drivers`)
      return
    }
    setConstructorId(val.id)
    setIdentityLoaded(true)
  }, [season])

  const disableButton =
    !constructorId || !oldDriverId || !newDriverId || isSwapping
  const managingConstructor = constructors.find((c) => c.id === constructorId)

  if (!identityLoaded) {
    return (
      <Layout documentTitle='Swap Drivers' description='Swap Drivers'>
        <div className='flex items-center justify-center h-64'>
          <p className='text-gray-400 font-secondary text-xl'>Loading...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout documentTitle='Swap Drivers' description='Swap Drivers'>
      <div className='relative mx-2 mt-4 sm:mx-4'>
        {managingConstructor && (
          <div className='mb-8 flex flex-col items-center text-center'>
            <div className='px-8 py-5 bg-gray-800 rounded-lg border border-gray-600'>
              <p className='text-gray-400 font-secondary text-sm uppercase tracking-wide mb-1'>
                Managing
              </p>
              <p className='text-gray-100 font-primary uppercase text-4xl'>
                {managingConstructor.name}
              </p>
              <p className='text-gray-300 font-secondary text-lg mt-1'>
                {managingConstructor.team_principal}
              </p>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto'>
          <div className='bg-gray-800 rounded-lg p-6 border border-gray-700'>
            <p className='text-gray-500 font-secondary text-sm uppercase tracking-wide mb-2'>
              Step 1
            </p>
            <h3 className='mb-4 text-2xl font-secondary text-gray-100'>
              Constructor
            </h3>
            <select
              name='Constructor'
              id='Constructor'
              value={constructorId ?? ''}
              disabled={!isAdmin}
              onChange={(ev) => {
                setConstructorId(+ev.target.value)
                setOldDriverId(undefined)
                setNewDriverId(undefined)
                setSwapResponse(undefined)
              }}
              className='bg-gray-700 text-gray-100 border border-gray-600 rounded-lg w-full p-3 font-secondary text-lg disabled:opacity-70 disabled:cursor-default'
            >
              <option value='' disabled>
                Select
              </option>
              {constructors.map((constructor) => (
                <option key={constructor.id} value={constructor.id}>
                  {constructor.name}
                </option>
              ))}
            </select>
          </div>

          <div className='bg-gray-800 rounded-lg p-6 border border-gray-700'>
            <p className='text-gray-500 font-secondary text-sm uppercase tracking-wide mb-2'>
              Step 2
            </p>
            <h3 className='mb-4 text-2xl font-secondary text-gray-100'>
              Driver to Replace
            </h3>
            <select
              name='Old Driver'
              id='Old Driver'
              value={oldDriverId ?? ''}
              disabled={!constructorId}
              onChange={(ev) => {
                setOldDriverId(+ev.target.value)
                setNewDriverId(undefined)
                setSwapResponse(undefined)
              }}
              className='bg-gray-700 text-gray-100 border border-gray-600 rounded-lg w-full p-3 font-secondary text-lg disabled:opacity-50'
            >
              <option value='' disabled>
                Select
              </option>
              {selectedDrivers
                .filter((cd) => cd.constructor_id === constructorId)
                .map((cd) => (
                  <Fragment key={cd.constructor_id}>
                    <option value={cd.driver_one.id}>
                      {makeName(cd.driver_one)}
                    </option>
                    <option value={cd.driver_two.id}>
                      {makeName(cd.driver_two)}
                    </option>
                  </Fragment>
                ))}
            </select>
          </div>

          <div className='bg-gray-800 rounded-lg p-6 border border-gray-700'>
            <p className='text-gray-500 font-secondary text-sm uppercase tracking-wide mb-2'>
              Step 3
            </p>
            <h3 className='mb-4 text-2xl font-secondary text-gray-100'>
              New Driver
            </h3>
            <select
              name='New Driver'
              id='New Driver'
              value={newDriverId ?? ''}
              disabled={!constructorId || !oldDriverId}
              onChange={(ev) => {
                setNewDriverId(+ev.target.value)
                setSwapResponse(undefined)
              }}
              className='bg-gray-700 text-gray-100 border border-gray-600 rounded-lg w-full p-3 font-secondary text-lg disabled:opacity-50'
            >
              <option value='' disabled>
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
            className='px-6 py-3 mb-2 text-xl text-white bg-green-700 rounded-lg focus:outline-none hover:bg-green-800 focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-secondary'
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
            {isSwapping ? 'Swapping...' : 'Swap'}
          </button>
        </div>

        {swapResponse?.message && (
          <p
            className={`text-center text-xl font-secondary mt-2 ${
              swapResponse.success ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {swapResponse.success ? '✓ ' : '✗ '}
            {swapResponse.message}
          </p>
        )}
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
