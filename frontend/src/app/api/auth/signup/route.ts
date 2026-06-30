import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { email, password, name } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력하세요.' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 })
  }

  const hashed = await hash(password, 12)
  const user = await prisma.user.create({
    data: { email, password: hashed, name: name || null },
  })

  return NextResponse.json({ ok: true, userId: user.id })
}
