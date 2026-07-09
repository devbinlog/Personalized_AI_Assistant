'use client'
import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 다크모드 비활성화 — 항상 라이트모드
    document.documentElement.classList.remove('dark')
  }, [])
  return <>{children}</>
}
