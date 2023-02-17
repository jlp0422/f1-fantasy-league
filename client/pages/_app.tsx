import 'styles/globals.css'
export { reportWebVitals } from 'next-axiom';
import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
