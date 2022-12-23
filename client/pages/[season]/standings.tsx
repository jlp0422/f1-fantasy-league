import { Season } from '@/types/Season'
import ConstructorStandingRow from 'components/ConstructorStandingRow'
import Layout from 'components/Layout'
import { supabase } from 'lib/database'
import { GetStaticPropsContext } from 'next'

interface Standing {
  id: number
  name: string
  team_principal: string
  total_points: number
}

interface Props {
  standings: Standing[]
}

const Standings = ({ standings }: Props) => {
  return (
    <Layout
      documentTitle="Standings"
      description="Overall season standings for all Constructors"
      fullWidth
    >
      <ol className="w-auto mb-4 text-lg font-medium text-white">
        {standings.map(({ id, name, team_principal, total_points }) => (
          <ConstructorStandingRow
            key={id}
            teamPrincipal={team_principal}
            points={total_points}
            // this makes no sense
            constructor={name as any}
            id={id}
          />
        ))}
      </ol>
    </Layout>
  )
}

export async function getStaticPaths() {
  const { data: seasons } = (await supabase.from('season').select('*')) as {
    data: Season[]
  }

  return {
    paths: seasons.map((season) => ({
      params: {
        season: season.year.toString(),
      },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const { data: standings } = (await supabase
    .rpc('sum_constructor_points_by_season', { season: params?.season })
    .select('id, name, team_principal, total_points')
    .order('total_points', { ascending: false })) as { data: Standing[] }

  return {
    props: {
      standings,
    },
  }
}

export default Standings
