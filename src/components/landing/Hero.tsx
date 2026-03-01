import { Link } from '@tanstack/react-router'

import { BackgroundBeams } from '@/components/ui/background-beams'
import { Button } from '@/components/ui/button'

import DitherOverlay from './DitherOverlay'

export default function Hero() {
  return (
    <section className="relative min-h-[72vh] overflow-hidden px-6 py-20 md:py-28">
      <div
        className="absolute inset-0 bg-zinc-900/10 [mask-image:linear-gradient(to_bottom,black_0%,black_70%,transparent_100%)] [mask-size:100%_100%] [mask-repeat:no-repeat]"
        aria-hidden
      >
        <BackgroundBeams primaryColor="#7DD3FC" secondaryColor="#1E3A8A" />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-1 h-40 bg-linear-to-t from-zinc-100 to-transparent"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-6xl">
        <DitherOverlay className="relative rounded-3xl border border-zinc-300 bg-zinc-100/80 p-8 shadow-xl shadow-zinc-900/10 md:p-14">
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mb-5 text-xs uppercase tracking-[0.32em] text-zinc-700">
            Your internal people network
          </p>
          <h1 className="mb-6 text-5xl leading-[0.95] font-semibold tracking-tight text-zinc-950 md:text-7xl">
            Conduit
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-zinc-800 md:text-lg">
            A LinkedIn alternative built for your organization. Find alumni and members of your organization
            quickly, understand who does what, and connect with the right people
            in seconds.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="border border-zinc-900 bg-zinc-900 text-zinc-100 transition-transform hover:-translate-y-0.5 hover:bg-zinc-800"
            >
              <Link to="/home">Get Started</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-zinc-700 bg-zinc-100/80 text-zinc-900 transition-transform hover:-translate-y-0.5"
            >
              <Link to="/demo/tanstack-query">Explore Profiles</Link>
            </Button>
          </div>
        </div>
      </DitherOverlay>
      </div>
    </section>
  )
}
