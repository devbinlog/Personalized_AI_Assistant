import { Metadata } from 'next'
import { ChatInterface } from '@/features/assistant/components/chat-interface'

export const metadata: Metadata = { title: 'Chat' }

export default function ChatPage() {
  return <ChatInterface />
}
