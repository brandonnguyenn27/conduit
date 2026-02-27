import { Link, useRouterState } from '@tanstack/react-router'

import BetterAuthHeader from '../integrations/better-auth/header-user.tsx'

import { useEffect, useState } from 'react'
import { ClipboardType, Globe, Home, Menu, Network, X } from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isHome = pathname === '/'
  const isHomeApp = pathname.startsWith('/home')

  useEffect(() => {
    if (isHome) {
      setIsOpen(false)
    }
  }, [isHome])

  if (isHomeApp) return null

  return (
    <>
      <header className="flex items-center border-b border-zinc-300 bg-zinc-100/90 p-4 text-zinc-900 shadow-sm backdrop-blur">
        {!isHome ? (
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-lg p-2 transition-colors hover:bg-zinc-200"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        ) : null}
        <h1 className="ml-4 text-xl tracking-tight">
          <Link to="/" className="inline-flex items-baseline gap-2">
            <span className="landing-page text-3xl leading-none font-semibold">
              Conduit
            </span>
            <span className="text-xs uppercase tracking-[0.24em] text-zinc-600">
              network intelligence
            </span>
          </Link>
        </h1>
      </header>

      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-80 flex-col bg-gray-900 text-white shadow-2xl transition-transform duration-300 ease-in-out ${
          !isHome && isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          {/* Demo Links Start */}

          <Link
            to="/demo/convex"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Globe size={20} />
            <span className="font-medium">Convex</span>
          </Link>

          <Link
            to="/demo/form/simple"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <ClipboardType size={20} />
            <span className="font-medium">Simple Form</span>
          </Link>

          <Link
            to="/demo/form/address"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <ClipboardType size={20} />
            <span className="font-medium">Address Form</span>
          </Link>

          <Link
            to="/demo/better-auth"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Globe size={20} />
            <span className="font-medium">Better Auth</span>
          </Link>

          <Link
            to="/demo/tanstack-query"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Network size={20} />
            <span className="font-medium">TanStack Query</span>
          </Link>

          {/* Demo Links End */}
        </nav>

        <div className="p-4 border-t border-gray-700 bg-gray-800 flex flex-col gap-2">
          <BetterAuthHeader />
        </div>
      </aside>
    </>
  )
}
