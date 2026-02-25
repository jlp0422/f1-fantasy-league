import Layout from '@/components/Layout'
import { COLORS_BY_CONSTRUCTOR } from '@/constants/index'
import { normalizeConstructorName } from '@/helpers/cars'
import { constructorColumns } from '@/helpers/supabase'
import { getSeasonParam } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import { ConstructorWithSeason } from '@/types/Unions'
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
      <div className='mx-auto max-w-5xl px-4 py-8'>
        <h1 className='text-4xl font-bold font-primary uppercase text-gray-900 mb-2'>
          Select Your Team
        </h1>
        <p className='text-gray-600 font-secondary mb-6'>
          Choose the constructor you manage to unlock driver swap controls.
        </p>

        {currentConstructor && (
          <div className='mb-8 px-4 py-3 bg-gray-800 rounded-lg border border-gray-600 inline-block'>
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

        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-2'>
          {constructors.map((constructor) => {
            const normalized = normalizeConstructorName(constructor.name)
            const colors = COLORS_BY_CONSTRUCTOR[season]?.[normalized]
            const primaryColor = colors?.primary || '#6b7280'
            const isSelected = constructor.id === currentIdentityId

            return (
              <button
                key={constructor.id}
                onClick={() => handleSelect(constructor)}
                className='bg-gray-800 rounded-lg p-6 text-left border-2 transition-all hover:bg-gray-700'
                style={{
                  borderColor: isSelected ? primaryColor : '#4b5563',
                }}
              >
                <p
                  className='text-2xl font-bold font-primary uppercase'
                  style={{ color: primaryColor }}
                >
                  {constructor.name}
                </p>
                <p className='text-gray-100 font-secondary mt-2'>
                  {constructor.team_principal}
                </p>
                <p className='text-gray-400 font-secondary text-sm mt-1 uppercase tracking-wide'>
                  Team Principal
                </p>
              </button>
            )
          })}
        </div>
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
