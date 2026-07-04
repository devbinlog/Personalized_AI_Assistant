import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  // Require SEED_SECRET header for protection
  const seedSecret = process.env.SEED_SECRET
  if (!seedSecret) {
    return NextResponse.json({ error: 'SEED_SECRET not configured' }, { status: 500 })
  }
  const authHeader = req.headers.get('x-seed-secret')
  if (authHeader !== seedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  // Admin account
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@adaptive-ai.com' } })
  if (!existingAdmin) {
    const hashed = await hash('admin1234!', 12)
    await prisma.user.create({
      data: {
        email: 'admin@adaptive-ai.com',
        password: hashed,
        name: '관리자',
        role: 'ADMIN',
      },
    })
    results.push('admin@adaptive-ai.com created')
  } else {
    results.push('admin@adaptive-ai.com already exists')
  }

  // Demo account
  const existingDemo = await prisma.user.findUnique({ where: { email: 'demo@adaptive-ai.com' } })
  if (!existingDemo) {
    const hashed = await hash('demo1234!', 12)
    await prisma.user.create({
      data: {
        email: 'demo@adaptive-ai.com',
        password: hashed,
        name: '데모 사용자',
        role: 'USER',
      },
    })
    results.push('demo@adaptive-ai.com created')
  } else {
    results.push('demo@adaptive-ai.com already exists')
  }

  return NextResponse.json({ ok: true, results })
}
