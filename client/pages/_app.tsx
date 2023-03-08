import 'styles/globals.css'
import 'react-tooltip/dist/react-tooltip.css'
export { reportWebVitals } from 'next-axiom'
import type { AppProps } from 'next/app'
import { Analytics } from '@vercel/analytics/react'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}

export default MyApp
