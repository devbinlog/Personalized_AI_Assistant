/**
 * Mock LLM Provider — rule-based, not random.
 *
 * Generates deterministic, strategy-specific responses so the full
 * pipeline (Learning Mode → Preference Memory → Dashboard → XAI)
 * can be validated without any API key.
 *
 * Set LLM_PROVIDER=mock in .env.local to activate.
 */
import type { LanguageModel } from 'ai'
import type { LLMProvider } from './types'

function createMockModel(strategy = 'default'): LanguageModel {
  return {
    specificationVersion: 'v1',
    provider: 'mock',
    modelId: `mock-${strategy}`,
    defaultObjectGenerationMode: 'json',

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async doGenerate(options: any) {
      const prompt = options.prompt ?? []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastUserMsg = [...prompt].reverse().find((m: any) => m.role === 'user')
      const userText = lastUserMsg?.content
        ? Array.isArray(lastUserMsg.content)
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            lastUserMsg.content.map((p: any) => p.text ?? '').join('')
          : String(lastUserMsg.content)
        : 'your question'

      const text = generateMockText(userText, strategy)

      return {
        text,
        finishReason: 'stop',
        usage: { promptTokens: 50, completionTokens: Math.ceil(text.length / 4) },
        rawCall: { rawPrompt: '', rawSettings: {} },
        rawResponse: undefined,
        warnings: [],
        request: {},
        response: { id: 'mock', timestamp: new Date(), modelId: `mock-${strategy}` },
        logprobs: undefined,
        providerMetadata: undefined,
        toolCalls: [],
        reasoning: undefined,
        files: [],
        sources: [],
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async doStream(options: any) {
      const model = createMockModel(strategy)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (model as any).doGenerate(options)
      const text: string = result.text ?? ''
      const words = text.split(' ')

      return {
        stream: new ReadableStream({
          start(controller) {
            let i = 0
            const interval = setInterval(() => {
              if (i < words.length) {
                controller.enqueue({ type: 'text-delta', textDelta: (i === 0 ? '' : ' ') + words[i] })
                i++
              } else {
                controller.enqueue({ type: 'finish', finishReason: 'stop', usage: { promptTokens: 50, completionTokens: words.length }, providerMetadata: undefined })
                controller.close()
                clearInterval(interval)
              }
            }, 25)
          },
        }),
        rawCall: { rawPrompt: '', rawSettings: {} },
        rawResponse: undefined,
        warnings: [],
        request: {},
      }
    },
  } as unknown as LanguageModel
}

function generateMockText(userMessage: string, strategy: string): string {
  const topic = userMessage.slice(0, 60)

  switch (strategy.toUpperCase()) {
    case 'STRUCTURED':
      return `Here is a structured overview of "${topic}":

## Key Points

1. **Main Concept** — The core idea is straightforward and well-defined.
2. **Important Context** — Several factors must be considered when approaching this.
3. **Practical Application** — Apply it as follows:
   - Step 1: Assess the situation clearly
   - Step 2: Identify key variables
   - Step 3: Take deliberate action

## Summary

Understanding "${topic}" requires balancing theory with practical implications. This structured approach ensures thorough coverage.`

    case 'CONCISE':
      return `**Short answer:** "${topic}" comes down to a few key things.

Focus on fundamentals first. Two things matter most: clarity and action. Start there and expand as needed.`

    case 'PROFESSIONAL':
      return `From a professional standpoint, "${topic}" warrants careful analysis.

**Assessment:** This requires systematic evaluation. Primary considerations include scope, impact, and feasibility. Based on best practices, the recommended approach involves establishing clear objectives before applying proven methodologies.

**Recommendation:** Proceed with a structured framework that accounts for key variables. Maintain documentation throughout.`

    case 'ANALYTICAL':
      return `**Analysis of "${topic}":**

**Root Causes:**
- Primary driver: foundational domain understanding
- Secondary factor: contextual variables
- Tertiary: long-term implications

**Tradeoffs:**
| Approach A | Approach B |
|---|---|
| Faster execution | More thorough |
| Less overhead | Higher quality |

**Conclusion:** Optimal path depends on priorities. Speed → A. Quality → B.`

    case 'FRIENDLY':
      return `Great question about "${topic}"!

Here's the thing — this is simpler than it looks. Think of it like explaining to a friend: the basics matter more than the advanced stuff. Start small, be consistent, don't overthink it. You've got this!`

    case 'ACTIONABLE':
      return `**Immediate next steps for "${topic}":**

→ **Now:** Identify the single most important thing to address.
→ **Today:** Set up a simple tracking system.
→ **This week:** Review what's working and adjust.
→ **This month:** Evaluate outcomes and iterate.

**Start with step one.** Everything else follows.`

    default:
      return `Regarding "${topic}": The answer involves understanding core concepts first, then applying them to your situation. Take a balanced approach that considers both immediate needs and long-term goals. Would you like me to dive deeper on any specific aspect?`
  }
}

export class MockProvider implements LLMProvider {
  readonly name = 'openai' as const
  readonly model = 'mock-model'
  readonly fastModel = 'mock-model-fast'

  getModel(): LanguageModel {
    return createMockModel()
  }

  getFastModel(): LanguageModel {
    return createMockModel('analytical')
  }
}
