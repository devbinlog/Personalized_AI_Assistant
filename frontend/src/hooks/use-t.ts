'use client'
import { useAppStore } from '@/stores/app-store'
import { translations } from '@/lib/translations'

export function useT() {
  const language = useAppStore((s) => s.language)
  return (key: string): string => {
    const dict = translations[language] as Record<string, string>
    return dict[key] ?? key
  }
}
