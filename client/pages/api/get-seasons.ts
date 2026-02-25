import { supabase } from '@/lib/database'
import { Season } from '@/types/Season'
import type { NextApiRequest, NextApiResponse } from 'next'

interface Data {
  seasons?: Season[]
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { data: seasons, error } = await supabase
    .from('season')
    .select('id, year')
    .order('year', { ascending: true })
    .returns<Season[]>()

  if (error) {
    return res.status(500).json({ message: error.message })
  }

  return res.status(200).json({ seasons: seasons ?? [] })
}
