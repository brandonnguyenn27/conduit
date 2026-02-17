import type { NormalizedSearchArrays, NormalizerInput } from './normalizeTypes'
import { buildUserMessage, parseNormalizerResponse, SYSTEM_PROMPT } from './normalizePrompt'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

export async function normalizeWithClaude(
  input: NormalizerInput,
  apiKey: string
): Promise<NormalizedSearchArrays> {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user' as const, content: buildUserMessage(input) }],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${res.status} ${err}`)
  }
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> }
  const text = data.content?.[0]?.text
  if (!text) throw new Error('Claude API: no text in response')
  return parseNormalizerResponse(text)
}
