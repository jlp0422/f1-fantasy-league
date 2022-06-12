import fetch from 'node-fetch'

async function revalidate() {
  const response = await fetch(
    `https://fate-of-the-eight.vercel.app/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}`
  )
  console.log('revalidation response: ', response)
}

revalidate()
