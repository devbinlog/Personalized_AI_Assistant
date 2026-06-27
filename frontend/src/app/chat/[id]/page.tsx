import { Metadata } from 'next'
import { ChatInterface } from '@/features/assistant/components/chat-interface'

export const metadata: Metadata = { title: 'Chat' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function ConversationPage({ params }: Props) {
  const { id } = await params

  let initialMessages = undefined
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/conversations/${id}`, {
      cache: 'no-store',
    })
    const data = await res.json()
    if (data.conversation?.messages) {
      initialMessages = data.conversation.messages.map((m: { id: string; role: string; content: string }) => ({
        id: m.id,
        role: m.role.toLowerCase(),
        content: m.content,
      }))
    }
  } catch {}

  return <ChatInterface conversationId={id} initialMessages={initialMessages} />
}
