/**
 * LLM Provider Registry
 *
 * Provider is selected via environment variables:
 *   LLM_PROVIDER=openai | anthropic | google  (default: openai)
 *   OPENAI_API_KEY + OPENAI_MODEL + OPENAI_FAST_MODEL
 *   ANTHROPIC_API_KEY + ANTHROPIC_MODEL + ANTHROPIC_FAST_MODEL
 *   GOOGLE_API_KEY + GOOGLE_MODEL + GOOGLE_FAST_MODEL
 *
 * Switching providers requires ONLY env var changes — zero code changes.
 */

import type { LLMProvider, ProviderName } from './types'
import { OpenAIProvider } from './openai'
import { AnthropicProvider } from './anthropic'
import { GoogleProvider } from './google'
import { MockProvider } from './mock'

function createProvider(): LLMProvider {
  const providerName = (process.env.LLM_PROVIDER ?? 'openai') as ProviderName | 'mock'

  switch (providerName) {
    case 'mock':
      return new MockProvider()

    case 'anthropic':
      return new AnthropicProvider(
        process.env.ANTHROPIC_API_KEY ?? '',
        process.env.ANTHROPIC_MODEL,
        process.env.ANTHROPIC_FAST_MODEL,
      )

    case 'google':
      return new GoogleProvider(
        process.env.GOOGLE_API_KEY ?? '',
        process.env.GOOGLE_MODEL,
        process.env.GOOGLE_FAST_MODEL,
      )

    case 'openai':
    default:
      return new OpenAIProvider(
        process.env.OPENAI_API_KEY ?? '',
        process.env.OPENAI_MODEL,
        process.env.OPENAI_FAST_MODEL,
      )
  }
}

// Singleton — created once per server process
let _provider: LLMProvider | null = null

export function getLLMProvider(): LLMProvider {
  if (!_provider) _provider = createProvider()
  return _provider
}

export { type LLMProvider, type ProviderName }
