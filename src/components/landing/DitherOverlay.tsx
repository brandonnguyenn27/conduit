import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface DitherOverlayProps {
  className?: string
  children: ReactNode
}

export default function DitherOverlay({
  className,
  children,
}: DitherOverlayProps) {
  return <div className={cn('dither-overlay', className)}>{children}</div>
}
