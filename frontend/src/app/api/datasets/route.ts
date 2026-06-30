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

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const exports = await prisma.datasetExport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ exports })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { exportType, format, filters = {} } = await req.json()

    let data: unknown[] = []
    if (exportType === 'preference') {
      data = await exportPreferenceDataset(filters as Parameters<typeof exportPreferenceDataset>[0])
    } else if (exportType === 'evaluation') {
      data = await exportEvaluationDataset(filters as Parameters<typeof exportEvaluationDataset>[0])
    } else if (exportType === 'conversation') {
      data = await exportConversationDataset(filters as Parameters<typeof exportConversationDataset>[0])
    } else {
      return NextResponse.json({ error: 'Unknown exportType' }, { status: 400 })
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
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
