import Header from 'components/Header'
import MetaTags from 'components/MetaTags'

const Layout = ({
  children,
  documentTitle,
  metaImageUrl,
  description,
  fullWidth,
}) => {
  const classes = fullWidth
    ? 'm-0'
    : 'mx-4 mt-4 mb-12 xl:mx-auto sm:mx-8 max-w-7xl'
  return (
    <div>
      <MetaTags
        documentTitle={documentTitle}
        metaImageUrl={metaImageUrl}
        description={description}
      />
      <Header />
      <main className={classes}>
        <div>{children}</div>
      </main>
    </div>
  )
}

export default Layout
