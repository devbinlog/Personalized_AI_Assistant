import type { ResponseStrategy, PreferenceTag } from '@/types'

export const APP_NAME = 'Adaptive AI Assistant'
export const APP_VERSION = '0.1.0'

// Session cookie name
export const SESSION_COOKIE = 'aai_session'

// How many logs to accumulate before regenerating preference memory
export const MEMORY_UPDATE_THRESHOLD = 5

// Number of response candidates in Learning Mode
export const LEARNING_CANDIDATES_COUNT = 3

// Search cache TTL in hours
export const SEARCH_CACHE_TTL_HOURS = 6

// Max conversation history sent to LLM (message pairs)
export const MAX_HISTORY_PAIRS = 10

// Preference Memory — minimum logs needed before memory is generated
export const MIN_LOGS_FOR_MEMORY = 3

// Available response strategies
export const RESPONSE_STRATEGIES: ResponseStrategy[] = [
  'CONCISE',
  'STRUCTURED',
  'PROFESSIONAL',
  'ANALYTICAL',
  'FRIENDLY',
  'ACTIONABLE',
  'EDUCATIONAL',
  'CREATIVE',
  'DIRECT',
  'COMPREHENSIVE',
]

// Available preference tags
export const PREFERENCE_TAGS: PreferenceTag[] = [
  'MORE_STRUCTURED',
  'EASIER_TO_UNDERSTAND',
  'MORE_PROFESSIONAL',
  'BETTER_FORMATTING',
  'BETTER_EXPLANATION',
  'MORE_CONCISE',
  'BETTER_REASONING',
  'FITS_MY_STYLE',
  'MORE_PRACTICAL',
  'BETTER_TONE',
  'MORE_EXAMPLES',
  'MORE_DETAILED',
]

// Navigation routes
export const ROUTES = {
  HOME: '/',
  CHAT: '/chat',
  CHAT_ID: (id: string) => `/chat/${id}`,
  DASHBOARD: '/dashboard',
  PROMPT_LAB: '/prompt-lab',
  INSIGHTS: '/insights',
  SETTINGS: '/settings',
} as const

// API routes
export const API_ROUTES = {
  CHAT: '/api/chat',
  CONVERSATIONS: '/api/conversations',
  PREFERENCES: '/api/preferences',
  MEMORY: '/api/memory',
  EXPLANATION: '/api/explanation',
  SEARCH: '/api/search',
} as const

// Strategy color mapping for UI
export const STRATEGY_COLORS: Record<ResponseStrategy, string> = {
  CONCISE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  STRUCTURED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  PROFESSIONAL: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  ANALYTICAL: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  FRIENDLY: 'bg-green-500/10 text-green-400 border-green-500/20',
  ACTIONABLE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  EDUCATIONAL: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  CREATIVE: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  DIRECT: 'bg-red-500/10 text-red-400 border-red-500/20',
  COMPREHENSIVE: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
}
