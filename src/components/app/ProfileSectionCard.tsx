import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function ProfileSectionCard({
  title,
  children,
  className,
  innerClassName,
}: {
  title: string
  children: ReactNode
  className?: string
  innerClassName?: string
}) {
  return (
    <section
      className={cn(
        'rounded-[24px] overflow-hidden',
        // Outer card shell — full-bleed gradient background
        'bg-linear-to-b from-[#e6f2fa] via-[#6fa7d2] to-[#284990]/70',
        'shadow-[0px_14px_40px_rgba(0,0,0,0.10)]',
        'p-[12px_4px_4px_4px]',
        className,
      )}
    >
      <div className="flex items-center gap-2 px-4 pb-3 pt-1">
        <span className="text-md font-semibold leading-none text-black text-shadow-2xs font-editorial">
          {title}
        </span>
      </div>

      <div
        className={cn(
          'rounded-[20px] bg-[#ffffff]',
          'shadow-[0px_1px_12px_rgba(0,0,0,0.20)]',
          'py-5 pr-6 pl-4',
          innerClassName,
        )}
      >
        {children}
      </div>
    </section>
  )
}

