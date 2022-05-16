import Dismiss from 'components/icons/Dismiss'
import Hamburger from 'components/icons/Hamburger'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useRouter()
  const routes = [
    { href: '/', title: 'Home' },
    { href: '/standings', title: 'Standings' },
    { href: '/race-points', title: 'Points by Race' },
  ]

  return (
    <nav className="relative z-10 px-4 py-4 bg-gray-800 border-gray-200 sm:px-8">
      <div className="flex flex-wrap items-center justify-between">
        <Link href="/">
          <a className="flex items-center">
            {/* <img
            src="/docs/images/logo.svg"
            className="h-6 mr-3 sm:h-9"
            alt="Flowbite Logo"
          /> */}
            <span className="self-center text-xl font-semibold text-white whitespace-nowrap">
              F1 Fantasy 2022
            </span>
          </a>
        </Link>
        <button
          data-collapse-toggle="mobile-menu"
          type="button"
          className="inline-flex items-center p-2 ml-3 text-sm text-gray-400 rounded-lg md:hidden focus:outline-none focus:ring-2 hover:bg-gray-700 focus:ring-gray-600"
          aria-controls="mobile-menu"
          aria-expanded="false"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="sr-only">Open main menu</span>
          {isOpen ? <Dismiss /> : <Hamburger />}
        </button>
        <div
          className={`${!isOpen && 'hidden'} w-full md:block md:w-auto`}
          id="mobile-menu"
        >
          <ul className="flex flex-col mt-4 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium">
            {routes.map(({ href, title }) => {
              const isActiveRoute = pathname === href
              return (
                <li key={href}>
                  <Link href={href}>
                    <a
                      className={`block py-2 pr-4 pl-3 border-b md:border-0 md:p-0  md:hover:text-white hover:bg-gray-700 hover:text-gray-200 md:hover:bg-transparent border-gray-700 ${
                        isActiveRoute ? 'text-white' : 'text-gray-400'
                      }`}
                      onClick={() => setIsOpen((open) => !open)}
                    >
                      {title}
                    </a>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Header
