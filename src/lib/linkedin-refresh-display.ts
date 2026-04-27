const MS_PER_DAY = 86400000

export type LinkedInRefreshQueryState = {
  pendingSince?: number
  lastCompletedAt?: number
  cooldownMs: number
}

export function getLinkedInRefreshUiState(
  now: number,
  state: LinkedInRefreshQueryState | null | undefined,
) {
  if (state === null || state === undefined) {
    return {
      isPending: false,
      cooldownDaysRemaining: 0,
      canRequest: false,
      showCooldownMessage: false,
    }
  }

  if (state.pendingSince !== undefined) {
    return {
      isPending: true,
      cooldownDaysRemaining: 0,
      canRequest: false,
      showCooldownMessage: false,
    }
  }

  const last = state.lastCompletedAt
  if (last === undefined) {
    return {
      isPending: false,
      cooldownDaysRemaining: 0,
      canRequest: true,
      showCooldownMessage: false,
    }
  }

  const eligibleAt = last + state.cooldownMs
  if (now >= eligibleAt) {
    return {
      isPending: false,
      cooldownDaysRemaining: 0,
      canRequest: true,
      showCooldownMessage: false,
    }
  }

  return {
    isPending: false,
    cooldownDaysRemaining: Math.max(0, Math.ceil((eligibleAt - now) / MS_PER_DAY)),
    canRequest: false,
    showCooldownMessage: true,
  }
}
