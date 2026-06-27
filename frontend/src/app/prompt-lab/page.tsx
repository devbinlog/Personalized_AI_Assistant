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
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <FlaskConical className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium">No prompt versions yet</p>
            <p className="text-xs text-muted-foreground">Prompt versions are saved on every conversation</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map(version => {
            const isExpanded = expandedId === version.id
            const components = version.components as Record<string, string>

            return (
              <div key={version.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : version.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-accent/50 transition-colors"
                >
                  <Badge variant="outline" className="text-[10px] shrink-0">v{version.version}</Badge>
                  <p className="flex-1 truncate text-sm text-muted-foreground">
                    {version.systemPrompt.slice(0, 100)}…
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {version.tokenCount && (
                      <span className="text-[10px] text-muted-foreground">~{version.tokenCount} tokens</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-4">
                    {/* Full prompt */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full System Prompt</p>
                        <button
                          onClick={() => copy(version.systemPrompt, version.id)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          {copied === version.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copied === version.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre className="max-h-64 overflow-y-auto rounded-lg bg-muted p-4 text-[11px] leading-relaxed whitespace-pre-wrap font-mono">
                        {version.systemPrompt}
                      </pre>
                    </div>

                    {/* Components breakdown */}
                    {Object.entries(components).filter(([k, v]) => v && k !== 'userRequest').map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{value || '—'}</p>
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
