import fetch from 'node-fetch'

async function revalidate() {
  const secret = process.argv[2] || process.env.REVALIDATE_TOKEN
  const response = await fetch(
    `https://fate-of-the-eight.vercel.app/api/revalidate?secret=${secret}`
  )
  console.log('revalidation response: ', response)
}

revalidate()
