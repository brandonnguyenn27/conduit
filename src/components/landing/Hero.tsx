import { Link } from '@tanstack/react-router'

import { BackgroundBeams } from '@/components/ui/background-beams'
import { Button } from '@/components/ui/button'
import { CanvasText } from '@/components/ui/canvas-text'

export default function Hero() {
  return (
    <section className="relative min-h-[72vh] overflow-hidden px-6 py-20 md:py-28">
      <div
        className="absolute inset-0 mask-[linear-gradient(to_bottom,black_0%,black_70%,transparent_100%)] mask-size-[100%_100%] mask-no-repeat"
        aria-hidden
      >
        <BackgroundBeams />
      </div>
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <p className="mb-6 text-sm uppercase tracking-[0.32em] text-zinc-600 md:text-base">
          Your internal people network
        </p>
        <h1 className="mb-8">
          <CanvasText
            text="Conduit"
            className="block text-7xl leading-[0.95] font-semibold tracking-tight md:text-8xl lg:text-9xl"
            backgroundClassName="bg-blue-600 dark:bg-blue-700"
            colors={[
              "rgba(0, 153, 255, 1)",
              "rgba(0, 153, 255, 0.9)",
              "rgba(0, 153, 255, 0.8)",
              "rgba(0, 153, 255, 0.7)",
              "rgba(0, 153, 255, 0.6)",
              "rgba(0, 153, 255, 0.5)",
              "rgba(0, 153, 255, 0.4)",
              "rgba(0, 153, 255, 0.3)",
              "rgba(0, 153, 255, 0.2)",
              "rgba(0, 153, 255, 0.1)",
            ]}
            lineGap={4}
            animationDuration={20}
          />
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-zinc-900 md:text-xl lg:text-2xl">
          A LinkedIn alternative built for your organization. Find alumni and members of your organization
          quickly, understand who does what, and connect with the right people
          in seconds.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
          <span className="btn-glow-border-dark">
            <Button
              asChild
              size="lg"
              className="btn-glow-border-inner-dark h-12 px-8 text-base md:h-14 md:px-10 md:text-lg"
            >
              <Link to="/onboarding">Get Started</Link>
            </Button>
          </span>
          
        </div>
      </div>
    </section>
  )
}
