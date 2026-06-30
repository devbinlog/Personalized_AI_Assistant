'use client'

import { useChat } from 'ai/react'
import { useState, useCallback, useRef } from 'react'
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

  const chat = useChat({
    api: '/api/chat',
    body: { mode, conversationId: meta.conversationId },
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
      // Associate the completed ai message id with the DB message id
      if (pendingDbMessageId.current) {
        setMessageIdMap(prev => ({ ...prev, [message.id]: pendingDbMessageId.current! }))
        pendingDbMessageId.current = null
      }
    },
    onError: (err) => {
      console.error('Chat stream error:', err)
    },
  })

  const submitNormal = useCallback((files?: AttachedFile[]) => {
    const opts = files && files.length > 0 ? { body: { files } } : undefined
    chat.handleSubmit(undefined, opts)
  }, [chat])

  const sendLearningMessage = useCallback(async (userMessage: string, files?: AttachedFile[]) => {
    setIsLearningLoading(true)
    setLearningCandidates(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
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
    clearLearningCandidates: () => setLearningCandidates(null),
  }
}
