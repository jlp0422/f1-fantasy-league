import Layout from '@/components/Layout'
import { COLORS_BY_CONSTRUCTOR, HAS_IMAGES_BY_SEASON } from '@/constants/index'
import {
  getCloudinaryCarUrl,
  normalizeConstructorName,
  rgbDataURL,
} from '@/helpers/cars'
import { constructorColumns } from '@/helpers/supabase'
import { getSeasonParam } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import { ConstructorWithSeason } from '@/types/Unions'
import hexRgb from 'hex-rgb'
import { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export const IDENTITY_KEY = 'f1fl_identity'

export interface IdentityValue {
  id: number
  normalized: string
}

interface Props {
  constructors: ConstructorWithSeason[]
}

const IdentityPage = ({ constructors }: Props) => {
  const router = useRouter()
  const { query } = router
  const season = query.season as string
  const redirect = (query.redirect as string) || `/${season}/standings`
  const hasImages = HAS_IMAGES_BY_SEASON[season]
  const [currentIdentityId, setCurrentIdentityId] = useState<number | null>(
    null
  )

  useEffect(() => {
    const stored = localStorage.getItem(IDENTITY_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const val: IdentityValue | undefined = parsed[season]
      if (val?.id) setCurrentIdentityId(val.id)
    }
  }, [season])

  const handleSelect = (constructor: ConstructorWithSeason) => {
    const stored = localStorage.getItem(IDENTITY_KEY)
    const current = stored ? JSON.parse(stored) : {}
    const value: IdentityValue = {
      id: constructor.id,
      normalized: normalizeConstructorName(constructor.name),
    }
    localStorage.setItem(
      IDENTITY_KEY,
      JSON.stringify({ ...current, [season]: value })
    )
    router.replace(redirect)
  }

  const currentConstructor = constructors.find(
    (c) => c.id === currentIdentityId
  )

  return (
    <Layout
      documentTitle='Select Your Team'
      description='Select your constructor identity'
    >
      <div className='mb-6'>
        <h1 className='text-4xl font-bold font-primary uppercase text-gray-900 mb-1'>
          Select Your Team
        </h1>
        <p className='text-gray-600 font-secondary'>
          Choose the constructor you manage to unlock driver swap controls.
        </p>
      </div>

      {currentConstructor && (
        <div className='mb-6 px-4 py-3 bg-gray-800 rounded-lg border border-gray-600 inline-block'>
          <p className='text-gray-400 font-secondary text-sm uppercase tracking-wide'>
            Currently Managing
          </p>
          <p className='text-gray-100 font-primary uppercase text-2xl'>
            {currentConstructor.name}
          </p>
          <p className='text-gray-300 font-secondary text-sm'>
            {currentConstructor.team_principal}
          </p>
        </div>
      )}

      <div className='grid grid-cols-1 gap-y-8 gap-x-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {constructors.map((constructor) => {
          const normalized = normalizeConstructorName(constructor.name)
          const { primary } = COLORS_BY_CONSTRUCTOR[season][normalized]
          const { red, blue, green } = hexRgb(primary)
          const imageUrl = hasImages
            ? getCloudinaryCarUrl(normalized, season, { format: 'webp' })
            : rgbDataURL(red, green, blue)
          const isSelected = constructor.id === currentIdentityId

          return (
            <button
              key={constructor.id}
              onClick={() => handleSelect(constructor)}
              className='relative flex flex-col items-center justify-center group w-fit'
            >
              <div
                className='bg-contain rounded-lg h-72 w-72 shadow-inset-black-6 group-hover:shadow-inset-black-7 transition-shadow'
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  outline: isSelected ? `3px solid ${primary}` : undefined,
                  outlineOffset: isSelected ? '3px' : undefined,
                }}
              />
              <h2 className='absolute px-4 text-4xl font-bold text-center text-gray-100 uppercase font-primary'>
                {constructor.name}
              </h2>
              {isSelected && (
                <span
                  className='mt-2 text-sm font-secondary uppercase tracking-widest font-bold'
                  style={{ color: primary }}
                >
                  ✓ Selected
                </span>
              )}
              {!isSelected && (
                <span className='mt-2 text-sm font-secondary uppercase tracking-widest text-gray-500'>
                  {constructor.team_principal}
                </span>
              )}
            </button>
          )
        })}
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
    .order('name')
    .returns<ConstructorWithSeason[]>()

  return {
    props: {
      constructors: constructors ?? [],
    },
  }
}

export default IdentityPage
