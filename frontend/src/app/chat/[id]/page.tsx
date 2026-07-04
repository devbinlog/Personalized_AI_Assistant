import { Metadata } from 'next'
import { ChatInterface } from '@/features/assistant/components/chat-interface'
import { prisma } from '@/lib/prisma'
import { resolveUserId } from '@/lib/resolve-user'

export const metadata: Metadata = { title: 'Chat' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function ConversationPage({ params }: Props) {
  const { id } = await params

  let initialMessages = undefined
  try {
    const userId = await resolveUserId()
    if (userId !== 'anonymous') {
      const conversation = await prisma.conversation.findFirst({
        where: { id, userId },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
        },
      })
      if (conversation?.messages) {
        initialMessages = conversation.messages.map(m => ({
          id: m.id,
          role: m.role.toLowerCase() as 'user' | 'assistant',
          content: m.content,
        }))
      }
    }
  } catch {}

  return <ChatInterface key={id} conversationId={id} initialMessages={initialMessages} />
}
