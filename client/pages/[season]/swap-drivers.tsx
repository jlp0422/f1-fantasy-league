import Layout from '@/components/Layout'
import { COLORS_BY_CONSTRUCTOR, HAS_IMAGES_BY_SEASON } from '@/constants/index'
import {
  getCloudinaryCarUrl,
  normalizeConstructorName,
  rgbDataURL,
} from '@/helpers/cars'
import { constructorColumns } from '@/helpers/supabase'
import { getSeasonParam, makeName } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import { Data } from '@/pages/api/drivers/swap'
import { IDENTITY_KEY, IdentityValue } from '@/pages/[season]/identity'
import {
  ConstructorDriverWithJoins,
  ConstructorWithSeason,
  DriverWithSeason,
} from '@/types/Unions'
import hexRgb from 'hex-rgb'
import { GetServerSidePropsContext } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

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
  const [driverSearch, setDriverSearch] = useState<string>('')

  useEffect(() => {
    if (!season) return
    if (isAdmin) {
      setIdentityLoaded(true)
      return
    }
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
  }, [season, isAdmin])

  const managingConstructor = constructors.find((c) => c.id === constructorId)
  const currentDrivers = selectedDrivers.find(
    (cd) => cd.constructor_id === constructorId
  )
  const currentDriverList = currentDrivers
    ? [currentDrivers.driver_one, currentDrivers.driver_two]
    : []
  const oldDriver = currentDriverList.find((d) => d?.id === oldDriverId)
  const newDriver = availableDrivers.find((d) => d.id === newDriverId)
  const disableButton =
    !constructorId || !oldDriverId || !newDriverId || isSwapping

  const normalized = managingConstructor
    ? normalizeConstructorName(managingConstructor.name)
    : null
  const colors = normalized ? COLORS_BY_CONSTRUCTOR[season]?.[normalized] : null
  const primaryColor = colors?.primary ?? '#6b7280'
  const { red, blue, green } = hexRgb(primaryColor)
  const hasImages = HAS_IMAGES_BY_SEASON[season]
  const carImageUrl = normalized
    ? hasImages
      ? getCloudinaryCarUrl(normalized, season, { format: 'webp' })
      : rgbDataURL(red, green, blue)
    : rgbDataURL(red, green, blue)

  const filteredAvailableDrivers = availableDrivers.filter((d) =>
    makeName(d).toLowerCase().includes(driverSearch.toLowerCase())
  )

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
      {/* Hero banner */}
      {managingConstructor && (
        <div
          className='bg-cover bg-center w-screen absolute h-80 sm:h-[336px] left-0 top-[64px] sm:top-[72px] shadow-inset-black-7'
          style={{ backgroundImage: `url(${carImageUrl})` }}
        />
      )}

      {/* Managing constructor heading */}
      <div className='relative mb-6'>
        <h1 className='text-4xl font-bold font-primary uppercase text-gray-900 sm:text-gray-200 md:text-5xl lg:text-6xl'>
          {managingConstructor ? managingConstructor.name : 'Swap Drivers'}
        </h1>
        {managingConstructor && (
          <p className='text-2xl leading-none tracking-wide text-gray-600 font-tertiary sm:text-gray-300'>
            Managing
          </p>
        )}
      </div>

      {/* Admin-only constructor picker */}
      {isAdmin && (
        <div className='relative mb-6'>
          <select
            value={constructorId ?? ''}
            onChange={(ev) => {
              setConstructorId(+ev.target.value)
              setOldDriverId(undefined)
              setNewDriverId(undefined)
              setSwapResponse(undefined)
            }}
            className='bg-gray-700 text-gray-100 border border-gray-600 rounded-lg p-3 font-secondary text-lg'
          >
            <option value='' disabled>
              Select Constructor
            </option>
            {constructors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className='relative grid grid-cols-1 md:grid-cols-3 gap-6 w-full'>
        {/* Column 1: Drop a driver */}
        <div className='bg-gray-800 rounded-lg p-6 border border-gray-700'>
          <p className='text-gray-500 font-secondary text-sm uppercase tracking-wide mb-2'>
            Step 1
          </p>
          <h3 className='mb-4 text-2xl font-secondary text-gray-100'>Drop</h3>
          <div className='flex flex-col gap-3'>
            {currentDriverList.map((driver) => {
              if (!driver) return null
              const isSelected = driver.id === oldDriverId
              return (
                <button
                  key={driver.id}
                  onClick={() => {
                    setOldDriverId(isSelected ? undefined : driver.id)
                    setNewDriverId(undefined)
                    setSwapResponse(undefined)
                  }}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-gray-700 border-2 ${
                    isSelected ? 'border-red-500' : 'border-transparent'
                  }`}
                >
                  <div className='relative rounded overflow-hidden w-12 h-12 flex-shrink-0 bg-gray-700'>
                    <Image
                      src={driver.image_url ?? ''}
                      alt={makeName(driver)}
                      fill
                      className='object-cover object-top'
                    />
                  </div>
                  <span className='font-primary uppercase text-gray-100 text-lg flex-1 text-left'>
                    {makeName(driver)}
                  </span>
                  <span
                    className='text-2xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0'
                    style={{
                      backgroundColor: isSelected ? '#ef4444' : '#4b5563',
                      color: '#fff',
                    }}
                  >
                    −
                  </span>
                </button>
              )
            })}
            {currentDriverList.length === 0 && (
              <p className='text-gray-500 font-secondary text-sm'>
                Select a constructor first
              </p>
            )}
          </div>
        </div>

        {/* Column 2: Add a driver */}
        <div className='bg-gray-800 rounded-lg p-6 border border-gray-700'>
          <p className='text-gray-500 font-secondary text-sm uppercase tracking-wide mb-2'>
            Step 2
          </p>
          <h3 className='mb-4 text-2xl font-secondary text-gray-100'>Add</h3>
          <input
            type='text'
            placeholder='Search...'
            value={driverSearch}
            onChange={(e) => setDriverSearch(e.target.value)}
            className='mb-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg p-2 font-secondary text-sm w-full placeholder-gray-500'
          />
          <div className='flex flex-col gap-2 max-h-64 overflow-y-auto pr-1'>
            {filteredAvailableDrivers.map((driver) => {
              const isSelected = driver.id === newDriverId
              return (
                <button
                  key={driver.id}
                  disabled={!oldDriverId}
                  onClick={() => {
                    setNewDriverId(isSelected ? undefined : driver.id)
                    setSwapResponse(undefined)
                  }}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed border-2 ${
                    isSelected ? 'border-green-500' : 'border-transparent'
                  }`}
                >
                  <div className='relative rounded overflow-hidden w-10 h-10 flex-shrink-0 bg-gray-700'>
                    <Image
                      src={driver.image_url ?? ''}
                      alt={makeName(driver)}
                      fill
                      className='object-cover object-top'
                    />
                  </div>
                  <span className='font-primary uppercase text-gray-100 text-base flex-1 text-left'>
                    {makeName(driver)}
                  </span>
                  <span
                    className='text-xl font-bold leading-none w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0'
                    style={{
                      backgroundColor: isSelected ? '#22c55e' : '#4b5563',
                      color: '#fff',
                    }}
                  >
                    +
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Column 3: Confirm */}
        <div className='bg-gray-800 rounded-lg p-6 border border-gray-700 flex flex-col'>
          <p className='text-gray-500 font-secondary text-sm uppercase tracking-wide mb-2'>
            Step 3
          </p>
          <h3 className='mb-4 text-2xl font-secondary text-gray-100'>
            Confirm
          </h3>
          <div className='flex flex-col gap-4 flex-1'>
            <div className='flex items-center gap-3'>
              <div className='relative rounded overflow-hidden w-12 h-12 flex-shrink-0 bg-gray-700'>
                {oldDriver && (
                  <Image
                    src={oldDriver.image_url ?? ''}
                    alt={makeName(oldDriver)}
                    fill
                    className='object-cover object-top'
                  />
                )}
              </div>
              <span className='font-primary uppercase font-bold text-red-400 text-lg flex-1'>
                {oldDriver ? (
                  makeName(oldDriver)
                ) : (
                  <span className='text-gray-600'>—</span>
                )}
              </span>
            </div>
            <span className='text-gray-500 text-xl'>↓</span>
            <div className='flex items-center gap-3'>
              <div className='relative rounded overflow-hidden w-12 h-12 flex-shrink-0 bg-gray-700'>
                {newDriver && (
                  <Image
                    src={newDriver.image_url ?? ''}
                    alt={makeName(newDriver)}
                    fill
                    className='object-cover object-top'
                  />
                )}
              </div>
              <span className='font-primary uppercase font-bold text-green-400 text-lg flex-1'>
                {newDriver ? (
                  makeName(newDriver)
                ) : (
                  <span className='text-gray-600'>—</span>
                )}
              </span>
            </div>
          </div>
          <button
            type='button'
            disabled={disableButton}
            onClick={async () => {
              setIsSwapping(true)
              try {
                const resp = await fetch(
                  `/api/drivers/swap?season=${season}&constructor_id=${constructorId}&old_driver_id=${oldDriverId}&new_driver_id=${newDriverId}${
                    isAdmin ? '&admin=true' : ''
                  }`,
                  { method: 'POST' }
                )
                const data = await resp.json()
                setSwapResponse(data)
              } catch {
                setSwapResponse({
                  success: false,
                  message: 'Network error, please try again',
                })
              } finally {
                setIsSwapping(false)
              }
            }}
            className='mt-6 w-full px-6 py-3 text-xl text-white bg-green-700 rounded-lg hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed font-secondary'
          >
            {isSwapping ? 'Swapping...' : 'Confirm Swap'}
          </button>
          {swapResponse?.message && (
            <p
              className={`text-base font-secondary mt-3 ${
                swapResponse.success ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {swapResponse.success ? '✓ ' : '✗ '}
              {swapResponse.message}
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const season = getSeasonParam(context)

  const [
    { data: constructors },
    { data: selectedDrivers },
    { data: allDrivers },
  ] = await Promise.all([
    supabase
      .from('constructor')
      .select(constructorColumns)
      .eq('season.year', season)
      .order('name', { ascending: true })
      .returns<ConstructorWithSeason[]>(),
    supabase
      .from('constructor_driver')
      .select(
        `
        id,
        driver_one:driver_one_id(
          id,
          first_name,
          last_name,
          image_url
        ),
        driver_two:driver_two_id(
          id,
          first_name,
          last_name,
          image_url
        ),
        constructor_id,
        season!inner(year)`
      )
      .eq('season.year', season)
      .returns<ConstructorDriverWithJoins[]>(),
    supabase
      .from('driver')
      .select(
        `
        id,
        first_name,
        last_name,
        image_url,
        is_full_time,
        season!inner(year)`
      )
      .eq('season.year', season)
      .order('last_name', { ascending: true })
      .returns<DriverWithSeason[]>(),
  ])

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
