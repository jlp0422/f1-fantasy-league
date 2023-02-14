import Link from 'next/link'
import { useRouter } from 'next/router'

interface Props {
  normalizedConstructor: string
  constructorId: number
  children: any
}

const ConstructorLink = ({
  normalizedConstructor,
  constructorId,
  children,
}: Props) => {
  const router = useRouter()
  return (
    <Link
      href={{
        pathname: '/[season]/constructors/[name]',
        query: {
          name: `${constructorId}-${encodeURIComponent(normalizedConstructor)}`,
          season: router.query.season,
        },
      }}
      legacyBehavior>
      {children}
    </Link>
  );
}

export default ConstructorLink
