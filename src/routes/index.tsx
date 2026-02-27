import { createFileRoute } from '@tanstack/react-router'

import CTA from '@/components/landing/CTA'
import Features from '@/components/landing/Features'
import Footer from '@/components/landing/Footer'
import Hero from '@/components/landing/Hero'
import ValueProp from '@/components/landing/ValueProp'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="landing-page min-h-screen bg-linear-to-b from-zinc-100 via-zinc-100 to-zinc-200">
      <Hero />
      <ValueProp />
      <Features />
      <CTA />
      <Footer />
    </main>
  )
}
