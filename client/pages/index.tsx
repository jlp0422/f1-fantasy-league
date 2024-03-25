import { Season } from '@/types/Season'
import Layout from '@/components/Layout'
import { sortArray } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import Link from 'next/link'
import { COLORS_BY_SEASON } from '../constants'

interface Props {
  seasons: Season[]
}

const HomePage = ({ seasons }: Props) => {
  return (
    <Layout documentTitle='Home' fullWidth>
      <div className='flex flex-col h-full'>
        {seasons.map((season) => {
          const color = COLORS_BY_SEASON[season.year]
          return (
            <Link
              key={season.id}
              href={{
                pathname: '/[season]/standings',
                query: { season: season.year },
              }}
              className={`py-14 ${color.bg} ${color.hover}`}
              passHref
            >
              <h2 className='px-4 font-bold text-center text-gray-100 uppercase text-7xl font-primary'>
                {season.year}
              </h2>
            </Link>
          )
        })}
      </div>
    </Layout>
  )
}

export async function getStaticProps() {
  const { data: seasons } = await supabase
    .from('season')
    .select('*')
    .returns<Season[]>()

  return {
    props: {
      seasons: sortArray(seasons!, (a, b) => b.year - a.year),
    },
  }
}

export default HomePage
