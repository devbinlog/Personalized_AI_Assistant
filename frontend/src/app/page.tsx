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
    desc: '명확성, 완성도, 구조, 특이성 등 9개 차원으로 응답을 정량 평가하고, 두 프롬프트를 비교합니다.',
  },
  {
    num: '05',
    title: 'XAI — 왜 이 답변인가',
    desc: '어떤 메모리가 반영됐는지, 각 후보 점수를 투명하게 설명합니다.',
  },
  {
    num: '06',
    title: '페르소나 스튜디오',
    desc: '어조, 격식, 유머, 공감 레벨을 정의한 AI 페르소나를 만들고 활성화합니다.',
  },
  {
    num: '07',
    title: '대화 플로우 디자이너',
    desc: '도메인별 트리거 조건과 단계별 지시사항으로 대화 흐름을 설계합니다.',
  },
  {
    num: '08',
    title: '전역 학습 파이프라인',
    desc: '모든 사용자의 선호도를 집계해 고성과·저성과 패턴을 전역 메모리로 합성합니다.',
  },
  {
    num: '09',
    title: '데이터셋 내보내기',
    desc: '선호도 로그를 DPO 형식, 평가 데이터를 루브릭 형식으로 내보냅니다.',
  },
]

const PIPELINE = [
  { step: '태스크 분석', desc: '질문 유형 분류, 웹 검색 판단, 복잡도 평가' },
  { step: '컨텍스트 조립', desc: '개인 메모리 + 페르소나 + 플로우 + 전역 패턴' },
  { step: '후보 생성', desc: '구조화 / 서술형 / 간결형 전략 3가지 동시 생성' },
  { step: '9차원 평가', desc: '명확성, 완성도, 구조, 선호도 매칭 정량 채점' },
  { step: '랭킹 & 스트리밍', desc: '선호도 가중 점수로 최적 후보 선택 후 실시간 전송' },
]

const STACK = [
  { group: 'Frontend', items: ['Next.js 15', 'TypeScript 5', 'Zustand', 'TanStack Query'] },
  { group: 'Backend', items: ['FastAPI', 'LangGraph 0.2', 'NextAuth', 'Prisma 5'] },
  { group: 'AI / SDK', items: ['Vercel AI SDK v4', 'OpenAI', 'Anthropic', 'Google'] },
  { group: 'Data', items: ['PostgreSQL', 'SQLite', 'Recharts'] },
]

