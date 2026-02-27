import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

import DitherOverlay from './DitherOverlay'

export default function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <DitherOverlay className="rounded-2xl border border-zinc-300 bg-zinc-100/80 px-6 py-12 text-center shadow-lg shadow-zinc-900/10 md:px-12">
        <div className="relative z-10">
          <h2 className="mb-3 text-3xl tracking-tight text-zinc-950 md:text-4xl">
            Find the right person faster.
          </h2>
          <p className="mx-auto mb-7 max-w-2xl text-sm leading-relaxed text-zinc-700 md:text-base">
            Join your organization network and search profiles with the speed of
            a dedicated internal directory.
          </p>
          <Button
            asChild
            size="lg"
            className="border border-zinc-900 bg-zinc-900 text-zinc-100 transition-transform hover:-translate-y-0.5 hover:bg-zinc-800"
          >
            <Link to="/demo/convex">Try Conduit</Link>
          </Button>
        </div>
      </DitherOverlay>
    </section>
  )
}
