import { useQueryClient } from '@tanstack/react-query'
import { useMutation, useQuery } from 'convex/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/utils'

interface SaveProfileButtonProps {
  profileId: Id<'profiles'>
  organizationId: Id<'organizations'>
  className?: string
  iconClassName?: string
}

export function SaveProfileButton({
  profileId,
  organizationId,
  className,
  iconClassName,
}: SaveProfileButtonProps) {
  const isSaved = useQuery(api.functions.savedProfiles.queries.isSaved, {
    profileId,
  })

  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null)

  const addMutation = useMutation(api.functions.savedProfiles.mutations.add)
  const removeMutation = useMutation(api.functions.savedProfiles.mutations.remove)
  const queryClient = useQueryClient()

  const effectivelySaved = optimisticSaved !== null ? optimisticSaved : isSaved
  const isLoading = isSaved === undefined

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) return

    const nextState = !effectivelySaved
    setOptimisticSaved(nextState)

    try {
      if (nextState) {
        await addMutation({ profileId, organizationId })
        toast.success('Profile saved')
      } else {
        // Optimistically remove from any saved-profiles cache to prevent double-layered UI changes
        queryClient.setQueriesData({ queryKey: ['saved-profiles'] }, (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData
          return oldData.filter((p) => p._id !== profileId)
        })

        await removeMutation({ profileId })
        toast.success('Profile removed from saved')
      }
      
      // Invalidate TanStack query cache so saved.tsx route knows it's stale
      queryClient.invalidateQueries({ queryKey: ['saved-profiles'] })
    } catch (error) {
      // Revert optimistic state on failure
      setOptimisticSaved(null)
      toast.error('Failed to update saved status')
      console.error(error)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={effectivelySaved ? 'Remove from saved profiles' : 'Save profile'}
      title={effectivelySaved ? 'Remove from saved profiles' : 'Save profile'}
      className={cn(
        'group relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 transition-colors hover:bg-muted focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        effectivelySaved && 'border-yellow-400/50 bg-yellow-400/10 hover:bg-yellow-400/20',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={effectivelySaved ? 'saved' : 'unsaved'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Star
            className={cn(
              'h-4 w-4 transition-colors',
              effectivelySaved
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-foreground group-hover:text-foreground/80',
              iconClassName
            )}
          />
        </motion.div>
      </AnimatePresence>
    </button>
  )
}
