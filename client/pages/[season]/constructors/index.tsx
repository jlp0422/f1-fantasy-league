import { Constructor } from '@/types/Constructor'
import { Season } from '@/types/Season'
import ConstructorLink from 'components/ConstructorLink'
import Layout from 'components/Layout'
import { getCloudinaryCarUrl, normalizeConstructorName } from 'helpers/cars'
import { supabase } from 'lib/database'
import { GetStaticPropsContext } from 'next'

interface Props {
  constructors: Constructor[]
}

const ConstructorsPage = ({ constructors }: Props) => {
  return (
    <Layout documentTitle="Constructors">
      <div className="grid grid-cols-1 gap-y-8 gap-x-4 justify-items-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {constructors.map((constructor) => {
          const normalized = normalizeConstructorName(constructor.name)
          return (
            <ConstructorLink
              normalizedConstructor={normalized}
              constructorId={constructor.id}
              key={constructor.id}
            >
              <a className="relative flex flex-col items-center justify-center sm:div-children:hover:shadow-inset-black-7">
                <div
                  className="bg-contain rounded-lg h-72 w-72 shadow-inset-black-6"
                  style={{
                    backgroundImage: `url(${getCloudinaryCarUrl(normalized, {
                      format: 'webp',
                    })})`,
                  }}
                />
                <h2 className="absolute px-4 text-4xl font-bold text-center text-gray-100 uppercase font-primary">
                  {constructor.name}
                </h2>
              </a>
            </ConstructorLink>
          )
        })}
      </div>
    </Layout>
  )
}

export async function getStaticPaths() {
  const { data: seasons } = await supabase.from('season').select('*')

  return {
    paths: (seasons as Season[]).map((season) => ({
      params: {
        season: season.year.toString(),
      },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const { data: constructors } = await supabase
    .from('constructor')
    .select('id, name, season!inner(year)')
    .eq('season.year', params?.season)
    .order('name')

  return {
    props: {
      constructors,
    },
  }
}

export default ConstructorsPage