import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'

import { api } from '../../../convex/_generated/api'

export const Route = createFileRoute('/demo/convex')({
  ssr: false,
  component: ConvexDemo,
})

function ConvexDemo() {
  const organizations = useQuery(api.organizations.list)

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'linear-gradient(135deg, #667a56 0%, #8fbc8f 25%, #90ee90 50%, #98fb98 75%, #f0fff0 100%)',
      }}
    >
      <div className="w-full max-w-2xl">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-green-200/50 p-8 mb-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-green-800 mb-2">
              Convex Demo
            </h1>
            <p className="text-green-600 text-lg">Organizations (real-time)</p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-green-200/50 overflow-hidden">
          {organizations === undefined ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4" />
              <p className="text-green-600">Loading...</p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                No organizations yet
              </h3>
              <p className="text-green-600">
                Create one via the Convex dashboard or a mutation.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-green-100">
              {organizations.map((org) => (
                <li key={org._id} className="p-4 text-gray-800">
                  <span className="font-medium">{org.name}</span>
                  <span className="text-green-600 text-sm ml-2">
                    /{org.slug}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-green-700/80 text-sm">
            Built with Convex • Real-time updates
          </p>
        </div>
      </div>
    </div>
  )
}
