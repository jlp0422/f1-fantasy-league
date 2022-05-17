import Header from 'components/Header'
import MetaTags from 'components/MetaTags'

const Layout = ({
  children,
  pageTitle,
  documentTitle,
  metaImageUrl,
  description,
}) => {
  return (
    <div>
      <MetaTags
        documentTitle={documentTitle}
        metaImageUrl={metaImageUrl}
        description={description}
      />
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
