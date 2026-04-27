/** Default when `LINKEDIN_REFRESH_COOLDOWN_MS` is unset (7 days). */
export const DEFAULT_LINKEDIN_REFRESH_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Cooldown duration for LinkedIn self-service refresh. Set `LINKEDIN_REFRESH_COOLDOWN_MS`
 * on the Convex deployment (dev vs prod).
 */
export function getLinkedInRefreshCooldownMs(): number {
  const raw = process.env.LINKEDIN_REFRESH_COOLDOWN_MS
  if (raw === undefined || raw === '') {
    return DEFAULT_LINKEDIN_REFRESH_COOLDOWN_MS
  }
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 0) {
    return DEFAULT_LINKEDIN_REFRESH_COOLDOWN_MS
  }
  return n
}

export function cooldownDaysRemainingFromNow(args: {
  now: number
  lastCompletedAt: number | undefined
  cooldownMs: number
}): number {
  const { now, lastCompletedAt, cooldownMs } = args
  if (lastCompletedAt === undefined) return 0
  const eligibleAt = lastCompletedAt + cooldownMs
  if (now >= eligibleAt) return 0
  return Math.max(0, Math.ceil((eligibleAt - now) / MS_PER_DAY))
}
