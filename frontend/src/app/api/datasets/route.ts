import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  exportPreferenceDataset,
  exportEvaluationDataset,
  exportConversationDataset,
  toJSON,
  toJSONL,
  toCSV,
  recordExport,
} from '@/services/data/dataset-exporter'
import type { ExportFormat } from '@/types'
import { resolveUserId } from '@/lib/resolve-user'

export const dynamic = 'force-dynamic'

const ALLOWED_EXPORT_TYPES = ['preference', 'evaluation', 'conversation'] as const
type AllowedExportType = typeof ALLOWED_EXPORT_TYPES[number]

export async function GET() {
  const userId = await resolveUserId()
  if (userId === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const exports = await prisma.datasetExport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ exports })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = await resolveUserId()
  if (userId === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { exportType, format, filters = {} } = await req.json()

    if (!ALLOWED_EXPORT_TYPES.includes(exportType as AllowedExportType)) {
      return NextResponse.json({ error: 'Invalid exportType. Must be one of: preference, evaluation, conversation' }, { status: 400 })
    }

    let data: unknown[] = []
    if (exportType === 'preference') {
      data = await exportPreferenceDataset(filters as Parameters<typeof exportPreferenceDataset>[0])
    } else if (exportType === 'evaluation') {
      data = await exportEvaluationDataset(filters as Parameters<typeof exportEvaluationDataset>[0])
    } else if (exportType === 'conversation') {
      data = await exportConversationDataset(filters as Parameters<typeof exportConversationDataset>[0])
    }

    await recordExport(exportType, format as ExportFormat, data.length, filters as Record<string, unknown>)

    let content = ''
    let contentType = 'application/json'
    if (format === 'json') {
      content = toJSON(data)
    } else if (format === 'jsonl') {
      content = toJSONL(data)
      contentType = 'application/jsonl'
    } else if (format === 'csv') {
      content = toCSV(data as Record<string, unknown>[])
      contentType = 'text/csv'
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${exportType}_${Date.now()}.${format}"`,
        'X-Record-Count': String(data.length),
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
