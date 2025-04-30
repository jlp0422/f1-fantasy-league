import fetch from 'node-fetch'

async function ping_database() {
  const response = await fetch(
    'https://fate-of-the-eight.vercel.app/api/get-seasons'
  )
  const resp = await response.json()
  if (response.ok) {
    console.log(`pinged database successful: ${resp.message}`)
  } else {
    console.log(`pinged database failed: ${resp.message}`)
  }
}

ping_database()
