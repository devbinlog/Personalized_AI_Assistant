export function speakText(text: string, lang = 'ko-KR'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()

  // Strip markdown so speech sounds natural
  const cleaned = text
    .replace(/```[\s\S]*?```/g, '코드 블록')
    .replace(/`[^`]+`/g, m => m.slice(1, -1))
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[-*+]\s/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim()

  const utterance = new SpeechSynthesisUtterance(cleaned)
  utterance.lang = lang
  utterance.rate = 1.05
  utterance.pitch = 1.0
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
