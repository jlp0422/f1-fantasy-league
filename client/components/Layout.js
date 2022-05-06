import Header from 'components/Header'
import Head from 'next/head'

const Layout = ({ children, pageTitle, documentTitle }) => {
  return (
    <div>
      <Head>
        <title>{`${documentTitle} | F1 Fantasy 2022`}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta property="og:title" content={documentTitle} key="title" />
      </Head>
      <Header />
      <main className="mx-4 mt-4 mb-12 sm:mx-8">
        {pageTitle ? (
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-900">
            {pageTitle}
          </h1>
        ) : null}
        {children}
      </main>
    </div>
  )
}

export default Layout
