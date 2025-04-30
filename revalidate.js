import fetch from 'node-fetch'

async function ping_database() {
  const response = await fetch(
    'https://fate-of-the-eight.vercel.app/api/get-seasons'
  )
  const resp = await response.json()
  if (response.ok) {
    console.log(`pinged database successful: ${resp}`)
  } else {
    console.log(`pinged database failed: ${resp}`)
  }
}

ping_database()
