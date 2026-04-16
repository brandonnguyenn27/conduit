import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/utils'

interface SaveProfileButtonProps {
  profileId: Id<'profiles'>
  organizationId: Id<'organizations'>
  saved: boolean
  loading?: boolean
  className?: string
  iconClassName?: string
  onSave: (args: { profileId: Id<'profiles'>; organizationId: Id<'organizations'> }) => Promise<void>
  onUnsave: (args: { profileId: Id<'profiles'> }) => Promise<void>
}

export function SaveProfileButton({
  profileId,
  organizationId,
  saved,
  loading = false,
  className,
  iconClassName,
  onSave,
  onUnsave,
}: SaveProfileButtonProps) {
  const [isMutating, setIsMutating] = useState(false)

  const queryClient = useQueryClient()

  const isLoading = loading || isMutating

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) return

    setIsMutating(true)

    try {
      if (saved) {
        await onUnsave({ profileId })
        toast.success('Profile removed from saved')
      } else {
        await onSave({ profileId, organizationId })
        toast.success('Profile saved')
      }
      
      await queryClient.invalidateQueries({ queryKey: ['saved-profiles'] })
    } catch (error) {
      toast.error('Failed to update saved status')
      console.error(error)
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={saved ? 'Remove from saved profiles' : 'Save profile'}
      title={saved ? 'Remove from saved profiles' : 'Save profile'}
      className={cn(
        'group relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 transition-colors hover:bg-muted focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        saved && 'border-yellow-400/50 bg-yellow-400/10 hover:bg-yellow-400/20',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={saved ? 'saved' : 'unsaved'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Star
            className={cn(
              'h-4 w-4 transition-colors',
              saved
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
