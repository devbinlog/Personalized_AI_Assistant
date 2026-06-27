export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
  publishedDate?: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  answer?: string
}

export async function searchWeb(query: string, maxResults = 5): Promise<SearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    return { query, results: [], answer: undefined }
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        include_answer: true,
        max_results: maxResults,
      }),
    })

    if (!response.ok) throw new Error(`Tavily error: ${response.status}`)

    const data = await response.json()
    return {
      query,
      results: (data.results ?? []).map((r: Record<string, unknown>) => ({
        title: r.title as string,
        url: r.url as string,
        content: r.content as string,
        score: (r.score as number) ?? 0,
        publishedDate: r.published_date as string | undefined,
      })),
      answer: data.answer,
    }
  } catch (err) {
    console.error('Search failed:', err)
    return { query, results: [] }
  }
}

export function buildSearchContext(response: SearchResponse): string {
  if (response.results.length === 0) return ''

  const sources = response.results
    .slice(0, 3)
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.content.slice(0, 400)}`)
    .join('\n\n')

  return `WEB SEARCH RESULTS for "${response.query}":
${response.answer ? `Summary: ${response.answer}\n\n` : ''}Sources:
${sources}

Use these sources to inform your response. Cite when relevant.`
}
