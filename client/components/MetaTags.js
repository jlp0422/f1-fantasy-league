import Header from 'components/Header'
import Head from 'next/head'
import { useRouter } from 'next/router'

const MetaTags = ({
  documentTitle,
  metaImageUrl = 'https://res.cloudinary.com/jlp0422/image/upload/v1652746266/f1-fantasy-2022/cars/turbo-team-racing.jpg',
  description = 'Home built website for F1 Fantasy 2022 League',
}) => {
  const { asPath } = useRouter()
  const contentUrl = `https://f1-fantasy-2022.vercel.app${asPath}`
  const docAndSiteTitle = `${documentTitle} | F1 Fantasy 2022`
  return (
    <Head>
      <title>{docAndSiteTitle}</title>
      {/* <link rel="shortcut icon" href="/favicon.ico" /> */}

      {/* <!-- COMMON TAGS --> */}
      <meta charset="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />

      {/* <!-- Search Engine --> */}
      <meta name="description" content={description} />
      <meta name="image" content={contentUrl} />

      {/* <!-- Schema.org for Google --> */}
      <meta itemprop="name" content={docAndSiteTitle} />
      <meta itemprop="description" content={description} />
      <meta itemprop="image" content={contentUrl} />

      {/* <!-- Twitter --> */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={docAndSiteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:site" content="@jeremyphilipson" />
      <meta name="twitter:image:src" content={metaImageUrl} />

      {/* <!-- Open Graph general (Facebook, Pinterest & Google+) --> */}
      <meta property="og:title" content={documentTitle} key="title" />
      <meta property="og:image" content={metaImageUrl} />
      <meta name="og:description" content={description} />
      <meta name="og:url" content={contentUrl} />
      <meta name="og:site_name" content={docAndSiteTitle} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_US" />
    </Head>
  )
}

export default MetaTags
