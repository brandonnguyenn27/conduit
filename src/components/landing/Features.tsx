import { Brain, Heart, KeyRound, Search, Users, Waypoints } from 'lucide-react'

import FeatureCard from './FeatureCard'

const TILT_CLASSES: Record<number, string> = {
  [-3]: 'hover:-rotate-3',
  [-2]: 'hover:-rotate-2',
  [-1]: 'hover:-rotate-1',
  0: '',
  1: 'hover:rotate-1',
  2: 'hover:rotate-2',
  3: 'hover:rotate-3',
}

const features = [
  {
    title: 'People Search',
    description:
      'Search your organization quickly with filters tuned for real profile discovery.',
    icon: <Search className="h-4 w-4" />,
    hoverTilt: 2,
  },
  {
    title: 'Rich Profiles',
    description:
      'Open clean profile pages with relevant work history, education, and strengths at a glance.',
    icon: <Users className="h-4 w-4" />,
    hoverTilt: -2,
  },
  {
    title: 'Saved Connections',
    description:
      'Bookmark coworkers and collaborators so your key network is always one click away.',
    icon: <Heart className="h-4 w-4" />,
    hoverTilt: -1,
  },
  {
    title: 'Org-Aware Discovery',
    description:
      'Explore who is connected to what team so you can route requests and intros efficiently.',
    icon: <Waypoints className="h-4 w-4" />,
    hoverTilt: 3,
  },
  {
    title: 'Verified Profiles (Admin Support)',
    description:
      'Admins can maintain trustworthy profile ownership and verification in the background.',
    icon: <KeyRound className="h-4 w-4" />,
    hoverTilt: -3,
  },
  {
    title: 'Smart Suggestions',
    description:
      'Get relevant coworker suggestions as you explore profiles so warm intros happen faster.',
    icon: <Brain className="h-4 w-4" />,
    hoverTilt: 1,
  },
]

export default function Features() {
  return (
    <section className="mx-auto max-w-6xl overflow-visible px-6 py-16 md:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl tracking-tight text-zinc-950 md:text-4xl">
            Built for everyday people discovery.
          </h2>
          <p className="mt-2 text-sm text-zinc-700">
            Admin tooling exists quietly in the background to keep data reliable.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 overflow-visible">
        {features.map((feature) => {
          const { hoverTilt, ...rest } = feature
          return (
            <div key={feature.title} className="overflow-visible p-6">
              <FeatureCard
                {...rest}
                hoverTiltClass={TILT_CLASSES[hoverTilt]}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
