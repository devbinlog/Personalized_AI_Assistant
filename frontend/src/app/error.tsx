'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
        <AlertTriangle className="h-7 w-7 text-red-400" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-slate-900">오류가 발생했습니다</h2>
      <p className="mb-6 text-sm text-slate-500">
        일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
      >
        <RefreshCw className="h-4 w-4" />
        다시 시도
      </button>
    </div>
  )
}
