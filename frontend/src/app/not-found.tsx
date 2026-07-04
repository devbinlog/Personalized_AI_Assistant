import Link from 'next/link'
import { Brain, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Brain className="h-7 w-7 text-slate-500" />
        </div>
        <p className="mb-2 text-7xl font-black tracking-tighter text-slate-900">404</p>
        <h1 className="mb-3 text-xl font-bold text-slate-900">페이지를 찾을 수 없습니다</h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-500">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
