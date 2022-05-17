import Header from 'components/Header'
import MetaTags from 'components/MetaTags'

const Layout = ({
  children,
  pageTitle,
  documentTitle,
  metaImageUrl,
  description,
}) => {
  const noPadding = false
  return (
    <div>
      <MetaTags
        documentTitle={documentTitle}
        metaImageUrl={metaImageUrl}
        description={description}
      />
      <Header />
      <main
        className={`${
          noPadding ? 'mx-0' : 'mx-4 xl:mx-auto sm:mx-8'
        } mt-4 mb-12 max-w-7xl`}
      >
        {pageTitle ? (
          <h1
            className={`${
              noPadding ? 'mx-4' : 'mx-auto'
            } mb-2 sm:mb-4 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 text-center sm:text-left max-w-7xl mx-auto`}
          >
            {pageTitle}
          </h1>
        ) : null}
        {children}
      </main>
    </div>
  )
}

export default Layout
