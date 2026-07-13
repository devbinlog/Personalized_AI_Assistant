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

export type ConversationMode = 'NORMAL' | 'LEARNING' | 'EXECUTION'
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
  flowContext: string
  globalMemoryContext: string
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

// ── User Profile (장기 기억) ────────────────────

export interface UserProfile {
  id: string
  userId: string
  displayName: string | null
  occupation: string | null
  interests: string[]
  goals: string[]
  background: string | null
  language: string
  autoExtract: boolean
  createdAt: Date
  updatedAt: Date
}

// ── Persona Studio ─────────────────────────────

export interface Persona {
  id: string
  name: string
  description: string
  speakingStyle: string
  tone: string
  formalityLevel: number
  humorLevel: number
  empathyLevel: number
  responseLength: string
  pronounPolicy: string
  allowedBehaviors: string[]
  forbiddenBehaviors: string[]
  fallbackBehavior: string
  refusalBehavior: string
  clarificationBehavior: string
  exampleResponses: string[]
  promptFragment: string
  isActive: boolean
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

// ── Conversation Flow Designer ─────────────────

export interface ConversationFlowStep {
  id: string
  name: string
  triggerKeywords: string[]
  instruction: string
  searchPolicy: 'auto' | 'always' | 'never'
  nextStepId?: string
}

export interface ConversationFlow {
  id: string
  name: string
  description: string
  domain: string
  triggerCondition: string
  steps: ConversationFlowStep[]
  fallbackPolicy: string
  clarificationPolicy: string
  errorRecoveryPolicy: string
  searchPolicy: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ── Expanded Evaluation Rubric (18-dimension) ──

export interface ResponseEvaluation {
  id: string
  messageId: string
  candidateId: string
  naturalness: number
  grammar: number
  toneConsistency: number
  personaConsistency: number
  instructionFollowing: number
  factualAccuracy: number
  hallucinationRisk: number
  clarity: number
  structure: number
  completeness: number
  specificity: number
  actionability: number
  readability: number
  formatting: number
  safety: number
  preferenceMatch: number
  searchGrounding: number
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  improvementSuggestions: string[]
  activePersonaId: string | null
  activeFlowId: string | null
  createdAt: Date
}

// ── Prompt A/B Experiments ─────────────────────

export type ExperimentStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED'

export interface PromptExperiment {
  id: string
  name: string
  description: string
  promptA: string
  promptB: string
  testInputs: string[]
  activePersonaId: string | null
  activeFlowId: string | null
  winner: string | null
  status: ExperimentStatus
  createdAt: Date
  updatedAt: Date
  results?: PromptExperimentResult[]
}

export interface PromptExperimentResult {
  id: string
  experimentId: string
  input: string
  outputA: string
  outputB: string
  evaluationA: Partial<ResponseEvaluation>
  evaluationB: Partial<ResponseEvaluation>
  preferredByEvaluator: 'A' | 'B' | 'tie'
  scoreA: number
  scoreB: number
  notes: string
  createdAt: Date
}

// ── Global Learning Pipeline ───────────────────

export interface GlobalPreferenceMemory {
  id: string
  mostSelectedStrategies: Array<{ strategy: ResponseStrategy; count: number }>
  commonReasonTags: Array<{ tag: string; count: number }>
  domainPreferences: Array<{ domain: string; strategy: ResponseStrategy; avgScore: number }>
  globallyAvoidedPatterns: string[]
  highPerformingPatterns: string[]
  lowPerformingPatterns: string[]
  personaPerformance: Array<{ personaId: string; personaName: string; avgScore: number; useCount: number }>
  flowPerformance: Array<{ flowId: string; flowName: string; avgScore: number; useCount: number }>
  summary: string
  totalLogsAnalyzed: number
  updatedAt: Date
}

// ── Dataset Pipeline ───────────────────────────

export type ExportType = 'preference' | 'evaluation' | 'experiment' | 'conversation'
export type ExportFormat = 'json' | 'jsonl' | 'csv'

export interface DatasetExport {
  id: string
  exportType: ExportType
  format: ExportFormat
  filters: Record<string, unknown>
  recordCount: number
  filePath: string | null
  createdAt: Date
}

// ── 실행 모드 (Execution Mode) ─────────────────────────────

export type GoalCategory =
  | 'career'    // 커리어
  | 'learning'  // 학습
  | 'project'   // 프로젝트
  | 'health'    // 건강
  | 'startup'   // 창업
  | 'personal'  // 개인
  | 'general'   // 일반

export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'
export type ItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
export type RecommendationType = 'NEXT_ACTION' | 'REPLANNING' | 'WARNING' | 'INSIGHT'
export type RecommendationStatus = 'PENDING' | 'ACTED' | 'DISMISSED'

export interface ExecutionStep {
  id: string
  milestoneId: string
  title: string
  description: string | null
  instruction: string | null
  order: number
  status: ItemStatus
  isCurrent: boolean
  userNote: string | null
  aiSummary: string | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ExecutionMilestone {
  id: string
  goalId: string
  title: string
  description: string | null
  order: number
  status: ItemStatus
  steps: ExecutionStep[]
  createdAt: Date
  updatedAt: Date
}

export interface ExecutionGoal {
  id: string
  userId: string
  title: string
  description: string | null
  category: GoalCategory
  status: GoalStatus
  progress: number
  context: string | null
  milestones: ExecutionMilestone[]
  createdAt: Date
  updatedAt: Date
}

export interface ExecutionRecommendation {
  id: string
  goalId: string
  stepId: string | null
  content: string
  type: RecommendationType
  status: RecommendationStatus
  createdAt: Date
}

// ── Dataset Pipeline ───────────────────────────

export interface DPORecord {
  prompt: string
  chosen: string
  rejected: string
  chosen_strategy: string
  rejected_strategy: string
  reason_tags: string[]
  task_type: string
  domain: string
}
