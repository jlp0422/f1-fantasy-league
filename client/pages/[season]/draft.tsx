import { Season } from '@/types/Season'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/database'
import { GetStaticPropsContext } from 'next'
import { makeSeasonPaths } from '@/helpers/routes'
import { constructorColumns } from '@/helpers/supabase'
import { DraftSelectionWithDriverAndConstructor } from '@/types/Unions'
import DraftSelectionRow from '@/components/DraftSelectionRow'

interface Props {
  draftSelections: DraftSelectionWithDriverAndConstructor[]
}

const Standings = ({ draftSelections }: Props) => {
  console.log({ draftSelections })
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

export async function getStaticPaths() {
  const { data } = await supabase.from('season').select('*').returns<Season[]>()

  return makeSeasonPaths(data!)
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
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
    .eq('draft.season.year', params?.season)
    .order('pick_number', { ascending: true })
    .returns<DraftSelectionWithDriverAndConstructor[]>()

  return {
    props: {
      draftSelections,
    },
  }
}

export default Standings
