'use client'

import { Settings, Brain, Search, Lightbulb, BarChart2, Sparkles } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 rounded-full transition-colors focus:outline-none',
        checked ? 'bg-primary' : 'bg-muted-foreground/30',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-4',
        )}
      />
    </button>
  )
}

export function SettingsClient() {
  const { mode, setMode, settings, updateSettings } = useAppStore()

  return (
    <div className="flex flex-1 flex-col overflow-auto p-6">
      <div className="mb-6 flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your assistant preferences</p>
        </div>
      </div>

      <div className="max-w-lg space-y-3">
        {/* Mode */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Learning Mode</p>
                <p className="text-xs text-muted-foreground">
                  Show 3 response styles to choose from — teaches the AI your preferences
                </p>
              </div>
            </div>
            <Toggle
              checked={mode === 'LEARNING'}
              onChange={(v) => {
                setMode(v ? 'LEARNING' : 'NORMAL')
                updateSettings({ defaultMode: v ? 'LEARNING' : 'NORMAL' })
              }}
            />
          </div>
        </div>

        {/* Auto search */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <Search className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Automatic Web Search</p>
                <p className="text-xs text-muted-foreground">
                  Let the assistant decide when real-time search would improve its answer
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.autoSearch}
              onChange={(v) => updateSettings({ autoSearch: v })}
            />
          </div>
        </div>

        {/* Show explanations */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Show Explanations</p>
                <p className="text-xs text-muted-foreground">
                  Display &quot;Why this answer?&quot; button after each response
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.showExplanations}
              onChange={(v) => updateSettings({ showExplanations: v })}
            />
          </div>
        </div>

        {/* Show confidence */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <BarChart2 className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Show Confidence Score</p>
                <p className="text-xs text-muted-foreground">
                  Display how well the response matches your preference profile
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.showConfidence}
              onChange={(v) => updateSettings({ showConfidence: v })}
            />
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 flex items-start gap-3">
          <Brain className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Settings are saved locally in your browser. The AI learns from your choices automatically — no account required.
          </p>
        </div>
      </div>
    </div>
  )
}
