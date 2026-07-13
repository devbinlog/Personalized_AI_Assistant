import type { ResponseStrategy, PreferenceTag } from '@/types'

export const APP_NAME = 'Personalized AI Assistant'
export const APP_VERSION = '0.1.0'

// Session cookie name
export const SESSION_COOKIE = 'aai_session'

// How many logs to accumulate before regenerating preference memory
export const MEMORY_UPDATE_THRESHOLD = 3

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
  PERSONA_STUDIO: '/persona-studio',
  FLOW_DESIGNER: '/flow-designer',
  DATASETS: '/datasets',
  EXPERIMENTS: '/prompt-lab/experiments',
  GLOBAL_LEARNING: '/dashboard/global-learning',
  RUBRIC: '/dashboard/rubric',
  EXECUTION: '/execution',
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
  CONCISE: 'bg-blue-50 text-blue-700 border-blue-100',
  STRUCTURED: 'bg-slate-50 text-slate-700 border-slate-200',
  PROFESSIONAL: 'bg-slate-50 text-slate-800 border-slate-200',
  ANALYTICAL: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  FRIENDLY: 'bg-green-50 text-green-700 border-green-100',
  ACTIONABLE: 'bg-orange-50 text-orange-700 border-orange-100',
  EDUCATIONAL: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  CREATIVE: 'bg-pink-50 text-pink-700 border-pink-100',
  DIRECT: 'bg-red-50 text-red-700 border-red-100',
  COMPREHENSIVE: 'bg-slate-50 text-slate-800 border-slate-200',
}
