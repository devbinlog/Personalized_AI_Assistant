'use client'

import { useState } from 'react'
import { Database, Download, FileJson, FileText } from 'lucide-react'

type ExportConfig = {
  exportType: 'preference' | 'evaluation' | 'conversation'
  format: 'json' | 'jsonl' | 'csv'
  limit: number
}

const EXPORT_TYPES = [
  {
    type: 'preference' as const,
    label: 'Preference Dataset',
    description: 'DPO-format dataset with chosen/rejected response pairs from user selections',
    icon: '🎯',
  },
  {
    type: 'evaluation' as const,
    label: 'Evaluation Dataset',
    description: '18-dimension quality scores per message for rubric analysis and model training',
    icon: '📊',
  },
  {
    type: 'conversation' as const,
    label: 'Conversation Dataset',
    description: 'Full conversation histories with role-labeled messages',
    icon: '💬',
  },
]

export default function DatasetsPage() {
  const [config, setConfig] = useState<ExportConfig>({
    exportType: 'preference',
    format: 'json',
    limit: 1000,
  })
  const [exporting, setExporting] = useState(false)
  const [lastExport, setLastExport] = useState<{ count: number; type: string; format: string } | null>(null)

  async function doExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exportType: config.exportType, format: config.format, filters: { limit: config.limit } }),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Export failed')
        return
      }

      const count = parseInt(res.headers.get('X-Record-Count') || '0')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${config.exportType}_${Date.now()}.${config.format}`
      a.click()
      URL.revokeObjectURL(url)
      setLastExport({ count, type: config.exportType, format: config.format })
    } finally {
      setExporting(false)
    }
  }

  const selected = EXPORT_TYPES.find(t => t.type === config.exportType)!

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dataset Export</h1>
            <p className="text-sm text-slate-500">
              Export training data for fine-tuning and analysis
            </p>
          </div>
        </div>

        {/* Export type selection */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Dataset Type
          </label>
          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {EXPORT_TYPES.map(t => (
              <div
                key={t.type}
                onClick={() => setConfig(c => ({ ...c, exportType: t.type }))}
                className={`rounded-xl border p-5 cursor-pointer transition-all hover:shadow-sm ${
                  config.exportType === t.type
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="text-xl mb-2">{t.icon}</div>
                <div className={`text-sm font-semibold mb-1 ${config.exportType === t.type ? 'text-indigo-700' : 'text-slate-900'}`}>{t.label}</div>
                <div className="text-[11px] text-slate-500 leading-snug">{t.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Format + limit */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Output Format</label>
              <div className="flex gap-2">
                {(['json', 'jsonl', 'csv'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setConfig(c => ({ ...c, format: f }))}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      config.format === f
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                    }`}
                  >
                    {f === 'json' || f === 'jsonl' ? <FileJson className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Record Limit</label>
              <input
                type="number"
                value={config.limit}
                min={1}
                max={10000}
                onChange={e => setConfig(c => ({ ...c, limit: parseInt(e.target.value) || 1000 }))}
                className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Export button */}
        <div className="flex items-center gap-4">
          <button
            onClick={doExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : `Export ${selected.label}`}
          </button>

          {/* Last export info */}
          {lastExport && (
            <div className="px-4 py-2.5 rounded-xl border border-emerald-100 bg-emerald-50">
              <span className="text-sm text-emerald-700">
                Exported {lastExport.count} records as {lastExport.format.toUpperCase()} ({lastExport.type})
              </span>
            </div>
          )}
        </div>

        {/* Format descriptions */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Format Guide
          </div>
          <div className="space-y-2">
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">JSON</span> — Pretty-printed array, ideal for inspection
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">JSONL</span> — One record per line, optimized for LLM fine-tuning pipelines
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">CSV</span> — Spreadsheet-compatible, good for analysis in Excel/Sheets
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
