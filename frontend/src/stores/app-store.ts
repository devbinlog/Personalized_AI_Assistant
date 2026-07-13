'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ConversationMode, AppSettings } from '@/types'

interface AppState {
  sessionId: string | null
  mode: ConversationMode
  settings: AppSettings
  chatResetKey: number
  sidebarRefreshKey: number
  theme: 'light' | 'dark'
  language: 'ko' | 'en'
  executionGoalId: string | null      // null = 실행 모드 OFF
  executionGoalTitle: string | null   // 사이드바 표시용

  setSessionId: (id: string) => void
  setMode: (mode: ConversationMode) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  resetChat: () => void
  refreshSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setLanguage: (language: 'ko' | 'en') => void
  setExecutionGoal: (goalId: string | null, title?: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sessionId: null,
      mode: 'NORMAL',
      chatResetKey: 0,
      sidebarRefreshKey: 0,
      theme: 'light',
      language: 'ko',
      executionGoalId: null,
      executionGoalTitle: null,
      settings: {
        defaultMode: 'NORMAL',
        autoSearch: true,
        showExplanations: true,
        showConfidence: true,
      },

      setSessionId: (id) => set({ sessionId: id }),
      setMode: (mode) => set({ mode }),
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
      resetChat: () => set((state) => ({ chatResetKey: state.chatResetKey + 1 })),
      refreshSidebar: () => set((state) => ({ sidebarRefreshKey: state.sidebarRefreshKey + 1 })),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setExecutionGoal: (goalId, title = null) => set({ executionGoalId: goalId, executionGoalTitle: title }),
    }),
    {
      name: 'aai-app-state',
      partialize: (state) => ({
        sessionId: state.sessionId,
        mode: state.mode,
        settings: state.settings,
        theme: state.theme,
        language: state.language,
        executionGoalId: state.executionGoalId,
        executionGoalTitle: state.executionGoalTitle,
      }),
    },
  ),
)
