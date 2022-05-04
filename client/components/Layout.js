import Header from '../components/Header'

const Layout = ({ children, title }) => {
  return (
    <div>
      <Header />
      <main className="mx-4 mt-4 mb-12 sm:mx-8">
        {title ? (
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-900">
            {title}
          </h1>
        ) : null}
        {children}
      </main>
    </div>
  )
}

export default Layout
