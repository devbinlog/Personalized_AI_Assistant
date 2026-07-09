import { NextRequest } from 'next/server'
import { runExperimentWithProgress, getExperimentResults } from '@/services/ai/experiment-runner'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          // client disconnected
        }
      }

      try {
        await runExperimentWithProgress(id, result => {
          send({ type: 'progress', ...result })
        })

        const row = await prisma.promptExperiment.findUniqueOrThrow({ where: { id } })
        const results = await getExperimentResults(id)
        send({
          type: 'complete',
          experiment: {
            ...row,
            testInputs: JSON.parse((row.testInputs as string) || '[]'),
            results,
          },
        })
      } catch (e) {
        send({ type: 'error', message: String(e) })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
