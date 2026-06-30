import { generateText } from 'ai'
import { getLLMProvider } from './provider'
import { prisma } from '@/lib/prisma'

const MIN_MESSAGES = 6

/**
 * 대화 메시지가 MIN_MESSAGES개 이상이고 summary가 없을 때 요약을 생성하여 저장합니다.
 */
export async function maybeSummarizeConversation(conversationId: string): Promise<void> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        summary: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { role: true, content: true },
        },
      },
    })

    if (!conversation) return

    // Early return: not enough messages
    if (conversation.messages.length < MIN_MESSAGES) return

    // Early return: summary already exists
    if (conversation.summary) return

    // Build conversation transcript
    const transcript = conversation.messages
      .map(m => `${m.role === 'USER' ? 'User' : 'AI'}: ${m.content.slice(0, 500)}`)
      .join('\n')

    let summary: string

    try {
      const provider = getLLMProvider()
      const result = await generateText({
        model: provider.getFastModel(),
        system:
          '당신은 대화 요약 전문가입니다. 주어진 대화를 1-2문장으로 간결하게 요약하세요. 핵심 주제와 결론에 집중하세요.',
        prompt: `다음 대화를 1-2문장으로 요약해주세요:\n\n${transcript}`,
        maxTokens: 150,
      })
      summary = result.text.trim()
    } catch {
      // Mock 모드 폴백: 첫 user 메시지 기반 간단 요약
      const firstUserMessage = conversation.messages.find(m => m.role === 'USER')
      const excerpt = firstUserMessage?.content?.slice(0, 100) ?? '알 수 없는 주제'
      summary = `사용자가 '${excerpt}' 에 대해 논의함`
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { summary },
    })
  } catch {
    // 요약 생성 실패 시 조용히 무시 (대화 응답에 영향 없음)
  }
}
