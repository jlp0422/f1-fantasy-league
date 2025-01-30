import Link from 'next/link'
import { useRouter } from 'next/router'

interface Props {
  driverId: number
  children: any
}

const DriverLink = ({ driverId, children }: Props) => {
  const router = useRouter()
  return (
    <Link
      href={{
        pathname: '/[season]/drivers/[id]',
        query: {
          id: driverId,
          season: router.query.season,
        },
      }}
    >
      {children}
    </Link>
  )
}

export default DriverLink
