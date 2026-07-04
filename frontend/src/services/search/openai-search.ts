import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type { SearchResponse } from './tavily'

export async function searchWithOpenAI(query: string): Promise<SearchResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { query, results: [] }

  try {
    const client = createOpenAI({ apiKey })

    const { text, sources } = await generateText({
      model: client.responses('gpt-4o-mini'),
      prompt: `Search for the most recent and accurate information about: "${query}".
Provide a comprehensive and up-to-date summary with specific facts, dates, rankings, or data.
If the query is in Korean, respond in Korean.`,
      tools: {
        web_search_preview: client.tools.webSearchPreview({
          searchContextSize: 'high',
        }),
      },
      toolChoice: 'required',
    })

    // Map sources to unified SearchResult format
    const mappedSources = (sources ?? []).map(
      (s: { title?: string; url?: string }, i: number) => ({
        title: s.title ?? `검색 결과 ${i + 1}`,
        url: s.url ?? '',
        content: text,
        score: Math.max(0.5, 1.0 - i * 0.05),
        publishedDate: new Date().toISOString().split('T')[0],
      }),
    )

    if (mappedSources.length === 0) {
      mappedSources.push({
        title: query,
        url: '',
        content: text,
        score: 1.0,
        publishedDate: new Date().toISOString().split('T')[0],
      })
    }

    return { query, results: mappedSources, answer: text }
  } catch (err) {
    console.error('OpenAI search failed:', err)
    return { query, results: [] }
  }
}
