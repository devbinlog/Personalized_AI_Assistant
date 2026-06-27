'use client'

import { Settings, Brain, Search, Lightbulb, BarChart2, Sparkles } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative h-5 w-9 rounded-full transition-colors focus:outline-none"
      style={{ backgroundColor: checked ? '#5e6ad2' : 'rgba(138,143,152,0.3)' }}
    >
      <span
        className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
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
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: '#191a1b', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(113,112,255,0.1)' }}
              >
                <Sparkles className="h-4 w-4" style={{ color: '#7170ff' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#f7f8f8' }}>Learning Mode</p>
                <p style={{ fontSize: '12px', color: '#8a8f98' }}>
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
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: '#191a1b', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(94,106,210,0.1)' }}
              >
                <Search className="h-4 w-4" style={{ color: '#7170ff' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#f7f8f8' }}>Automatic Web Search</p>
                <p style={{ fontSize: '12px', color: '#8a8f98' }}>
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
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: '#191a1b', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(113,112,255,0.08)' }}
              >
                <Lightbulb className="h-4 w-4" style={{ color: '#7170ff' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#f7f8f8' }}>Show Explanations</p>
                <p style={{ fontSize: '12px', color: '#8a8f98' }}>
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
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: '#191a1b', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}
              >
                <BarChart2 className="h-4 w-4" style={{ color: '#10b981' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#f7f8f8' }}>Show Confidence Score</p>
                <p style={{ fontSize: '12px', color: '#8a8f98' }}>
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
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ border: '1px dashed rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.01)' }}
        >
          <Brain className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#62666d' }} />
          <p style={{ fontSize: '12px', color: '#8a8f98', lineHeight: 1.6 }}>
            Settings are saved locally in your browser. The AI learns from your choices automatically — no account required.
          </p>
        </div>
      </div>
    </div>
  )
}
