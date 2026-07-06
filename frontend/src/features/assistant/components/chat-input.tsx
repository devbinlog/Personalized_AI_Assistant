'use client'

import { useRef, useCallback, useState, useEffect, type KeyboardEvent } from 'react'
import { Send, Square, Paperclip, X, FileText, Image as ImageIcon, Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'

// Web Speech API types (not in default TS lib)
interface SpeechRecognitionResult {
  readonly [index: number]: SpeechRecognitionAlternative
  readonly isFinal: boolean
  readonly length: number
}
interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}
interface SpeechRecognitionEvent extends Event {
  readonly results: { [index: number]: SpeechRecognitionResult; length: number }
}
interface ISpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition
    webkitSpeechRecognition?: new () => ISpeechRecognition
  }
}

export interface AttachedFile {
  name: string
  type: 'image' | 'text' | 'pdf'
  content: string   // base64 for image/pdf, plain text for text files
  mimeType: string
}

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (files?: AttachedFile[]) => void
  onStop?: () => void
  isStreaming?: boolean
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
}

const ACCEPTED = '.txt,.md,.ts,.tsx,.js,.jsx,.py,.json,.csv,.pdf,image/*'
const MAX_TEXT_BYTES = 50_000

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  isLoading,
  disabled,
  placeholder = '무엇이든 물어보세요…',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const attachedFilesRef = useRef<AttachedFile[]>([])
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)

  // Keep ref in sync for use inside STT callbacks
  attachedFilesRef.current = attachedFiles

  useEffect(() => {
    setSpeechSupported(
      typeof window !== 'undefined' &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    )
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return

    const rec = new SpeechRecognitionCtor()
    rec.lang = 'ko-KR'
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      if (!transcript.trim()) return

      const newValue = value ? `${value} ${transcript}` : transcript
      onChange(newValue)
      requestAnimationFrame(() => {
        const el = textareaRef.current
        if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 200)}px` }
      })
    }
    rec.onerror = () => setIsRecording(false)
    rec.onend = () => setIsRecording(false)

    recognitionRef.current = rec
    rec.start()
    setIsRecording(true)
  }, [isRecording, value, onChange])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (!isStreaming && !isLoading && value.trim()) {
          onSubmit(attachedFiles.length > 0 ? attachedFiles : undefined)
          setAttachedFiles([])
        }
      }
    },
    [isStreaming, isLoading, value, onSubmit, attachedFiles],
  )

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null)
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const results: AttachedFile[] = []
    for (const file of files.slice(0, 3)) {
      if (file.type.startsWith('image/')) {
        const base64 = await readAsBase64(file)
        results.push({ name: file.name, type: 'image', content: base64, mimeType: file.type })
      } else if (file.type === 'application/pdf') {
        if (file.size > 10_000_000) {
          setFileError(`${file.name} PDF가 너무 큽니다 (최대 10MB)`)
          continue
        }
        const base64 = await readAsBase64(file)
        results.push({ name: file.name, type: 'pdf', content: base64, mimeType: 'application/pdf' })
      } else {
        if (file.size > MAX_TEXT_BYTES) {
          setFileError(`${file.name} 파일이 너무 큽니다 (최대 50KB)`)
          continue
        }
        const text = await file.text()
        results.push({ name: file.name, type: 'text', content: text, mimeType: file.type || 'text/plain' })
      }
    }
    setAttachedFiles(prev => [...prev, ...results].slice(0, 3))
    e.target.value = ''
  }

  function removeFile(index: number) {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  function handleSend() {
    if (!value.trim() && attachedFiles.length === 0) return
    onSubmit(attachedFiles.length > 0 ? attachedFiles : undefined)
    setAttachedFiles([])
  }

  const busy = isStreaming || isLoading

  return (
    <div className="px-4 py-3" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <div className="mx-auto max-w-3xl space-y-2">
        {/* File previews */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
              >
                {f.type === 'image'
                  ? <ImageIcon className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                  : <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: f.type === 'pdf' ? '#ef4444' : 'var(--color-text-secondary)' }} />
                }
                <span className="max-w-[140px] truncate">{f.name}</span>
                <button
                  onClick={() => removeFile(i)}
                  className="ml-0.5 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {fileError && (
          <p className="text-xs text-red-500">{fileError}</p>
        )}

        <div className="flex items-end gap-2">
          {/* File attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy || disabled || attachedFiles.length >= 3}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
            title="파일 첨부 (이미지, 텍스트, 코드)"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Voice input button */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              disabled={busy || disabled}
              title={isRecording ? '녹음 중지' : '음성 입력'}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                isRecording
                  ? 'border-red-300 bg-red-50 text-red-500 hover:bg-red-100'
                  : 'text-[#9ca3af] hover:border-[#94a3b8] hover:text-[#334155] dark:hover:text-slate-300',
              )}
              style={!isRecording ? { borderColor: 'var(--color-border)' } : undefined}
            >
              {isRecording ? (
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <span className="absolute h-4 w-4 animate-ping rounded-full bg-red-400 opacity-60" />
                  <MicOff className="h-3.5 w-3.5" />
                </span>
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => {
              onChange(e.target.value)
              handleInput()
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || busy}
            placeholder={placeholder}
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-colors min-h-[44px] max-h-[200px] placeholder:text-[var(--color-text-muted)]',
              (disabled || busy) && 'opacity-60',
            )}
            style={{
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,181,253,0.2)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none' }}
          />

          <div className="flex items-end pb-0.5">
            {busy ? (
              <button
                onClick={onStop}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition-colors"
                style={{ backgroundColor: '#334155' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#475569')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#334155')}
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={(!value.trim() && attachedFiles.length === 0) || disabled}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#334155' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#475569' }}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#334155')}
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
          Enter로 전송 · Shift+Enter 줄바꿈 · 파일 첨부 최대 3개
          {speechSupported ? ' · 🎤 음성 입력 지원' : ''}
        </p>
      </div>
    </div>
  )
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
