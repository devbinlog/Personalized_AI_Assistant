import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (existing) {
    return NextResponse.json({ error: '관리자 계정이 이미 존재합니다.' }, { status: 409 })
  }

  const hashed = await hash('admin1234!', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@adaptive-ai.com',
      password: hashed,
      name: '관리자',
      role: 'ADMIN',
    },
  })

  return NextResponse.json({ ok: true, email: admin.email })
}
