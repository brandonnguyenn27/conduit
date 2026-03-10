import { CanvasText } from '@/components/ui/canvas-text'
import { DotPattern } from '@/components/ui/dot-pattern'

export function OnboardingFlowImage() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border border-border/70 bg-background/60 p-8 backdrop-blur-sm">
      <DotPattern
        width={18}
        height={18}
        cr={1.1}
        glow
        className="text-blue-500/35 mask-[radial-gradient(ellipse_at_center,black_45%,transparent_85%)]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.28),transparent_46%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.22),transparent_42%)]" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
        <div className="flex flex-col items-center">
          <h3 className="mt-4">
            <CanvasText
              text="Conduit"
              className="block text-8xl leading-[0.95] font-semibold tracking-tight lg:text-8xl font-(family-name:--font-editorial)"
              backgroundClassName="bg-blue-600 dark:bg-blue-700"
              colors={[
                'rgba(0, 153, 255, 1)',
                'rgba(0, 153, 255, 0.9)',
                'rgba(0, 153, 255, 0.8)',
                'rgba(0, 153, 255, 0.7)',
                'rgba(0, 153, 255, 0.6)',
                'rgba(0, 153, 255, 0.5)',
                'rgba(0, 153, 255, 0.4)',
                'rgba(0, 153, 255, 0.3)',
                'rgba(0, 153, 255, 0.2)',
                'rgba(0, 153, 255, 0.1)',
              ]}
              lineGap={4}
              animationDuration={20}
            />
          </h3>
        </div>

        <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
          Set up your account in a few guided steps, then start discovering your internal network.
        </p>
      </div>
    </div>
  )
}
