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
      <main className="mx-4 mt-4 mb-12 xl:mx-auto sm:mx-8 max-w-7xl">
        {pageTitle ? (
          <h1 className="mx-auto mb-2 text-2xl font-bold tracking-tight text-center text-gray-900 sm:mb-4 sm:text-3xl sm:text-left max-w-7xl">
            {pageTitle}
          </h1>
        ) : null}
        <div>{children}</div>
      </main>
    </div>
  )
}

export default Layout
