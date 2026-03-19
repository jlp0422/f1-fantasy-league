import { supabase } from '@/lib/database'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { raceId } = req.query

  if (!raceId || typeof raceId !== 'string') {
    return res.status(400).json({ message: 'Invalid raceId' })
  }

  const { data, error } = await supabase.storage
    .from('race-replays')
    .download(`${raceId}.json`)

  if (error || !data) {
    return res.status(404).json({ message: 'Replay not found' })
  }

  const text = await data.text()
  const json = JSON.parse(text)

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json(json)
}
