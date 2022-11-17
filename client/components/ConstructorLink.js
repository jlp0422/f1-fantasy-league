import Link from 'next/link'
import { useRouter } from 'next/router'

const ConstructorLink = ({ normalizedConstructor, constructorId, children }) => {
  const router = useRouter()
  return (
    <Link
      href={{
        pathname: '/[season]/constructors/[name]',
        query: {
          name: `${constructorId}-${encodeURIComponent(normalizedConstructor)}`,
          season: router.query.season
        },
      }}
    >
      {children}
    </Link>
  )
}

export default ConstructorLink
