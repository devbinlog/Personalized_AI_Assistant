import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// isDefault가 false인 사용자 생성 페르소나만 삭제
// 기본 5개(isDefault: true)는 유지
export async function DELETE() {
  await prisma.persona.deleteMany({ where: { isDefault: false } })
  // 모든 페르소나 비활성화
  await prisma.persona.updateMany({ data: { isActive: false } as never })

  return NextResponse.json({ ok: true })
}
