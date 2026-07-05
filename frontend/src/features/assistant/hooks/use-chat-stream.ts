'use client'

import { useChat } from 'ai/react'
import { useState, useCallback, useRef } from 'react'
import type { Message } from 'ai'
import type { ConversationMode, TaskAnalysis } from '@/types'
import type { AttachedFile } from '../components/chat-input'

interface LearningResponse {
  mode: 'LEARNING'
  candidates: Array<{ strategy: string; content: string; index: number }>
  taskAnalysis: TaskAnalysis
  conversationId: string
  messageId: string
}

interface ChatMeta {
  conversationId: string | null
  messageId: string | null
  strategy: string | null
  confidence: number | null
  taskType: string | null
  searchUsed: boolean
}

export function useChatStream(
  mode: ConversationMode,
  conversationId?: string,
  onConversationCreated?: (id: string) => void,
  onStreamFinish?: (text: string) => void,
  initialMessages?: Message[],
) {
  const [meta, setMeta] = useState<ChatMeta>({
    conversationId: conversationId ?? null,
    messageId: null,
    strategy: null,
    confidence: null,
    taskType: null,
    searchUsed: false,
  })
  const [learningCandidates, setLearningCandidates] = useState<LearningResponse | null>(null)
  const [isLearningLoading, setIsLearningLoading] = useState(false)

  // Maps ai-message-id → database message id for XAI panel lookups
  const [messageIdMap, setMessageIdMap] = useState<Record<string, string>>({})
  const pendingDbMessageId = useRef<string | null>(null)
  const messagesRef = useRef<Message[]>([])

  const chat = useChat({
    api: '/api/chat',
    body: { mode, conversationId: meta.conversationId },
    initialMessages,
    onResponse: (response) => {
      const newConvId = response.headers.get('X-Conversation-Id')
      const messageId = response.headers.get('X-Message-Id')
      const strategy = response.headers.get('X-Strategy')
      const confidence = response.headers.get('X-Confidence')
      const taskType = response.headers.get('X-Task-Type')
      const searchUsed = response.headers.get('X-Search-Used') === 'true'

      if (newConvId && newConvId !== meta.conversationId) {
        setMeta(prev => ({ ...prev, conversationId: newConvId }))
        onConversationCreated?.(newConvId)
      }

      pendingDbMessageId.current = messageId ?? null

      setMeta(prev => ({
        ...prev,
        messageId: messageId ?? null,
        strategy: strategy ?? null,
        confidence: confidence ? parseFloat(confidence) : null,
        taskType: taskType ?? null,
        searchUsed,
      }))
    },
    onFinish: (message) => {
      if (pendingDbMessageId.current) {
        setMessageIdMap(prev => ({ ...prev, [message.id]: pendingDbMessageId.current! }))
        pendingDbMessageId.current = null
      }
      const text = typeof message.content === 'string' ? message.content : ''
      if (text) onStreamFinish?.(text)
    },
    onError: (err) => {
      console.error('Chat stream error:', err)
    },
  })

  // Keep messages ref in sync for history access inside callbacks
  messagesRef.current = chat.messages

  const submitNormal = useCallback((files?: AttachedFile[]) => {
    const opts = files && files.length > 0 ? { body: { files } } : undefined
    chat.handleSubmit(undefined, opts)
  }, [chat])

  // Used by voice mode: bypasses the `input` state, sends text directly via append
  const submitNormalWithText = useCallback((text: string, files?: AttachedFile[]) => {
    const bodyExtra = files && files.length > 0 ? { files } : {}
    chat.append(
      { role: 'user', content: text },
      { body: bodyExtra },
    )
  }, [chat])

  const sendLearningMessage = useCallback(async (userMessage: string, files?: AttachedFile[]) => {
    setIsLearningLoading(true)
    setLearningCandidates(null)

    try {
      // Build history from all existing messages (user message already added to UI by caller)
      const history = messagesRef.current
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: typeof m.content === 'string' ? m.content : '' }))
        .filter(m => m.content !== userMessage || m.role !== 'user') // exclude the just-added user msg

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: userMessage }],
          mode: 'LEARNING',
          conversationId: meta.conversationId,
          files: files && files.length > 0 ? files : undefined,
        }),
      })

      const data: LearningResponse = await response.json()
      setLearningCandidates(data)

      if (data.conversationId && data.conversationId !== meta.conversationId) {
        setMeta(prev => ({ ...prev, conversationId: data.conversationId }))
        onConversationCreated?.(data.conversationId)
      }
    } catch (err) {
      console.error('Learning mode error:', err)
    } finally {
      setIsLearningLoading(false)
    }
  }, [meta.conversationId, onConversationCreated])

  return {
    ...chat,
    meta,
    messageIdMap,
    learningCandidates,
    isLearningLoading,
    sendLearningMessage,
    submitNormal,
    submitNormalWithText,
    clearLearningCandidates: () => setLearningCandidates(null),
  }
}
