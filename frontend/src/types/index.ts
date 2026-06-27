// ─────────────────────────────────────────────
// CORE DOMAIN TYPES
// Source of truth for all feature modules
// ─────────────────────────────────────────────

// ── Task Analysis ──────────────────────────────

export type TaskType =
  | 'CONVERSATION'
  | 'KNOWLEDGE'
  | 'PROGRAMMING'
  | 'WRITING'
  | 'TRANSLATION'
  | 'BRAINSTORMING'
  | 'RESEARCH'
  | 'PLANNING'
  | 'LEARNING'
  | 'PRODUCTIVITY'
  | 'SUMMARIZATION'
  | 'CAREER'
  | 'INTERVIEW'
  | 'DECISION'
  | 'SEARCH_REQUIRED'
  | 'OTHER'

export type ComplexityLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface TaskAnalysis {
  taskType: TaskType
  expectedOutput: string
  complexity: ComplexityLevel
  domain: string
  needsClarification: boolean
  needsWebSearch: boolean
  preferredStyle: string
  confidence: number
}

// ── Response Strategies ────────────────────────

export type ResponseStrategy =
  | 'CONCISE'
  | 'STRUCTURED'
  | 'PROFESSIONAL'
  | 'ANALYTICAL'
  | 'FRIENDLY'
  | 'ACTIONABLE'
  | 'EDUCATIONAL'
  | 'CREATIVE'
  | 'DIRECT'
  | 'COMPREHENSIVE'

export interface ResponseCandidate {
  id: string
  strategy: ResponseStrategy
  content: string
  index: number
  isSelected: boolean
  score?: number
  createdAt: Date
}

// ── Preference System ──────────────────────────

export type PreferenceTag =
  | 'MORE_STRUCTURED'
  | 'EASIER_TO_UNDERSTAND'
  | 'MORE_PROFESSIONAL'
  | 'BETTER_FORMATTING'
  | 'BETTER_EXPLANATION'
  | 'MORE_CONCISE'
  | 'BETTER_REASONING'
  | 'FITS_MY_STYLE'
  | 'MORE_PRACTICAL'
  | 'BETTER_TONE'
  | 'MORE_EXAMPLES'
  | 'MORE_DETAILED'

export interface PreferenceLog {
  id: string
  userId: string
  messageId: string
  candidateId: string
  selectedStrategy: ResponseStrategy
  selectedTags: PreferenceTag[]
  taskType: TaskType
  domain: string
  complexity: ComplexityLevel
  userQuery: string
  createdAt: Date
}

// ── Memory System ──────────────────────────────

export interface PreferenceMemory {
  id: string
  userId: string
  version: number
  preferredTone: string | null
  preferredLength: string | null
  preferredStructure: string | null
  preferredStrategies: ResponseStrategy[]
  avoidedPatterns: string[]
  domainPreferences: Record<string, number>
  strategyWeights: Record<ResponseStrategy, number>
  rawSummary: string | null
  logCount: number
  lastUpdatedAt: Date
}

export interface MemoryDiff {
  field: string
  previousValue: string | null
  currentValue: string | null
  changedAt: Date
}

export interface PreferenceMemoryVersion {
  id: string
  memoryId: string
  version: number
  snapshot: PreferenceMemory
  diff: MemoryDiff[] | null
  triggerLogCount: number
  createdAt: Date
}

// ── Conversation & Messages ────────────────────

export type ConversationMode = 'NORMAL' | 'LEARNING'
export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM'

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  taskAnalysis?: TaskAnalysis
  searchUsed: boolean
  searchQuery?: string
  candidates?: ResponseCandidate[]
  explanation?: ResponseExplanation
  createdAt: Date
}

export interface Conversation {
  id: string
  userId: string
  title: string | null
  mode: ConversationMode
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

// ── Prompt Builder ─────────────────────────────

export interface PromptComponents {
  taskContext: string
  memoryContext: string
  examplesContext: string
  persona: string
  userRequest: string
}

export interface PromptVersion {
  id: string
  userId: string
  version: number
  systemPrompt: string
  components: PromptComponents
  memoryHash: string | null
  tokenCount: number | null
  createdAt: Date
}

// ── XAI — Explainable AI ───────────────────────

export interface ResponseExplanation {
  id: string
  messageId: string
  selectedStrategy: ResponseStrategy
  confidence: number
  memoryInfluence: string[]
  reasoningFactors: string[]
  memorySnapshot: PreferenceMemory | null
  rankingDetails: CandidateRankDetail[] | null
  promptVersion: number | null
  createdAt: Date
}

export interface CandidateRankDetail {
  strategy: ResponseStrategy
  score: number
  reasons: string[]
}

export interface ConfidenceBreakdown {
  preferenceMatch: number
  promptMatch: number
  taskMatch: number
  searchConfidence: number
  recentSimilarity: number
  overall: number
}

// ── Adaptive Preference Manager (Phase 14) ────

export type SuggestionStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'

export interface PreferenceSuggestion {
  id: string
  userId: string
  type: string
  currentValue: string | null
  suggestedValue: string
  rationale: string
  evidenceCount: number
  triggerLogIds: string[]
  status: SuggestionStatus
  respondedAt: Date | null
  createdAt: Date
}

// ── Web Search ─────────────────────────────────

export interface SearchResult {
  title: string
  url: string
  snippet: string
  publishedAt?: string
}

export interface SearchContext {
  query: string
  results: SearchResult[]
  retrievedAt: Date
}

// ── Analytics & Dashboard ──────────────────────

export interface DashboardStats {
  totalConversations: number
  totalMessages: number
  totalPreferenceLogs: number
  learningModeConversations: number
  topStrategies: Array<{ strategy: ResponseStrategy; count: number }>
  topTags: Array<{ tag: PreferenceTag; count: number }>
  memoryVersion: number
  promptVersion: number
  recentActivity: ActivityPoint[]
}

export interface ActivityPoint {
  date: string
  conversations: number
  preferences: number
}

export interface LearningProgress {
  totalLogs: number
  memoryVersion: number
  topStrategy: ResponseStrategy | null
  dominantTone: string | null
  dominantLength: string | null
  dominantStructure: string | null
  weeklyTrend: Array<{ week: string; count: number }>
}

// ── UI State ───────────────────────────────────

export interface StreamState {
  isStreaming: boolean
  content: string
  error: string | null
}

export type ViewMode = 'chat' | 'learning'

export interface AppSettings {
  defaultMode: ConversationMode
  autoSearch: boolean
  showExplanations: boolean
  showConfidence: boolean
}
