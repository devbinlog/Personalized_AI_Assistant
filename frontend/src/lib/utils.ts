import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ResponseStrategy, PreferenceTag, TaskType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  return formatDate(d)
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '…'
}

export function strategyLabel(strategy: ResponseStrategy | string): string {
  const labels: Record<string, string> = {
    CONCISE: '간결한 답변',
    STRUCTURED: '구조적 정리',
    PROFESSIONAL: '전문적 어조',
    ANALYTICAL: '분석적 설명',
    FRIENDLY: '친근한 어조',
    ACTIONABLE: '실행 중심',
    EDUCATIONAL: '교육적 설명',
    CREATIVE: '창의적 접근',
    DIRECT: '직접적 답변',
    COMPREHENSIVE: '종합적 답변',
  }
  return labels[strategy?.toUpperCase()] ?? strategy
}

export function memoryFieldLabel(field: string | null | undefined, type: 'tone' | 'length' | 'structure'): string {
  if (!field) return '—'
  const maps: Record<string, Record<string, string>> = {
    tone: {
      professional: '전문적', friendly: '친근한', neutral: '중립적',
      casual: '캐주얼', formal: '격식체', conversational: '대화체',
    },
    length: {
      concise: '간결하게', medium: '적당히', detailed: '상세하게',
      short: '짧게', long: '길게',
    },
    structure: {
      paragraph: '단락형', 'bullet-points': '불릿 포인트', 'step-by-step': '단계별',
      structured: '구조적 정리', mixed: '혼합형',
    },
  }
  return maps[type][field.toLowerCase()] ?? field
}

export function tagLabel(tag: PreferenceTag): string {
  const labels: Record<PreferenceTag, string> = {
    MORE_STRUCTURED: '구조적으로 정리됨',
    EASIER_TO_UNDERSTAND: '이해하기 쉬움',
    MORE_PROFESSIONAL: '전문적인 느낌',
    BETTER_FORMATTING: '포맷이 좋음',
    BETTER_EXPLANATION: '설명이 명확함',
    MORE_CONCISE: '간결함',
    BETTER_REASONING: '논리적임',
    FITS_MY_STYLE: '내 스타일과 맞음',
    MORE_PRACTICAL: '실용적임',
    BETTER_TONE: '어조가 좋음',
    MORE_EXAMPLES: '예시가 풍부함',
    MORE_DETAILED: '상세한 설명',
  }
  return labels[tag] ?? tag
}

export function taskTypeLabel(type: TaskType): string {
  const labels: Record<TaskType, string> = {
    CONVERSATION: 'Conversation',
    KNOWLEDGE: 'Knowledge',
    PROGRAMMING: 'Programming',
    WRITING: 'Writing',
    TRANSLATION: 'Translation',
    BRAINSTORMING: 'Brainstorming',
    RESEARCH: 'Research',
    PLANNING: 'Planning',
    LEARNING: 'Learning',
    PRODUCTIVITY: 'Productivity',
    SUMMARIZATION: 'Summarization',
    CAREER: 'Career',
    INTERVIEW: 'Interview Prep',
    DECISION: 'Decision Making',
    SEARCH_REQUIRED: 'Search Required',
    OTHER: 'Other',
  }
  return labels[type] ?? type
}

export function confidencePercent(score: number): string {
  return `${Math.round(score * 100)}%`
}

export function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function parseJsonSafe<T>(value: unknown, fallback: T): T {
  if (typeof value === 'object' && value !== null) return value as T
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return fallback
}
