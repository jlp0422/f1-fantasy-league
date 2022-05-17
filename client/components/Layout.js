import Header from 'components/Header'
import Head from 'next/head'

const Layout = ({
  children,
  pageTitle,
  documentTitle,
  metaImageUrl = 'https://res.cloudinary.com/jlp0422/image/upload/v1652746266/f1-fantasy-2022/cars/turbo-team-racing.jpg',
  description = 'Home built website for F1 Fantasy 2022 League',
}) => {
  return (
    <div>
      <Head>
        <title>{`${documentTitle} | F1 Fantasy 2022`}</title>
        {/* <link rel="shortcut icon" href="/favicon.ico" /> */}

        {/* <!-- COMMON TAGS --> */}
        <meta charset="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />

        {/* <!-- Search Engine --> */}
        <meta name="description" content={description} />
        <meta name="image" content="https://f1-fantasy-2022.vercel.app/" />

        {/* <!-- Schema.org for Google --> */}
        <meta itemprop="name" content="F1 Fantasy 2022" />
        <meta itemprop="description" content={description} />
        <meta itemprop="image" content="https://f1-fantasy-2022.vercel.app/" />

        {/* <!-- Twitter --> */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="F1 Fantasy 2022" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:site" content="@jeremyphilipson" />
        <meta name="twitter:image:src" content={metaImageUrl} />

        {/* <!-- Open Graph general (Facebook, Pinterest & Google+) --> */}
        <meta property="og:title" content={documentTitle} key="title" />
        <meta property="og:image" content={metaImageUrl} />
        <meta name="og:description" content={description} />
        <meta name="og:url" content="https://f1-fantasy-2022.vercel.app/" />
        <meta name="og:site_name" content="F1 Fantasy 2022" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
      </Head>
      <Header />
      <main className="mx-4 mt-4 mb-12 sm:mx-8">
        {pageTitle ? (
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900">
            {pageTitle}
          </h1>
        ) : null}
        {children}
      </main>
    </div>
  )
}

export default Layout
