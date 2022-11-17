import ConstructorStandingRow from 'components/ConstructorStandingRow'
import Layout from 'components/Layout'
import { supabase } from 'lib/database'

const Standings = ({ standings }) => {
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
            principal={team_principal}
            points={total_points}
            constructor={name}
            id={id}
          />
        ))}
      </ol>
    </Layout>
  )
}

export async function getStaticPaths() {
  const { data } = await supabase.from('season').select('*')

  return {
    paths: data.map((season) => ({
      params: {
        season: season.year.toString(),
      },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const { data: standings } = await supabase
    .rpc('sum_constructor_points_by_season', { seasonYear: params.season })
    .select('id, name, team_principal, total_points')
    .order('total_points', { ascending: false })

  return {
    props: {
      standings,
    },
  }
}

export default Standings