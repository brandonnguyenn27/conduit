import { Link } from '@tanstack/react-router'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-300 bg-zinc-100/70 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-zinc-700 md:flex-row">
        <p>Conduit</p>
        <div className="flex items-center gap-5">
          <Link to="/" className="transition-opacity hover:opacity-70">
            Home
          </Link>
          <Link to="/onboarding" className="transition-opacity hover:opacity-70">
            Sign up
          </Link>
          <Link to="/login" className="transition-opacity hover:opacity-70">
            Log in
          </Link>
          <a
            href="https://tanstack.com/start"
            target="_blank"
            rel="noreferrer"
            className="transition-opacity hover:opacity-70"
          >
            Docs
          </a>
        </div>
      </div>
    </footer>
  )
}
