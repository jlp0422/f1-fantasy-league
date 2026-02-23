import Link from 'next/link'
import { useRouter } from 'next/router'

interface Props {
  normalizedLocation: string
  raceId: number
  children: any
}

const RaceLink = ({ normalizedLocation, raceId, children }: Props) => {
  const router = useRouter()
  return (
    <Link
      href={{
        pathname: '/[season]/races/[location]',
        query: {
          location: `${raceId}-${encodeURIComponent(normalizedLocation)}`,
          season: router.query.season,
        },
      }}
    >
      {children}
    </Link>
  )
}

export default RaceLink
