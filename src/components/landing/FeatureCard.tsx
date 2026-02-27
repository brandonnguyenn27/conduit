import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface FeatureCardProps {
  title: string
  description: string
  icon: ReactNode
  hoverTiltClass?: string
}

export default function FeatureCard({
  title,
  description,
  icon,
  hoverTiltClass = 'hover:rotate-1',
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        'group rounded-xl border border-zinc-300/90 bg-zinc-50/90 p-5 shadow-lg shadow-zinc-900/5 transition-transform duration-300 will-change-transform hover:-translate-y-4 hover:scale-[1.03] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)]',
        hoverTiltClass
      )}
    >
      <div className="mb-4 flex items-center gap-3 text-zinc-900">
        <div className="rounded-full border border-zinc-300 bg-white p-2">{icon}</div>
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="dither-overlay mb-4 rounded-lg border border-zinc-300 transition-transform duration-300 group-hover:scale-[1.06] group-hover:-rotate-[0.6deg]">
        <div className="dither-threshold relative z-0 flex aspect-video items-center justify-center bg-linear-to-br from-zinc-200 to-zinc-300 text-xs uppercase tracking-[0.2em] text-zinc-700">
          Placeholder Image
        </div>
      </div>
      <p className="text-sm leading-relaxed text-zinc-700">{description}</p>
    </article>
  )
}
