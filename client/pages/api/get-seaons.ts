import type { NextApiRequest, NextApiResponse } from 'next'

interface Data {
  success: boolean
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.REVALIDATE_TOKEN) {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/season`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        } as HeadersInit,
      }
    )

    if (response.ok) {
      return res
        .status(response.status)
        .json({ success: true, message: 'Retrieved seasons' })
    } else {
      return res
        .status(response.status)
        .send({ success: false, message: 'Error fetching seasons' })
    }
  } catch (err) {
    return res
      .status(500)
      .send({ success: false, message: 'Error fetching seasons' })
  }
}
