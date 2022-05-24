import Head from 'next/head'
import { useRouter } from 'next/router'

const MetaTags = ({
  documentTitle,
  metaImageUrl = 'https://res.cloudinary.com/jlp0422/image/upload/b_rgb:000000,c_scale,w_2500/v1653181121/f1-fantasy-2022/logo.png',
  description = 'Standings for Fate of the Eight F1 Fantasy 2022',
}) => {
  const { asPath } = useRouter()
  const contentUrl = `https://fate-of-the-eight.vercel.app${asPath}`
  const docAndSiteTitle = `${documentTitle} | Fate of the Eight`
  return (
    <Head>
      <title>{docAndSiteTitle}</title>
      <link rel="icon" href="/favicon/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png"/>
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
      <link rel="manifest" href="/favicon/site.webmanifest"/>


      {/* <!-- COMMON TAGS --> */}
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />

      {/* <!-- Search Engine --> */}
      <meta name="description" content={description} key="desc" />
      <meta name="image" content={contentUrl} key="img" />

      {/* <!-- Schema.org for Google --> */}
      <meta itemProp="name" content={docAndSiteTitle} key="g-name" />
      <meta itemProp="description" content={description} key="g-desc" />
      <meta itemProp="image" content={contentUrl} key="g-img" />

      {/* <!-- Twitter --> */}
      <meta name="twitter:card" content="summary" key="tw-card" />
      <meta name="twitter:title" content={docAndSiteTitle} key="tw-title" />
      <meta name="twitter:description" content={description} key="tw-desc" />
      <meta name="twitter:site" content="@jeremyphilipson" key="tw-site" />
      <meta name="twitter:image:src" content={metaImageUrl} key="tw-img-src" />

      {/* <!-- Open Graph general (Facebook, Pinterest & Google+) --> */}
      <meta property="og:title" content={docAndSiteTitle} key="og-title" />
      <meta property="og:image" content={metaImageUrl} key="og-image" />
      <meta name="og:description" content={description} key="og-desc" />
      <meta name="og:url" content={contentUrl} key="og-url" />
      <meta name="og:site_name" content={docAndSiteTitle} key="og-site" />
      <meta property="og:type" content="website" key="og-type" />
      <meta property="og:locale" content="en_US" key="og-locale" />
    </Head>
  )
}

export default MetaTags
