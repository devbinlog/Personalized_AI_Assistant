'use client'

import { useEffect, useState } from 'react'
import { FlaskConical, RefreshCw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PromptVersion {
  id: string
  version: number
  systemPrompt: string
  components: Record<string, string>
  tokenCount: number | null
  createdAt: string
}

export default function PromptLabPage() {
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/prompt-versions')
      .then(r => r.json())
      .then(data => setVersions(data.versions ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Prompt Lab</h1>
            <p className="text-sm text-muted-foreground">
              Inspect how your preferences dynamically shape every system prompt
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsLoading(true)
            fetch('/api/prompt-versions').then(r => r.json()).then(d => setVersions(d.versions ?? [])).finally(() => setIsLoading(false))
          }}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {versions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl p-12 text-center"
          style={{ border: '1px dashed rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.01)' }}
        >
          <FlaskConical className="h-8 w-8" style={{ color: 'rgba(138,143,152,0.4)' }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#f7f8f8' }}>No prompt versions yet</p>
            <p style={{ fontSize: '12px', color: '#8a8f98' }}>Prompt versions are saved on every conversation</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map(version => {
            const isExpanded = expandedId === version.id
            const components = version.components as Record<string, string>

            return (
              <div
                key={version.id}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#191a1b' }}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : version.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Badge variant="default" className="shrink-0">v{version.version}</Badge>
                  <p className="flex-1 truncate" style={{ fontSize: '13px', color: '#8a8f98' }}>
                    {version.systemPrompt.slice(0, 100)}…
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {version.tokenCount && (
                      <span style={{ fontSize: '10px', color: '#62666d' }}>~{version.tokenCount} tokens</span>
                    )}
                    <span style={{ fontSize: '10px', color: '#62666d' }}>
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4" style={{ color: '#62666d' }} />
                      : <ChevronDown className="h-4 w-4" style={{ color: '#62666d' }} />}
                  </div>
                </button>

                {isExpanded && (
                  <div
                    className="p-5 space-y-4"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {/* Full prompt */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 500,
                            color: '#62666d',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          Full System Prompt
                        </p>
                        <button
                          onClick={() => copy(version.systemPrompt, version.id)}
                          className="flex items-center gap-1 transition-colors"
                          style={{ fontSize: '10px', color: '#62666d' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#8a8f98')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#62666d')}
                        >
                          {copied === version.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copied === version.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre
                        className="max-h-64 overflow-y-auto rounded-lg p-4 font-mono leading-relaxed whitespace-pre-wrap"
                        style={{
                          backgroundColor: '#0f1011',
                          border: '1px solid rgba(255,255,255,0.08)',
                          fontSize: '11px',
                          color: '#d0d6e0',
                        }}
                      >
                        {version.systemPrompt}
                      </pre>
                    </div>

                    {/* Components breakdown */}
                    {Object.entries(components).filter(([k, v]) => v && k !== 'userRequest').map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p
                          style={{
                            fontSize: '10px',
                            fontWeight: 500,
                            color: '#62666d',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}
                        >
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <div
                          className="rounded-lg p-3"
                          style={{ border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                        >
                          <p
                            className="whitespace-pre-wrap"
                            style={{ fontSize: '12px', color: '#8a8f98' }}
                          >
                            {value || '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
