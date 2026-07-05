import { prisma } from '@/lib/prisma'
import { getLLMProvider } from './provider'
import { generateText } from 'ai'

// 사용자 메시지에서 성격/스타일 자기 묘사 패턴 감지
const SELF_DESCRIPTION_PATTERNS = [
  /나는\s+.{2,50}(이야|야|이에요|에요|사람이야|성격이야|편이야|스타일이야)/,
  /저는\s+.{2,50}(이에요|예요|사람이에요|성격이에요|편이에요|스타일이에요)/,
  /나\s*(는|는요)?\s*.{2,30}(좋아해|싫어해|선호해|원해|원하는 편)/,
  /내\s*성격\s*(은|이)?/,
  /내\s*스타일\s*(은|이)?/,
  /나는\s+.{2,30}(타입|유형|스타일)/,
  /i (am|prefer|like|hate|love|tend to).{5,80}/i,
  /i'm (a|the|very|quite|pretty|rather|not).{5,60}/i,
  /my (personality|style|preference|approach|way).{5,60}/i,
]

export function hasSelfDescription(message: string): boolean {
  return SELF_DESCRIPTION_PATTERNS.some(p => p.test(message))
}

export async function extractAndSavePersonality(
  userId: string,
  userMessage: string,
): Promise<void> {
  if (!hasSelfDescription(userMessage)) return

  try {
    const provider = getLLMProvider()
    const model = provider.getFastModel()

    const { text } = await generateText({
      model,
      prompt: `Extract personality/preference trait from this user message. Return ONLY a JSON object.

User message: "${userMessage.slice(0, 500)}"

Return format: {"relevant": true/false, "trait": "1-2 sentence description in Korean"}

Rules:
- relevant=true ONLY if the message clearly describes their personality, communication style, or preferences
- trait should be a useful note for personalizing AI responses
- Keep trait concise (under 50 characters in Korean)
- If not relevant, return {"relevant": false, "trait": ""}`,
    })

    let parsed: { relevant: boolean; trait: string }
    try {
      const jsonMatch = text.match(/\{[^}]+\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { relevant: false, trait: '' }
    } catch {
      return
    }

    if (!parsed.relevant || !parsed.trait) return

    // 기존 background에 추가 (중복 방지)
    const existing = await prisma.userProfile.findUnique({
      where: { userId },
      select: { background: true },
    })

    const currentBackground = existing?.background ?? ''
    const alreadySaved = currentBackground.includes(parsed.trait.slice(0, 15))
    if (alreadySaved) return

    const newNote = `[사용자 특성] ${parsed.trait}`
    const updatedBackground = currentBackground
      ? `${currentBackground}\n${newNote}`
      : newNote

    await prisma.userProfile.upsert({
      where: { userId },
      create: { userId, background: updatedBackground },
      update: { background: updatedBackground },
    })
  } catch {
    // 추출 실패는 조용히 무시 (응답에 영향 없음)
  }
}
