import Layout from '@/components/Layout'
import { makeSeasonPaths } from '@/helpers/routes'
import { constructorColumns } from '@/helpers/supabase'
import { supabase } from '@/lib/database'
import { Season } from '@/types/Season'
import {
  ConstructorDriverWithJoins,
  ConstructorWithSeason,
  DriverWithSeason,
} from '@/types/Unions'
import { GetStaticPropsContext } from 'next'
import { Fragment, useState } from 'react'

interface Props {
  constructors: ConstructorWithSeason[]
  selectedDrivers: ConstructorDriverWithJoins[]
  allDrivers: DriverWithSeason[]
}

const SwapDrivers = ({ selectedDrivers, constructors }: Props) => {
  const [constructorId, setConstructorId] = useState<number>()
  const [oldDriverId, setOldDriverId] = useState<number>()
  const [newDriverId, setNewDriverId] = useState<number>()
  console.log({ constructorId, oldDriverId, newDriverId })
  return (
    <Layout documentTitle='Swap Drivers' description='Swap Drivers'>
      <div className='relative mx-2 mt-2 font-tertiary sm:mx-4'>
        <div>
          <select
            name='constructor'
            id='constructor'
            onChange={(ev) => setConstructorId(+ev.target.value)}
          >
            <option key='default' value='' selected disabled>
              Select
            </option>
            {constructors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name='driver'
            id='driver'
            disabled={!constructorId}
            onChange={(ev) => setOldDriverId(+ev.target.value)}
          >
            <option key='default' value='' selected disabled>
              Select
            </option>
            {selectedDrivers
              .filter((d) => d.constructor_id === constructorId)
              .map((d) => (
                <Fragment key={d.constructor_id}>
                  <option value={d.driver_one.id}>
                    {d.driver_one.first_name} {d.driver_one.last_name}
                  </option>
                  <option value={d.driver_two.id}>
                    {d.driver_two.first_name} {d.driver_two.last_name}
                  </option>
                </Fragment>
              ))}
          </select>
        </div>
      </div>
    </Layout>
  )
}

export async function getStaticPaths() {
  const { data } = (await supabase.from('season').select('*')) as {
    data: Season[]
  }

  return makeSeasonPaths(data)
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const { data: constructors } = (await supabase
    .from('constructor')
    .select(constructorColumns)
    .eq('season.year', params?.season)) as { data: ConstructorWithSeason[] }

  const { data: selectedDrivers } = (await supabase
    .from('constructor_driver')
    .select(
      `
        id,
        driver_one:driver_one_id(
          id,
          first_name,
          last_name
        ),
        driver_two:driver_two_id(
          id,
          first_name,
          last_name
        ),
        constructor_id,
        season!inner(year)`
    )
    .eq('season.year', params?.season)) as {
    data: ConstructorDriverWithJoins[]
  }
  const { data: allDrivers } = (await supabase
    .from('driver')
    .select(
      `
        id,
        first_name,
        last_name
        season!inner(year)`
    )
    .eq('season.year', params?.season)) as {
    data: DriverWithSeason[]
  }

  return {
    props: {
      constructors,
      selectedDrivers,
      allDrivers,
    },
  }
}

export default SwapDrivers
