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

export async function searchWeb(
  query: string,
  maxResults = 7,
  days = 90,
): Promise<SearchResponse> {
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
        search_depth: 'advanced',
        include_answer: true,
        max_results: maxResults,
        days,        // Tavily: limit results to last N days (valid param)
        topic: 'news', // prioritize recent news content
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error(`Tavily error ${response.status}:`, body)
      // Fallback: retry without topic/days for broader results
      return searchWebFallback(query, maxResults)
    }

    const data = await response.json()

    const results: SearchResult[] = (data.results ?? []).map((r: Record<string, unknown>) => ({
      title: r.title as string,
      url: r.url as string,
      content: r.content as string,
      score: (r.score as number) ?? 0,
      publishedDate: r.published_date as string | undefined,
    }))

    // Sort newest first (API doesn't guarantee order)
    results.sort((a, b) => {
      if (!a.publishedDate && !b.publishedDate) return 0
      if (!a.publishedDate) return 1
      if (!b.publishedDate) return -1
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    })

    return { query, results, answer: data.answer }
  } catch (err) {
    console.error('Search failed:', err)
    return { query, results: [] }
  }
}

async function searchWebFallback(query: string, maxResults: number): Promise<SearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY!
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
    if (!response.ok) return { query, results: [] }
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
  } catch {
    return { query, results: [] }
  }
}

export function buildSearchContext(response: SearchResponse): string {
  if (response.results.length === 0) return ''

  const now = new Date()
  const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  const sources = response.results
    .slice(0, 5)
    .map((r, i) => {
      const date = r.publishedDate
        ? ` [${new Date(r.publishedDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}]`
        : ''
      return `[${i + 1}] ${r.title}${date}\n${r.content.slice(0, 600)}`
    })
    .join('\n\n')

  return `WEB SEARCH RESULTS (searched on ${dateStr}) for "${response.query}":
${response.answer ? `Summary: ${response.answer}\n\n` : ''}Sources (최신순):
${sources}

IMPORTANT: These are real-time search results fetched today (${dateStr}), sorted newest-first. Prioritize these over your training data. Cite publication dates when relevant.`
}
