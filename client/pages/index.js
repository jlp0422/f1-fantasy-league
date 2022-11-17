import Layout from 'components/Layout'
import { sortArray } from 'helpers/utils'
import { supabase } from 'lib/database'
import Link from 'next/link'

const HomePage = ({ seasons }) => {
  const seasonColors = {
    2022: {
      bg: 'bg-emerald-700',
      hover: 'hover:bg-emerald-800',
    },
    2023: {
      bg: 'bg-orange-700',
      hover: 'hover:bg-orange-800',
    },
  }
  return (
    <Layout documentTitle="Home">
      <div className="grid grid-cols-1 gap-y-8 gap-x-2 justify-items-center sm:grid-cols-2 lg:grid-cols-3">
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
              <a
                className={`relative flex items-center justify-center ${color.bg} ${color.hover} rounded-lg h-72 w-72 md:h-80 md:w-80`}
              >
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
  const { data: seasons } = await supabase.from('season').select('*')

  return {
    props: {
      seasons: sortArray(seasons, (a, b) => b.year - a.year),
    },
  }
}

export default HomePage
