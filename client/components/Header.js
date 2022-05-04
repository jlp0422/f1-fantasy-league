import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Dismiss from './icons/Dismiss'
import Hamburger from './icons/Hamburger'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useRouter()
  const routes = [
    { href: '/standings', title: 'Standings' },
    { href: '/race-points', title: 'Points by Race' },
  ]
  const activeRouteClass = 'dark:text-white'
  return (
    <nav className="px-2 py-4 bg-white border-gray-200 sm:px-4 dark:bg-gray-800">
      <div className="container flex flex-wrap items-center justify-between mx-auto">
        {/* <a href="https://flowbite.com" className="flex items-center"> */}
        {/* <img
            src="/docs/images/logo.svg"
            className="h-6 mr-3 sm:h-9"
            alt="Flowbite Logo"
          /> */}
        <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
          F1 Fantasy 2022
        </span>
        {/* </a> */}
        <button
          data-collapse-toggle="mobile-menu"
          type="button"
          className="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
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
                      className={`block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-gray-200 md:dark:hover:bg-transparent dark:border-gray-700 ${
                        isActiveRoute && activeRouteClass
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
