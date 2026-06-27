import { createAnthropic } from '@ai-sdk/anthropic'
import type { LanguageModel } from 'ai'
import type { LLMProvider } from './types'

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic' as const
  readonly model: string
  readonly fastModel: string

  private readonly client: ReturnType<typeof createAnthropic>

  constructor(
    apiKey: string,
    model = 'claude-sonnet-4-6',
    fastModel = 'claude-haiku-4-5-20251001',
  ) {
    this.model = model
    this.fastModel = fastModel
    this.client = createAnthropic({ apiKey })
  }

  getModel(): LanguageModel {
    return this.client(this.model) as LanguageModel
  }

  getFastModel(): LanguageModel {
    return this.client(this.fastModel) as LanguageModel
  }
}
