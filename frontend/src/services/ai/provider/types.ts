import type { LanguageModel } from 'ai'

export type ProviderName = 'openai' | 'anthropic' | 'google'

export interface LLMProvider {
  readonly name: ProviderName
  readonly model: string
  readonly fastModel: string
  getModel(): LanguageModel
  getFastModel(): LanguageModel
}
