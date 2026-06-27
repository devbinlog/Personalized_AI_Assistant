import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'
import type { LLMProvider } from './types'

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai' as const
  readonly model: string
  readonly fastModel: string

  private readonly client: ReturnType<typeof createOpenAI>

  constructor(apiKey: string, model = 'gpt-4o', fastModel = 'gpt-4o-mini') {
    this.model = model
    this.fastModel = fastModel
    this.client = createOpenAI({ apiKey })
  }

  getModel(): LanguageModel {
    return this.client(this.model) as unknown as LanguageModel
  }

  getFastModel(): LanguageModel {
    return this.client(this.fastModel) as unknown as LanguageModel
  }
}
