import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Compass, Search, Users } from 'lucide-react'

import { cn } from '@/lib/utils'

type StackCard = {
  title: string
  body: string
  icon: LucideIcon
}

const cards: StackCard[] = [
  {
    title: 'Discover',
    body: 'Search alumni or members by name, skill, title, school, or company and get to the right person fast.',
    icon: Search,
  },
  {
    title: 'Connect',
    body: 'See rich profile context instantly so introductions and cross-team outreach feel effortless.',
    icon: Users,
  },
  {
    title: 'Navigate',
    body: 'Explore alumni and members to find warm connections, mentorship paths, and referral opportunities.',
    icon: Compass,
  },
]

const desktopTransforms = [
  'md:-translate-x-16 md:translate-y-10 md:-rotate-6',
  'md:translate-x-0 md:translate-y-0 md:rotate-0',
  'md:translate-x-16 md:translate-y-10 md:rotate-6',
]

export default function ValueProp3DStack() {
  return (
    <div className="value-stack-perspective relative mx-auto flex w-full max-w-5xl flex-col items-center gap-4 py-4 md:min-h-88 md:flex-row md:justify-center">
      {cards.map((card, index) => {
        const Icon = card.icon
        const zIndex = 30 - index * 10
        return (
          <motion.article
            key={card.title}
            tabIndex={0}
            whileHover={{
              y: -30,
              z: 80,
              scale: 1.08,
              rotateZ: index === 0 ? -6.5 : index === 2 ? 6.5 : 0,
              rotateX: 8,
              rotateY: index === 1 ? 0 : index === 0 ? 10 : -10,
            }}
            whileFocus={{ y: -18, z: 50, scale: 1.05, rotateX: 5 }}
            transition={{ type: 'tween', duration: 0.08, ease: 'linear' }}
            className={cn(
              'value-stack-card dither-overlay relative w-full max-w-sm rounded-2xl border border-zinc-300/90 bg-zinc-50/90 p-6 shadow-xl shadow-zinc-900/10 transition-transform duration-300 will-change-transform hover:shadow-2xl hover:shadow-zinc-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700/30 md:absolute md:w-82',
              desktopTransforms[index]
            )}
            style={{ zIndex }}
          >
            <div className="relative z-10">
              <div className="mb-4 inline-flex rounded-full border border-zinc-300 bg-white p-2 text-zinc-900">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-xl font-semibold tracking-tight text-zinc-950">
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-700">{card.body}</p>
            </div>
          </motion.article>
        )
      })}
    </div>
  )
}
