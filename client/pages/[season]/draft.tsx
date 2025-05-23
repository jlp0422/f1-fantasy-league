import DraftSelectionRow from '@/components/DraftSelectionRow'
import Layout from '@/components/Layout'
import { constructorColumns } from '@/helpers/supabase'
import { getSeasonParam } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import { DraftSelectionWithDriverAndConstructor } from '@/types/Unions'
import { GetServerSidePropsContext } from 'next'

interface Props {
  draftSelections: DraftSelectionWithDriverAndConstructor[]
}

const Standings = ({ draftSelections }: Props) => {
  return (
    <Layout documentTitle='Draft' description='Draft Picks' fullWidth>
      <div>
        <ol className='w-auto mb-4 text-lg font-medium text-white'>
          {draftSelections.map((draftSelection) => (
            <DraftSelectionRow
              key={draftSelection.id}
              draftSelection={draftSelection}
            />
          ))}
        </ol>
      </div>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { data: draftSelections } = await supabase
    .from('draft_selection')
    .select(
      `
      id,
      pick_number,
      draft!inner(
        id,
        season!inner(
          id,
          year
        )
      ),
      constructor(${constructorColumns}),
      driver(
        id,
        abbreviation,
        first_name,
        last_name,
        number,
        image_url
      )
    `
    )
    .eq('draft.season.year', getSeasonParam(context))
    .order('pick_number', { ascending: true })
    .returns<DraftSelectionWithDriverAndConstructor[]>()

  return {
    props: {
      draftSelections,
    },
  }
}

export default Standings
