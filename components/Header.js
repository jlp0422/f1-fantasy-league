import Link from 'next/link'

const Header = () => {
  return (
    <ul>
      <li>
        <Link href="/standings">
          <a>Standings</a>
        </Link>
      </li>
      <li>
        <Link href="/race-points">
          <a>Race Points</a>
        </Link>
      </li>
    </ul>
  )
}

export default Header
