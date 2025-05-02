import ConstructorStandingRow from '@/components/ConstructorStandingRow'
import Layout from '@/components/Layout'
import { getSeasonParam } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import { GetServerSidePropsContext } from 'next'

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
      documentTitle='Standings'
      description='Overall season standings for all Constructors'
      fullWidth
    >
      <ol className='w-auto mb-4 text-lg font-medium text-white'>
        {standings.map(({ id, name, team_principal, total_points }) => (
          <ConstructorStandingRow
            key={id}
            teamPrincipal={team_principal}
            points={total_points}
            constructor={name as any}
            id={id}
          />
        ))}
      </ol>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID
  const eTagValue = commitSha + '_' + deploymentId

  context.res.setHeader('ETag', '"' + eTagValue + '"')

  const { data: standings } = await supabase
    .rpc('sum_constructor_points_by_season', {
      season: getSeasonParam(context),
    })
    .select('id, name, team_principal, total_points')
    .order('total_points', { ascending: false })
    .returns<Standing[]>()

  return {
    props: {
      standings,
    },
  }
}

export default Standings
