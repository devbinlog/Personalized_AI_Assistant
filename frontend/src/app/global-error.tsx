'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ko">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">심각한 오류가 발생했습니다</h2>
          <p className="mb-6 text-sm text-gray-500">
            애플리케이션을 불러올 수 없습니다. 페이지를 새로고침해 주세요.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
        </div>
      </body>
    </html>
  )
}
