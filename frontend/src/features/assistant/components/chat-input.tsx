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
  type: 'image' | 'text'
  content: string   // base64 for image, plain text for text files
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
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)

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
      onChange(value ? `${value} ${transcript}` : transcript)
      // Auto-resize textarea
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
    <div className="border-t border-slate-200 bg-white px-4 py-3">
      <div className="mx-auto max-w-3xl space-y-2">
        {/* File previews */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600"
              >
                {f.type === 'image'
                  ? <ImageIcon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  : <FileText className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                  : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500',
              )}
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
              'flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100',
              'min-h-[44px] max-h-[200px]',
              (disabled || busy) && 'opacity-60',
            )}
          />

          <div className="flex items-end pb-0.5">
            {busy ? (
              <button
                onClick={onStop}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={(!value.trim() && attachedFiles.length === 0) || disabled}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400">
          Enter로 전송 · Shift+Enter 줄바꿈 · 파일 첨부 최대 3개{speechSupported ? ' · 🎤 음성 입력 지원' : ''}
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
