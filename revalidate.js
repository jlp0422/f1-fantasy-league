import fetch from 'node-fetch'

async function revalidate() {
  const secret = process.argv[2] || process.env.REVALIDATE_TOKEN
  const season = process.argv[3] || process.env.SEASON
  const response = await fetch(
    `https://fate-of-the-eight.vercel.app/api/revalidate?secret=${secret}&season=${season}`
  )
  if (response.ok) {
    console.log('revalidation response successful with code: ', response.status)
  } else {
    console.log('revalidation response failed: ', response)
  }
}

revalidate()
