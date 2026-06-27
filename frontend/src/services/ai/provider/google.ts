import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'
import type { LLMProvider } from './types'

export class GoogleProvider implements LLMProvider {
  readonly name = 'google' as const
  readonly model: string
  readonly fastModel: string

  private readonly client: ReturnType<typeof createGoogleGenerativeAI>

  constructor(
    apiKey: string,
    model = 'gemini-2.5-pro',
    fastModel = 'gemini-2.0-flash',
  ) {
    this.model = model
    this.fastModel = fastModel
    this.client = createGoogleGenerativeAI({ apiKey })
  }

  getModel(): LanguageModel {
    return this.client(this.model) as unknown as LanguageModel
  }

  getFastModel(): LanguageModel {
    return this.client(this.fastModel) as unknown as LanguageModel
  }
}
