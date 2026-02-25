import Dismiss from '@/components/icons/Dismiss'
import Gear from '@/components/icons/Gear'
import Hamburger from '@/components/icons/Hamburger'
import { IDENTITY_KEY, IdentityValue } from '@/pages/[season]/identity'
import headerLogo from '@/public/fate-eight.png'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const checkIfRoutesAreEqual = (pathname: string, href: string) => {
  const splitPath = pathname.split('/')
  const splitHref = href.split('/')
  const pathEnd = splitPath[splitPath.length - 1]
  const hrefEnd = splitHref[splitHref.length - 1]
  return pathEnd === hrefEnd
}

const Header = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [myTeam, setMyTeam] = useState<IdentityValue | null>(null)
  const { pathname, query } = useRouter()
  const season = query.season as string | undefined

  useEffect(() => {
    if (!season) return
    const stored = localStorage.getItem(IDENTITY_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const val: IdentityValue | undefined = parsed[season]
      setMyTeam(val ?? null)
    } else {
      setMyTeam(null)
    }
  }, [season, pathname])

  const myTeamHref =
    myTeam && season
      ? `/${season}/constructors/${myTeam.id}-${encodeURIComponent(
          myTeam.normalized
        )}`
      : null

  const routes = [
    { href: `/${season}/standings`, title: 'Standings' },
    { href: `/${season}/race-points`, title: 'Race Points' },
    ...(myTeamHref ? [{ href: myTeamHref, title: 'My Team' }] : []),
    { href: `/${season}/drivers`, title: 'Drivers' },
    { href: `/${season}/draft`, title: 'Draft' },
  ]

  const identityHref = `/${season}/identity`
  const isIdentityRoute = checkIfRoutesAreEqual(pathname, identityHref)
  const isMyTeamRoute = pathname === '/[season]/constructors/[name]'

  return (
    <nav className='relative z-10 px-2 py-6 border-gray-200 md:px-8 bg-fate-black'>
      <div className='flex flex-wrap items-center justify-between mx-auto max-w-7xl'>
        {season ? (
          <button
            data-collapse-toggle='mobile-menu'
            type='button'
            className='absolute inline-flex items-center p-2 text-sm text-gray-400 rounded-lg md:hidden focus:outline-none focus:ring-2 hover:bg-gray-700 focus:ring-gray-600 xs:top-4 sm:top-4'
            style={isOpen ? { top: 16 } : {}}
            aria-controls='mobile-menu'
            aria-expanded='false'
            onClick={() => setIsOpen((open) => !open)}
          >
            <span className='sr-only'>Open main menu</span>
            {isOpen ? <Dismiss /> : <Hamburger />}
          </button>
        ) : null}
        <div className='flex items-center justify-center mx-auto md:w-auto md:flex-1 md:justify-start'>
          <Link
            href='/'
            className='leading-[0rem] max-w-[200px] xs:max-w-[300px] sm:max-w-[450px]'
            passHref
          >
            <Image src={headerLogo} alt='Fate of the Eight' />
          </Link>
        </div>
        {season ? (
          <Link
            href={identityHref}
            className={`absolute right-2 top-4 inline-flex items-center p-2 rounded-lg md:hidden focus:outline-none focus:ring-2 hover:bg-gray-700 focus:ring-gray-600 ${
              isIdentityRoute ? 'text-white' : 'text-gray-400'
            }`}
            onClick={() => setIsOpen(false)}
          >
            <span className='sr-only'>Manage identity</span>
            <Gear />
          </Link>
        ) : null}
        <div
          className={`${isOpen ? 'block' : 'hidden'} w-full md:block md:w-auto`}
          id='mobile-menu'
        >
          {season ? (
            <ul className='flex flex-col mt-6 md:flex-row md:space-x-4 md:mt-0 md:text-sm md:font-medium md:items-center'>
              {routes.map(({ href, title }) => {
                const isActiveRoute =
                  title === 'My Team'
                    ? isMyTeamRoute
                    : checkIfRoutesAreEqual(pathname, href)
                return (
                  <li key={`${href}-${title}`}>
                    <Link
                      href={href}
                      className={`mx-1 font-secondary uppercase block px-2 py-2 border-b md:border-0 md:p-0 text-lg lg:text-xl md:hover:text-white hover:bg-gray-700 hover:text-gray-200 md:hover:bg-transparent border-gray-700 ${
                        isActiveRoute ? 'text-white' : 'text-gray-400'
                      }`}
                      onClick={() => setIsOpen((open) => !open)}
                    >
                      {title}
                    </Link>
                  </li>
                )
              })}
              <li className='hidden md:flex md:items-center md:ml-2'>
                <Link
                  href={identityHref}
                  className={`inline-flex items-center p-1 rounded hover:bg-gray-700 ${
                    isIdentityRoute ? 'text-white' : 'text-gray-400'
                  }`}
                  onClick={() => setIsOpen((open) => !open)}
                >
                  <Gear />
                </Link>
              </li>
            </ul>
          ) : (
            <ul className='flex flex-col mt-6 md:flex-row md:space-x-6 md:mt-0 md:text-sm md:font-medium'>
              <li>
                <Link
                  href=''
                  className='block px-2 py-2 mx-1 text-lg text-gray-400 uppercase border-b border-gray-700 font-secondary md:border-0 md:p-0 lg:text-xl md:hover:text-white hover:bg-gray-700 hover:text-gray-200 md:hover:bg-transparent'
                  onClick={() => {}}
                >
                  &nbsp;
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Header
