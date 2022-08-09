import Link from 'next/link'

const ConstructorLink = ({ normalizedConstructor, constructorId, children }) => {
  return (
    <Link
      href={{
        pathname: '/constructors/[name]',
        query: {
          name: `${constructorId}-${encodeURIComponent(normalizedConstructor)}`,
        },
      }}
    >
      {children}
    </Link>
  )
}

export default ConstructorLink
