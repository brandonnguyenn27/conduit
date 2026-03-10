import { useQuery } from 'convex/react'
import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useState } from 'react'

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/utils'

import {
  CHAT_QUERY_CONFIG,
  type Slot1Value,
  type Slot2Value,
  type Slot3Value,
  getSlot2Options,
  getSlot3OptionsFromFacets,
} from './chat-query-config'

interface ChatQueryInterfaceProps {
  organizationId: Id<'organizations'> | null
  onSearch?: (slot2: Slot2Value, searchQuery: string) => void
  compact?: boolean
  resultsSlot?: ReactNode
  isSearching?: boolean
}

export function ChatQueryInterface({
  organizationId,
  onSearch,
  compact = false,
  resultsSlot,
  isSearching = false,
}: ChatQueryInterfaceProps) {
  const config = CHAT_QUERY_CONFIG
  const facets = useQuery(
    api.functions.chatQuery.queries.getChatQueryOptions,
    organizationId ? { organizationId } : 'skip'
  )

  const [slot1, setSlot1] = useState<Slot1Value>(() =>
    config.slot1[0]?.value ?? 'alumni'
  )
  const [slot2, setSlot2] = useState<Slot2Value | ''>(() => {
    const opts = getSlot2Options(config.slot1[0]?.value ?? 'alumni', config)
    return opts[0]?.value ?? ''
  })
  const [slot3, setSlot3] = useState<Slot3Value | ''>('')

  const slot2Options = getSlot2Options(slot1, config)
  const slot3Options =
    slot2 && facets
      ? getSlot3OptionsFromFacets(slot2 as Slot2Value, facets)
      : []

  const effectiveSlot2 = slot2Options.some((o) => o.value === slot2)
    ? slot2
    : slot2Options[0]?.value ?? ''
  const effectiveSlot3 = slot3Options.some((o) => o.value === slot3)
    ? slot3
    : ''
  const trimmedSlot3 = effectiveSlot3.trim()
  const canSearch = !!organizationId && trimmedSlot3.length > 0

  function handleSlot1Change(value: Slot1Value) {
    setSlot1(value)
    const nextSlot2Options = getSlot2Options(value, config)
    setSlot2(nextSlot2Options[0]?.value ?? '')
    setSlot3('')
  }

  function handleSlot2Change(value: Slot2Value) {
    setSlot2(value)
    setSlot3('')
  }

  const isLoading = organizationId && facets === undefined
  const hasNoFacets = organizationId && facets === null

  return (
    <motion.div
      layout
      className={cn(
        'font-(family-name:--font-editorial)',
        'flex w-full max-w-6xl flex-wrap items-center gap-6',
        'rounded-xl border border-border',
        'bg-white/70 shadow-sm backdrop-blur-md',
        compact ? 'px-8 py-7' : 'px-12 py-10',
        'dark:bg-zinc-900/70',
        'flex justify-center'
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, layout: { duration: 0.34 } }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex w-full flex-wrap items-center justify-center gap-6">
        <span className="text-foreground shrink-0 text-xl font-medium">
          Find me
        </span>
        <Select value={slot1} onValueChange={(v) => handleSlot1Change(v as Slot1Value)}>
          <SelectTrigger
            className="h-14 min-w-40 border-dashed border-primary/30 bg-transparent text-lg font-medium"
            size="default"
          >
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {config.slot1.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={effectiveSlot2}
          onValueChange={(v) => handleSlot2Change(v as Slot2Value)}
          disabled={slot2Options.length === 0}
        >
          <SelectTrigger
            className="h-14 min-w-48 border-dashed border-primary/30 bg-transparent text-lg font-medium"
            size="default"
          >
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {slot2Options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Combobox
          value={effectiveSlot3}
          onValueChange={(v) => setSlot3(v as Slot3Value)}
          items={slot3Options}
        >
          <ComboboxInput
            className={cn(
              'h-9 min-w-52 border-dashed border-primary/30 bg-transparent text-lg font-medium',
              '**:data-[slot=input-group-control]:text-lg',
              '**:data-[slot=input-group-control]:font-medium',
              '**:data-[slot=input-group-control]:text-foreground',
              '**:data-[slot=input-group-control]:placeholder:text-muted-foreground'
            )}
            disabled={slot3Options.length === 0 || !!isLoading}
            placeholder={
              isLoading
                ? 'Loading...'
                : hasNoFacets
                  ? 'No data yet'
                  : 'Search or select...'
            }
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>No matches found.</ComboboxEmpty>
            <ComboboxList className="max-h-90">
              <ComboboxCollection>
                {(item) => (
                  <ComboboxItem key={item.value} value={item.value}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <HoverBorderGradient
          containerClassName={cn(
            'rounded-xl',
            !canSearch || isSearching ? 'pointer-events-none opacity-50' : undefined
          )}
          as="button"
          onClick={() => {
            if (!canSearch || !effectiveSlot2 || isSearching) return
            onSearch?.(effectiveSlot2 as Slot2Value, trimmedSlot3)
          }}
          aria-disabled={!canSearch || isSearching}
          className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2 h-9 w-24 text-center justify-center "
        >
          {isSearching ? <Spinner className="size-4" /> : 'Search'}
        </HoverBorderGradient>
      </div>
      <AnimatePresence initial={false}>
        {resultsSlot ? (
          <motion.div
            key="search-results-slot"
            className="border-border/70 w-full overflow-hidden border-t"
            initial={{ height: 0, marginTop: 0, paddingTop: 0 }}
            animate={{ height: 'auto', marginTop: 16, paddingTop: 24 }}
            exit={{ height: 0, marginTop: 0, paddingTop: 0 }}
            transition={{ duration: 0.36 }}
          >
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.26, delay: 0.34 }}
            >
              {resultsSlot}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
