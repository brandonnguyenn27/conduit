import { motion } from 'framer-motion'
import { useState } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import {
  CHAT_QUERY_CONFIG,
  type Slot1Value,
  type Slot2Value,
  type Slot3Value,
  getSlot2Options,
  getSlot3Options,
} from './chat-query-config'

export function ChatQueryInterface() {
  const config = CHAT_QUERY_CONFIG
  const [slot1, setSlot1] = useState<Slot1Value>(() =>
    config.slot1[0]?.value ?? 'alumni'
  )
  const [slot2, setSlot2] = useState<Slot2Value | ''>(() => {
    const opts = getSlot2Options(config.slot1[0]?.value ?? 'alumni', config)
    return opts[0]?.value ?? ''
  })
  const [slot3, setSlot3] = useState<Slot3Value | ''>(() => {
    const s1 = config.slot1[0]?.value ?? 'alumni'
    const s2Opts = getSlot2Options(s1, config)
    const s2 = s2Opts[0]?.value
    if (!s2) return ''
    const s3Opts = getSlot3Options(s2, config)
    return s3Opts[0]?.value ?? ''
  })

  const slot2Options = getSlot2Options(slot1, config)
  const slot3Options = slot2 ? getSlot3Options(slot2 as Slot2Value, config) : []

  const effectiveSlot2 = slot2Options.some((o) => o.value === slot2)
    ? slot2
    : slot2Options[0]?.value ?? ''
  const effectiveSlot3 = slot3Options.some((o) => o.value === slot3)
    ? slot3
    : slot3Options[0]?.value ?? ''

  function handleSlot1Change(value: Slot1Value) {
    setSlot1(value)
    const nextSlot2Options = getSlot2Options(value, config)
    setSlot2(nextSlot2Options[0]?.value ?? '')
    const firstSlot2 = nextSlot2Options[0]?.value
    const nextSlot3Options = firstSlot2
      ? getSlot3Options(firstSlot2, config)
      : []
    setSlot3(nextSlot3Options[0]?.value ?? '')
  }

  function handleSlot2Change(value: Slot2Value) {
    setSlot2(value)
    const nextSlot3Options = getSlot3Options(value, config)
    setSlot3(nextSlot3Options[0]?.value ?? '')
  }

  return (
    <motion.div
      className={cn(
        'font-(family-name:--font-editorial)',
        'flex w-full max-w-2xl flex-wrap items-center gap-2',
        'rounded-lg border border-border',
        'bg-white/70 px-4 py-3 shadow-sm backdrop-blur-md',
        'dark:bg-zinc-900/70'
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <span className="text-foreground shrink-0 text-sm font-medium">
        Find me
      </span>
      <Select value={slot1} onValueChange={(v) => handleSlot1Change(v as Slot1Value)}>
        <SelectTrigger
          className="h-9 min-w-28 border-dashed border-primary/30 bg-transparent font-medium"
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
          className="h-9 min-w-32 border-dashed border-primary/30 bg-transparent font-medium"
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
      <Select
        value={effectiveSlot3}
        onValueChange={(v) => setSlot3(v)}
        disabled={slot3Options.length === 0}
      >
        <SelectTrigger
          className="h-9 min-w-32 border-dashed border-primary/30 bg-transparent font-medium"
          size="default"
        >
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {slot3Options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </motion.div>
  )
}
