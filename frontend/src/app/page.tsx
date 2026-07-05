import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'

const FEATURES = [
  {
    num: '01',
    title: '학습 모드',
    desc: '같은 질문에 전략이 다른 응답 3가지를 생성합니다. 사용자가 선택한 응답과 태그가 선호도 데이터로 축적됩니다.',
  },
  {
    num: '02',
    title: '일반 모드',
    desc: '학습이 충분히 쌓이면 3가지 후보를 자동 평가·랭킹 후 최적 응답을 실시간 스트리밍합니다.',
  },
  {
    num: '03',
    title: '선호도 메모리',
    desc: 'LLM이 누적된 선택 로그를 분석해 어조, 길이, 스타일 선호도를 자연어 프로파일로 합성합니다.',
  },
  {
    num: '04',
    title: '9차원 평가 & A/B 테스팅',
    desc: '명확성, 완성도, 구조, 특이성, 선호도 매칭 등 9개 차원으로 응답을 정량 평가하고, 두 프롬프트를 동일 입력에 비교합니다.',
  },
  {
    num: '05',
    title: 'XAI — 왜 이 답변인가',
    desc: '어떤 메모리가 반영됐는지, 페르소나·플로우가 어떤 영향을 미쳤는지, 각 후보 점수를 투명하게 설명합니다.',
  },
  {
    num: '06',
    title: '페르소나 스튜디오',
    desc: '어조, 격식, 유머, 공감 레벨, 허용/금지 행동을 정의한 AI 페르소나를 만들고 활성화합니다.',
  },
  {
    num: '07',
    title: '대화 플로우 디자이너',
    desc: '도메인별 트리거 조건과 단계별 지시사항으로 대화 흐름을 설계하고 실시간 시뮬레이션으로 검증합니다.',
  },
  {
    num: '08',
    title: '전역 학습 파이프라인',
    desc: '모든 사용자의 선호도를 집계해 고성과·저성과 패턴을 전역 메모리로 합성합니다.',
  },
  {
    num: '09',
    title: '데이터셋 내보내기',
    desc: '선호도 로그를 DPO 형식, 평가 데이터를 루브릭 형식으로 내보냅니다. JSON, JSONL, CSV 지원.',
  },
]

const PIPELINE = [
  { step: '태스크 분석', desc: '질문 유형 분류, 웹 검색 필요 여부 판단, 복잡도 평가' },
  { step: '컨텍스트 조립', desc: '개인 메모리 + 활성 페르소나 + 플로우 + 전역 패턴을 우선순위대로 조합' },
  { step: '후보 생성', desc: '구조화·서술형·간결형 전략으로 3가지 응답 동시 생성' },
  { step: '9차원 평가', desc: '명확성, 완성도, 구조, 특이성, 선호도 매칭 등 정량 채점' },
  { step: '랭킹 & 스트리밍', desc: '선호도 가중 점수로 최적 후보 선택 후 실시간 전송' },
]

const STACK = [
  'Next.js 15', 'TypeScript 5', 'LangGraph 0.2', 'FastAPI',
  'Vercel AI SDK v4', 'Prisma 5', 'PostgreSQL', 'NextAuth',
  'Zustand', 'TanStack Query', 'Recharts',
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ───────────────────────────────── */}
      <section className="px-8 pb-32 pt-44">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-8 text-[72px] font-black leading-[1.0] tracking-tighter text-black lg:text-[96px]">
            대화를 통해<br />발전해가는 AI
          </h1>
          <p className="mb-10 max-w-md text-lg leading-relaxed text-black/40">
            3가지 응답 후보 중 선택할수록 AI가 취향을 학습하고,<br />
            알맞은 최적 답변을 자동 생성합니다.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
            >
              채팅 시작하기
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-black/35 transition-colors hover:text-black"
            >
              대시보드 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────── */}
      <section className="border-t border-black/8 px-8 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-14 text-4xl font-black tracking-tighter text-black">핵심 기능</h2>
          <div className="grid grid-cols-1 border-l border-t border-black/8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.num} className="border-b border-r border-black/8 p-6">
                <span className="mb-4 block text-[11px] font-semibold tracking-wider text-black/25">
                  {f.num}
                </span>
                <h3 className="mb-2 text-sm font-bold text-black">{f.title}</h3>
                <p className="text-xs leading-relaxed text-black/45">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline ───────────────────────────── */}
      <section className="border-t border-black/8 px-8 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-14 text-4xl font-black tracking-tighter text-black">응답 파이프라인</h2>
          <div className="divide-y divide-black/8 border-y border-black/8">
            {PIPELINE.map((p, i) => (
              <div key={i} className="flex items-baseline gap-8 py-5">
                <span className="w-6 shrink-0 text-xs font-semibold text-black/25">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="w-36 shrink-0 text-sm font-bold text-black">{p.step}</span>
                <span className="text-sm text-black/45">{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ─────────────────────────── */}
      <section className="border-t border-black/8 px-8 py-24">
        <div className="mx-auto max-w-5xl flex flex-col gap-10 lg:flex-row lg:items-start">
          <h2 className="shrink-0 text-4xl font-black tracking-tighter text-black lg:w-52">
            기술<br />스택
          </h2>
          <div className="flex flex-wrap gap-2">
            {STACK.map(t => (
              <span
                key={t}
                className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black/55"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────── */}
      <section className="border-t border-black/8 px-8 py-24">
        <div className="mx-auto max-w-5xl flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-5xl font-black leading-tight tracking-tighter text-black">
            직접<br />경험해보세요.
          </h2>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 self-start rounded-full bg-slate-700 px-8 py-4 text-sm font-semibold text-white transition-colors hover:bg-slate-600 lg:self-auto"
          >
            채팅 시작하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────── */}
      <footer className="border-t border-black/8 px-8 py-8">
        <div className="mx-auto max-w-5xl flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <span className="text-sm font-black tracking-tight text-black">Adaptive AI</span>
          <p className="text-xs text-black/35">김태빈 · devbinlog8@gmail.com</p>
          <div className="flex items-center gap-5 text-xs text-black/35">
            <Link href="/chat" className="transition-colors hover:text-black">채팅</Link>
            <Link href="/dashboard" className="transition-colors hover:text-black">대시보드</Link>
            <Link href="/persona-studio" className="transition-colors hover:text-black">페르소나</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
