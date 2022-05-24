import Link from 'next/link'

const ConstructorLink = ({ normalizedConstructor, children }) => {
  return (
    <Link
      href={{
        pathname: '/constructors/[name]',
        query: {
          name: encodeURIComponent(normalizedConstructor),
        },
      }}
    >
      {children}
    </Link>
  )
}

export default ConstructorLink