function ChatMockup() {
  return (
    <div className="relative">
      <div
        className="absolute -inset-6 rounded-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 40% 40%, rgba(30,41,59,0.06) 0%, transparent 70%)',
        }}
      />
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: '1px solid #E4E4E0',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
        }}
      >
        {/* Window chrome */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ backgroundColor: '#F7F7F5', borderBottom: '1px solid #E4E4E0' }}
        >
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#EDCFCF' }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#F0E4C4' }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#C7DFC5' }} />
          </div>
          <span className="flex-1 text-center text-[11px] font-medium" style={{ color: '#A8A8A4' }}>
            Adaptive AI — 학습 모드
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[9px]" style={{ color: '#A8A8A4' }}>학습 중</span>
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3">
          <div className="flex justify-end">
            <div
              className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] text-white"
              style={{ backgroundColor: '#1E293B', maxWidth: '80%' }}
            >
              딥러닝의 핵심 개념을 설명해줘
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px" style={{ backgroundColor: '#E4E4E0' }} />
            <span className="text-[10px] shrink-0" style={{ color: '#A8A8A4' }}>응답 스타일 선택</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#E4E4E0' }} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Selected */}
            <div className="rounded-xl p-3" style={{ border: '1.5px solid #1E293B', backgroundColor: '#F0F2F5' }}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-semibold" style={{ color: '#1E293B' }}>구조화</span>
                <div className="h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#1E293B' }}>
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
              </div>
              <div className="space-y-1.5">
                {[100, 80, 100, 60].map((w, i) => (
                  <div key={i} className="h-1.5 rounded-full" style={{ width: `${w}%`, backgroundColor: 'rgba(30,41,59,0.2)' }} />
                ))}
              </div>
              <div className="mt-3 rounded-lg py-1.5 text-center" style={{ backgroundColor: '#1E293B' }}>
                <span className="text-[10px] font-medium text-white">선택됨</span>
              </div>
            </div>

            {['서술형', '간결형'].map((label, i) => (
              <div key={label} className="rounded-xl p-3" style={{ border: '1px solid #E4E4E0', backgroundColor: '#FAFAFA' }}>
                <span className="text-[10px] font-medium block mb-2.5" style={{ color: '#A8A8A4' }}>{label}</span>
                <div className="space-y-1.5">
                  {(i === 0 ? [100, 75, 100, 85] : [100, 65]).map((w, j) => (
                    <div key={j} className="h-1.5 rounded-full" style={{ width: `${w}%`, backgroundColor: '#E4E4E0' }} />
                  ))}
                </div>
                <div className="mt-3 rounded-lg py-1.5 text-center" style={{ border: '1px solid #E4E4E0' }}>
                  <span className="text-[10px]" style={{ color: '#A8A8A4' }}>선택</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ border: '1px solid #E4E4E0', backgroundColor: '#F7F7F5' }}>
            <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: '#1E293B' }} />
            <span className="text-[10px]" style={{ color: '#6B6B68' }}>
              메모리 업데이트 — 구조화 선호도{' '}
              <strong className="font-semibold" style={{ color: '#141413' }}>+12%</strong>
            </span>
          </div>
        </div>

        <div className="p-3" style={{ borderTop: '1px solid #E4E4E0' }}>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ border: '1px solid #E4E4E0', backgroundColor: '#F7F7F5' }}>
            <span className="text-[11px] flex-1" style={{ color: '#A8A8A4' }}>다음 질문을 입력하세요...</span>
            <div className="h-5 w-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: '#1E293B' }}>
              <ArrowRight className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="px-6 md:px-8 pt-28 pb-20 lg:pt-32 lg:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-center">

            {/* Left: Typography */}
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-8"
                style={{ border: '1px solid #E4E4E0', backgroundColor: '#FFFFFF' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium" style={{ color: '#6B6B68' }}>
                  Portfolio — AI Experience System
                </span>
              </div>

              <h1
                className="mb-8 leading-[0.95] tracking-[-0.03em] font-black"
                style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', color: '#141413' }}
              >
                대화할수록<br />
                나를 닮아가는 AI
              </h1>

              <p className="text-base leading-relaxed mb-10 max-w-sm" style={{ color: '#6B6B68' }}>
                3가지 응답 후보 선택이 쌓일수록 AI가 어조, 길이, 스타일 취향을<br />
                학습하고, 다음 대화부터 최적 답변을 자동 생성합니다.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1E293B] hover:bg-[#334155] px-6 py-3 text-sm font-semibold text-white transition-colors"
                >
                  채팅 시작하기
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors hover:bg-[#F0F2F5]"
                  style={{ border: '1px solid #D1D1CE', color: '#1E293B' }}
                >
                  대시보드
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right: Chat mockup */}
            <div className="hidden lg:block">
              <ChatMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="px-6 md:px-8 py-24" style={{ borderTop: '1px solid #E4E4E0' }}>
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: '#A8A8A4' }}>
                기능
              </p>
              <h2 className="text-4xl font-black tracking-tighter" style={{ color: '#141413' }}>
                핵심 기능
              </h2>
            </div>
            <span className="text-sm hidden sm:block" style={{ color: '#A8A8A4' }}>9가지 모듈</span>
          </div>

          {/* 균등 9개 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.num}
                className="rounded-xl p-5"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <span
                  className="inline-block text-[10px] font-bold tracking-[0.1em] mb-3"
                  style={{ color: '#A8A8A4' }}
                >
                  {f.num}
                </span>
                <h3 className="text-sm font-bold mb-2" style={{ color: '#141413' }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#6B6B68' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline ─────────────────────────────────── */}
      <section className="px-6 md:px-8 py-24" style={{ borderTop: '1px solid #E4E4E0' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: '#A8A8A4' }}>
              시스템
            </p>
            <h2 className="text-4xl font-black tracking-tighter" style={{ color: '#141413' }}>응답 파이프라인</h2>
          </div>

          <div>
            {PIPELINE.map((p, i) => (
              <div
                key={i}
                className="grid grid-cols-[48px_1fr_2fr] gap-6 items-start py-6"
                style={{ borderTop: '1px solid #E4E4E0', borderBottom: i === PIPELINE.length - 1 ? '1px solid #E4E4E0' : undefined }}
              >
                <div
                  className="text-3xl font-black leading-none mt-0.5"
                  style={{ color: 'rgba(20,20,19,0.10)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="text-base font-bold" style={{ color: '#141413' }}>{p.step}</div>
                <div className="text-sm leading-relaxed" style={{ color: '#6B6B68' }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ───────────────────────────────── */}
      <section className="px-6 md:px-8 py-24" style={{ borderTop: '1px solid #E4E4E0' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: '#A8A8A4' }}>
              기술
            </p>
            <h2 className="text-4xl font-black tracking-tighter" style={{ color: '#141413' }}>기술 스택</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STACK.map((group) => (
              <div key={group.group}>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-3 pb-2"
                  style={{ color: '#A8A8A4', borderBottom: '1px solid #E4E4E0' }}
                >
                  {group.group}
                </p>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="text-sm font-medium"
                      style={{ color: '#1E293B' }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>


{/* ── Footer ───────────────────────────────────── */}
      <footer className="px-6 md:px-8 py-8" style={{ borderTop: '1px solid #E4E4E0', backgroundColor: '#FFFFFF' }}>
        <div className="mx-auto max-w-6xl flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <span className="text-sm font-black tracking-tight" style={{ color: '#141413' }}>Adaptive AI</span>
          <p className="text-xs" style={{ color: '#A8A8A4' }}>김태빈  devbinlog8@gmail.com</p>
          <div className="flex items-center gap-5 text-xs" style={{ color: '#A8A8A4' }}>
            <Link href="/chat" className="transition-colors hover:text-[#141413]">채팅</Link>
            <Link href="/dashboard" className="transition-colors hover:text-[#141413]">대시보드</Link>
            <Link href="/persona-studio" className="transition-colors hover:text-[#141413]">페르소나</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
