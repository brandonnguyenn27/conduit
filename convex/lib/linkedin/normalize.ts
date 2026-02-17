import type { NormalizedSearchArrays, NormalizerInput } from './normalizeTypes'
import { normalizeWithClaude } from './normalizeClaude'
import { normalizeWithGemini } from './normalizeGemini'

/**
 * Returns normalized search arrays via the configured LLM (Claude or Gemini).
 * Set LLM_PROVIDER=claude|gemini and the corresponding API key in Convex env.
 * If unset or "off", returns null (caller should use raw arrays).
 */
export async function normalizeSearchArrays(
  input: NormalizerInput
): Promise<NormalizedSearchArrays | null> {
  const provider = process.env.LLM_PROVIDER ?? 'off'
  if (provider === 'off') return null
  const apiKey =
    provider === 'claude'
      ? process.env.ANTHROPIC_API_KEY
      : provider === 'gemini'
        ? process.env.GEMINI_API_KEY
        : undefined
  if (!apiKey) return null
  try {
    if (provider === 'claude') return await normalizeWithClaude(input, apiKey)
    if (provider === 'gemini') return await normalizeWithGemini(input, apiKey)
  } catch {
    return null
  }
  return null
}
