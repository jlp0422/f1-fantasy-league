import { Season } from '@/types/Season'
import Layout from '@/components/Layout'
import { sortArray } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import Link from 'next/link'

interface Colors {
  bg: string
  hover: string
}

const seasonColors: Record<string, Colors> = {
  2022: {
    bg: 'bg-cyan-600',
    hover: 'hover:bg-cyan-800',
  },
  2023: {
    bg: 'bg-orange-600',
    hover: 'hover:bg-orange-800',
  },
}

interface Props {
  seasons: Season[]
}

const HomePage = ({ seasons }: Props) => {
  return (
    <Layout documentTitle="Home" fullWidth>
      <div className="flex flex-col h-full">
        {seasons.map((season) => {
          const color = seasonColors[season.year]
          return (
            <Link
              key={season.id}
              href={{
                pathname: '/[season]/standings',
                query: { season: season.year },
              }}
            >
              <a className={`py-14 ${color.bg} ${color.hover}`}>
                <h2 className="px-4 font-bold text-center text-gray-100 uppercase text-7xl font-primary">
                  {season.year}
                </h2>
              </a>
            </Link>
          )
        })}
      </div>
    </Layout>
  )
}

export async function getStaticProps() {
  const { data: seasons } = (await supabase.from('season').select('*')) as {
    data: Season[]
  }

  return {
    props: {
      seasons: sortArray(seasons, (a, b) => b.year - a.year),
    },
  }
}

export default HomePage
