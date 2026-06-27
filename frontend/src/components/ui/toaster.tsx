'use client'

// Minimal toast implementation — swap for sonner in Phase 12 Polish
import { useState, createContext, useContext, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'default' | 'success' | 'error'
}

interface ToastContextValue {
  toast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within Toaster')
  return ctx
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: Toast['type'] = 'default') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur',
              'animate-fade-in min-w-[280px] max-w-[420px]',
              t.type === 'error' && 'border-destructive/50 bg-destructive/10 text-destructive-foreground',
              t.type === 'success' && 'border-green-500/50 bg-green-500/10 text-green-400',
              t.type === 'default' && 'border-border bg-card text-card-foreground',
            )}
          >
            <span className="flex-1 text-sm">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
