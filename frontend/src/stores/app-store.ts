'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ConversationMode, AppSettings } from '@/types'

interface AppState {
  sessionId: string | null
  mode: ConversationMode
  settings: AppSettings

  setSessionId: (id: string) => void
  setMode: (mode: ConversationMode) => void
  updateSettings: (partial: Partial<AppSettings>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sessionId: null,
      mode: 'NORMAL',
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
