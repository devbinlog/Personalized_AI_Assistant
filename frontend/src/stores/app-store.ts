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

  setSessionId: (id: string) => void
  setMode: (mode: ConversationMode) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  resetChat: () => void
  refreshSidebar: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sessionId: null,
      mode: 'NORMAL',
      chatResetKey: 0,
      sidebarRefreshKey: 0,
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
    }),
    {
      name: 'aai-app-state',
      partialize: (state) => ({
        sessionId: state.sessionId,
        mode: state.mode,
        settings: state.settings,
      }),
    },
  ),
)
