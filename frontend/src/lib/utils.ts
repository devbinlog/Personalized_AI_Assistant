import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ResponseStrategy, PreferenceTag, TaskType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(d)
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '…'
}

export function strategyLabel(strategy: ResponseStrategy): string {
  const labels: Record<ResponseStrategy, string> = {
    CONCISE: 'Concise',
    STRUCTURED: 'Structured',
    PROFESSIONAL: 'Professional',
    ANALYTICAL: 'Analytical',
    FRIENDLY: 'Friendly',
    ACTIONABLE: 'Actionable',
    EDUCATIONAL: 'Educational',
    CREATIVE: 'Creative',
    DIRECT: 'Direct',
    COMPREHENSIVE: 'Comprehensive',
  }
  return labels[strategy] ?? strategy
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
