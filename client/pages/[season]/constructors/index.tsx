import { Constructor } from '@/types/Constructor'
import { Season } from '@/types/Season'
import { ConstructorWithSeason } from '@/types/Unions'
import ConstructorLink from '@/components/ConstructorLink'
import Layout from '@/components/Layout'
import { getCloudinaryCarUrl, normalizeConstructorName } from '@/helpers/cars'
import { supabase } from '@/lib/database'
import { GetStaticPropsContext } from 'next'
import { makeSeasonPaths } from '@/helpers/routes'
import { constructorColumns } from '@/helpers/supabase'
import { useRouter } from 'next/router'

interface Props {
  constructors: Constructor[]
}

const ConstructorsPage = ({ constructors }: Props) => {
  const { query } = useRouter()
  const season = query.season as string
  return (
    <Layout documentTitle='Constructors'>
      <div className='grid grid-cols-1 gap-y-8 gap-x-4 justify-items-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {constructors.map((constructor) => {
          const normalized = normalizeConstructorName(constructor.name)
          return (
            <ConstructorLink
              normalizedConstructor={normalized}
              constructorId={constructor.id}
              key={constructor.id}
            >
              <div className='relative flex flex-col items-center justify-center sm:div-children:hover:shadow-inset-black-7'>
                <div
                  className='bg-contain rounded-lg h-72 w-72 shadow-inset-black-6'
                  style={{
                    backgroundImage: `url(${getCloudinaryCarUrl(
                      normalized,
                      season,
                      {
                        format: 'webp',
                      }
                    )})`,
                  }}
                />
                <h2 className='absolute px-4 text-4xl font-bold text-center text-gray-100 uppercase font-primary'>
                  {constructor.name}
                </h2>
              </div>
            </ConstructorLink>
          )
        })}
      </div>
    </Layout>
  )
}

export async function getStaticPaths() {
  const { data } = await supabase.from('season').select('*').returns<Season[]>()

  return makeSeasonPaths(data!)
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const { data: constructors } = await supabase
    .from('constructor')
    .select(constructorColumns)
    .eq('season.year', params?.season)
    .order('name')
    .returns<ConstructorWithSeason[]>()

  return {
    props: {
      constructors,
    },
  }
}

export default ConstructorsPage
