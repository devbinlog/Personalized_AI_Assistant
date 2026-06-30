# Personalized AI Assistant

> **기존 AI는 수억 명을 학습해서 모든 사람에게 같은 AI를 준다.**
> **이 프로젝트는 반대다. 내가 직접 AI를 학습시켜 나만의 AI를 만든다.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2.x-orange?style=flat-square)](https://langchain-ai.github.io/langgraph)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 아이디어

### "ChatGPT 메모리 켜는 거랑 뭐가 달라요?"

ChatGPT 메모리는 AI가 알아서 무언가를 기억한다. 뭘 기억하는지, 왜 그 답변이 나왔는지 알 수 없다. 데이터는 OpenAI 서버에 있고, 다른 AI로 옮길 수 없다.

이 프로젝트는 다르게 접근한다.

| | ChatGPT 메모리 | Personalized AI Assistant |
|---|---|---|
| 학습 방식 | AI가 알아서 판단 | **내가 직접 선택하며 가르친다** |
| 투명성 | 블랙박스 | **모든 결정에 이유가 표시된다** |
| 데이터 소유 | OpenAI 서버 | **내 DB, 내 것** |
| 활용 | 그 안에서만 | **파인튜닝 데이터로 꺼낼 수 있다** |
| AI 성격 | 고정 | **내가 직접 설계한다** |
| LLM 교체 | 불가 | **환경변수 한 줄** |

### 비유하자면

기존 AI는 **기성복**이다. 잘 만들어졌지만 모든 사람에게 같은 옷이다.

이 프로젝트는 **맞춤 양복**이다. 같은 천(LLM)으로 시작하지만 내 치수(선호도)로 계속 고쳐나간다.

---

## 핵심 아이디어 8가지

### 1. 학습 모드 — 선택으로 가르친다

같은 질문에 전략이 다른 **3가지 답변**을 동시에 만들어 제시한다.

```
질문: "리액트 상태관리 어떻게 해?"

후보 A — 핵심만 간결하게
후보 B — 단계별로 구조적으로  
후보 C — 개념부터 차근차근
```

사용자가 B를 고르면 그 선택이 학습 데이터가 된다. **"이 사람은 구조적인 설명을 선호한다"는 추측이 아니라 직접 증명된 선호도다.**

### 2. 선호도 메모리 — 쌓일수록 나를 안다

선택이 10개, 20개 쌓이면 AI가 패턴을 분석해 자연어로 정리한다.

```
"이 사람은 코드 예제를 먼저 보여주고 설명은 짧게 해야 한다.
 불릿 포인트보다 단락을 선호한다.
 너무 형식적인 말투는 싫어한다."
```

이 메모리가 다음 대화의 시스템 프롬프트에 자동으로 주입된다.

### 3. AI 성격을 내가 설계한다

코딩 질문 → 선배 개발자처럼 기술적으로.  
취업 고민 → 커리어 코치처럼 구조적으로.  
모르는 걸 배울 때 → 친절한 선생님처럼 쉽게.

**Persona Studio**에서 직접 만들 수도 있다. 말투, 격식 수준, 금지 행동, 허용 행동까지 설계한다.

### 4. AI가 왜 이 답변을 골랐는지 보여준다

```
왜 이 답변이 선택됐나?
→ 당신이 지난 23번 중 18번 구조적 답변을 선택했습니다 (가중치 0.45)
→ 'Developer Mentor' 페르소나가 기술적 깊이를 더했습니다
→ 랭킹 공식: overallScore×0.40 + preferenceMatch×0.25 + ...
```

**설명할 수 없는 AI는 신뢰할 수 없다.** 모든 결정에 이유를 붙인다.

### 5. 내 계정에 귀속된 AI

집 컴퓨터에서 2주 동안 AI를 학습시켰다면, 회사 컴퓨터에서 로그인해도 **동일한 나만의 AI**를 만난다. 기기가 바뀌어도 메모리는 계정에 붙어있다.

### 6. 장기 기억

대화 내용을 자동으로 요약해 기억한다. 다음 대화에 "지난번에 TypeScript 프로젝트 얘기하셨죠"라는 맥락이 자연스럽게 이어진다.

### 7. 내 데이터로 AI를 파인튜닝할 수 있다

내가 쌓은 선호도 데이터를 **DPO(Direct Preference Optimization) 형식**으로 내보낼 수 있다. 이 데이터로 오픈소스 모델을 파인튜닝하면 진짜로 "나에게만 최적화된 모델 가중치"가 생긴다.

```json
{
  "prompt": "리액트 상태관리 방법은?",
  "chosen": "구조적인 단계별 설명...",
  "rejected": "짧은 요약...",
  "reason_tags": ["MORE_STRUCTURED", "BETTER_EXPLANATION"]
}
```

### 8. 파일과 음성

코드 파일을 올리면 그 코드를 읽고 답한다.  
이미지를 올리면 이미지를 분석하고 답한다.  
말로 하면 받아 적어서 처리한다.  
입력 수단이 다양해야 진짜 비서다.

---

## 현재 구현 상태

### 전체 파이프라인

```
사용자 입력 (텍스트 / 파일 / 음성)
     │
     ▼
[1] 사용자 인증 해석
    NextAuth JWT → 쿠키 세션 → anonymous
     │
     ▼
[2] 태스크 분석
    질문 유형(16가지) / 복잡도 / 도메인 / 웹검색 필요 여부
     │
     ▼
[3] 페르소나 자동 선택
    PROGRAMMING → Developer Mentor
    CAREER/INTERVIEW → Interview Coach
    RESEARCH → Research Assistant
    LEARNING → Friendly Mentor
    WRITING → Professional Assistant
     │
     ▼
[4] 웹 검색 (Tavily, 필요 시)
     │
     ▼
[5] 시스템 프롬프트 조립
    페르소나 → 유저 프로필 → 태스크 → 선호도 메모리
    → 최근 대화 요약 → 검색 결과
     │
     ▼
[6] 후보 3개 생성 (전략: CONCISE / STRUCTURED / EDUCATIONAL 등)
     │
     ▼
[7] 18차원 평가 (언어품질, 정확성, 내용, 개인화, 검색 근거)
     │
     ▼
[8] 랭킹
    overallScore×0.40 + preferenceMatch×0.25
    + personaConsistency×0.15 + instructionFollowing×0.10
    + searchGrounding×0.10
     │
     ├── LEARNING 모드: 3개 카드 제시 → 선택 → 로그 저장 → 메모리 학습
     │
     └── NORMAL 모드: 1위 후보 스트리밍 → XAI 설명 생성
```

### 기능 구현 현황

| 카테고리 | 기능 | 상태 |
|---------|------|------|
| **인증** | 회원가입 / 로그인 (NextAuth) | ✅ |
| **인증** | 익명 → 계정 데이터 이전 (로그인 시) | ✅ |
| **채팅** | 학습 모드 (후보 3개 선택) | ✅ |
| **채팅** | 일반 모드 (자동 스트리밍) | ✅ |
| **채팅** | 파일 첨부 (이미지 / 텍스트 / 코드, 최대 3개) | ✅ |
| **채팅** | 음성 입력 (Web Speech API) | ✅ |
| **채팅** | 대화 히스토리 사이드바 | ✅ |
| **학습** | 선호도 로그 저장 + 이유 태그 | ✅ |
| **학습** | 선호도 메모리 합성 (LLM, 로그 10개 이상) | ✅ |
| **학습** | Adaptive Suggestion (AI 능동 제안) | ✅ |
| **기억** | 대화 자동 요약 (6개 메시지 이상) | ✅ |
| **기억** | 장기 기억 주입 (최근 3개 요약) | ✅ |
| **기억** | 유저 프로필 (직업, 관심사, 목표) | ✅ |
| **AI 설계** | Persona Studio (5개 기본 + 커스텀) | ✅ |
| **AI 설계** | 태스크 유형별 페르소나 자동 선택 | ✅ |
| **AI 설계** | Flow Designer (대화 흐름 설계) | ✅ |
| **평가** | 18차원 평가 루브릭 | ✅ |
| **투명성** | XAI 패널 ("왜 이 답변인가?") | ✅ |
| **실험** | Prompt A/B 테스팅 | ✅ |
| **데이터** | DPO 형식 Dataset Export | ✅ |
| **분석** | 대시보드 (통계, 차트, 루브릭) | ✅ |
| **분석** | Global Learning (전체 패턴 집계) | ✅ |
| **설정** | 설정 서버 동기화 (크로스 디바이스) | ✅ |
| **검색** | Tavily 웹 검색 통합 | ✅ (키 필요) |
| **백엔드** | LangGraph 12노드 멀티에이전트 | ✅ |
| **LLM** | OpenAI / Anthropic / Google / Mock | ✅ (키 필요) |

---

## Mock 모드 vs 실제 LLM

지금 `LLM_PROVIDER=mock`으로 동작 중이다. 구조와 파이프라인은 동일하게 작동하지만 LLM 호출이 규칙 기반으로 대체된다.

| | Mock 모드 | 실제 LLM |
|---|---|---|
| 태스크 분석 | 키워드 규칙 | GPT/Claude가 의미 이해 |
| 후보 생성 | 템플릿 텍스트 | 실제로 다른 3가지 답변 |
| 18차원 평가 | 결정론적 점수 | LLM이 품질 판단 |
| 메모리 합성 | 고정 텍스트 | 사용자 패턴 자연어 요약 |
| 대화 요약 | 패턴 문자열 | 핵심 맥락 압축 |
| XAI 패널 | 숨김 | 실제 선택 이유 |
| 이미지 이해 | 미지원 | Vision API로 분석 |

---

## 실행 방법

### 사전 요구사항

- Node.js 20+
- Python 3.9+
- PostgreSQL 14+

### 1. 설치

```bash
cd frontend
npm install
```

### 2. 환경변수 설정

`frontend/.env.local` 파일 생성:

```bash
# 데이터베이스
DATABASE_URL="postgresql://username@localhost:5432/personalized_ai_db"

# LLM 제공자 (mock으로 시작, 키 준비되면 변경)
LLM_PROVIDER=mock
# LLM_PROVIDER=openai    → OPENAI_API_KEY=sk-...
# LLM_PROVIDER=anthropic → ANTHROPIC_API_KEY=sk-ant-...
# LLM_PROVIDER=google    → GOOGLE_API_KEY=...

# 웹 검색 (선택사항)
TAVILY_API_KEY=tvly-...

# Next Auth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Mock 모드 클라이언트 감지 (XAI/신뢰도 UI 숨김)
NEXT_PUBLIC_LLM_PROVIDER=mock

# LangGraph 백엔드 (선택사항)
LANGGRAPH_BACKEND_URL=http://localhost:8000
```

### 3. DB 초기화

```bash
cd frontend
npx prisma generate
npx prisma db push
```

### 4. 실행

```bash
# 프론트엔드
cd frontend && npm run dev
# → http://localhost:3000

# 백엔드 (선택사항)
cd backend
pip3 install fastapi uvicorn langgraph langchain-core httpx pydantic-settings structlog
uvicorn app.main:app --reload
# → http://localhost:8000
```

---

## LLM 연동 시 (키 준비 후)

`.env.local`에서 두 줄만 바꾼다:

```bash
LLM_PROVIDER=anthropic          # 또는 openai / google
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_LLM_PROVIDER=anthropic  # XAI 패널 활성화
```

서버 재시작 후 모든 기능이 실제 LLM으로 작동한다.

---

## 기술 스택

### 프론트엔드
- **Next.js 15** App Router + TypeScript 5
- **Vercel AI SDK 4** — 스트리밍, generateObject
- **Prisma 5** — PostgreSQL ORM
- **Zustand** — 클라이언트 상태
- **TanStack Query** — 서버 상태 / 캐싱
- **Tailwind CSS** — Linear 디자인 시스템
- **Recharts** — 대시보드 차트
- **NextAuth v4** — JWT 인증

### 백엔드
- **FastAPI** + **LangGraph 0.2.x** — 12노드 멀티에이전트 파이프라인
- **Python 3.9** + Pydantic Settings

### AI / 외부 서비스
- OpenAI GPT-4o / Anthropic Claude / Google Gemini (선택)
- Tavily 실시간 웹 검색

---

## 프로젝트 구조

```
Personalized_AI_Assistant/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── chat/              # 메인 채팅 UI
│   │   │   ├── dashboard/         # 통계 + 루브릭 + 전역 학습
│   │   │   ├── persona-studio/    # AI 성격 설계
│   │   │   ├── flow-designer/     # 대화 흐름 설계
│   │   │   ├── prompt-lab/        # 프롬프트 버전 + A/B 실험
│   │   │   ├── datasets/          # DPO 데이터 내보내기
│   │   │   ├── profile/           # 유저 프로필
│   │   │   ├── settings/          # 설정 (크로스 디바이스 동기화)
│   │   │   └── api/               # 모든 API 라우트
│   │   ├── features/              # 기능별 컴포넌트
│   │   │   ├── assistant/         # 채팅 UI, 스트리밍, 사이드바
│   │   │   ├── learning/          # 후보 카드, 태그 선택기
│   │   │   ├── xai/               # "왜 이 답변인가?" 패널
│   │   │   ├── preference-manager/ # AI 능동 제안 배너
│   │   │   ├── persona-studio/    # 페르소나 에디터
│   │   │   ├── flow-designer/     # 플로우 에디터 + 시뮬레이션
│   │   │   ├── datasets/          # 내보내기 UI
│   │   │   └── dashboard/         # 차트, 메모리 카드
│   │   ├── services/ai/           # AI 서비스 레이어
│   │   │   ├── provider/          # LLM 추상화 (OpenAI/Anthropic/Google/Mock)
│   │   │   ├── task-analyzer.ts
│   │   │   ├── candidate-generator.ts
│   │   │   ├── evaluator.ts       # 기존 8차원 (호환성 유지)
│   │   │   ├── expanded-evaluator.ts  # 18차원 확장
│   │   │   ├── ranker.ts
│   │   │   ├── memory-generator.ts
│   │   │   ├── global-memory-generator.ts
│   │   │   ├── explainer.ts       # XAI 설명 생성
│   │   │   ├── prompt-builder.ts  # 동적 시스템 프롬프트
│   │   │   ├── persona-manager.ts
│   │   │   ├── flow-manager.ts
│   │   │   ├── conversation-summarizer.ts  # 자동 요약
│   │   │   └── preference-suggester.ts
│   │   ├── lib/
│   │   │   ├── resolve-user.ts    # 사용자 ID 통합 해석
│   │   │   └── session.ts
│   │   └── types/index.ts         # 전체 도메인 타입 (단일 진실의 원천)
│   └── prisma/schema.prisma       # DB 스키마 (PostgreSQL, 20개 테이블)
│
└── backend/
    └── app/
        ├── main.py
        └── features/assistant/
            ├── graph.py            # 12노드 LangGraph
            └── router.py
```

---

## 남은 것 (LLM 키 준비 후 완성)

1. **LLM API 키** 추가 → 모든 AI 기능 실제 작동
2. **Tavily API 키** → 실시간 웹 검색 활성화
3. **FastAPI 백엔드 실행** → LangGraph 멀티에이전트 파이프라인 활성화
4. (장기) RAG — 내 문서 업로드 → 벡터 DB → 컨텍스트 자동 주입
5. (장기) 파인튜닝 자동화 — Dataset Export → 오픈소스 모델 파인튜닝

---

## 라이선스

MIT License

---

<div align="center">

만든 사람: **김태빈** · devbinlog8@gmail.com

</div>
