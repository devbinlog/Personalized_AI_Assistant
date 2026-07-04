# 02 아키텍처 (Architecture)

## 전체 구성도

```mermaid
graph TB
    subgraph Browser["브라우저 클라이언트"]
        UI_CHAT[채팅 UI]
        UI_LEARN[Learning Mode 후보 카드]
        UI_XAI[XAI 패널]
        UI_DASH[대시보드]
        UI_PS[Persona Studio]
        UI_FD[Flow Designer]
    end

    subgraph Next["Next.js 15 App Router (Vercel)"]
        direction TB
        subgraph API["API Routes"]
            R_CHAT[/api/chat]
            R_PREF[/api/preferences]
            R_MEM[/api/memory]
            R_EXPL[/api/explanation]
            R_SUGG[/api/suggestions]
            R_PERS[/api/personas]
            R_FLOW[/api/flows]
            R_ANA[/api/analytics]
            R_EXP[/api/prompt-experiments]
            R_GLOB[/api/global-memory]
        end
        subgraph AI_SVC["AI Services (services/ai/)"]
            SVC_TA[Task Analyzer]
            SVC_CG[Candidate Generator]
            SVC_EV[Evaluator]
            SVC_RK[Ranker]
            SVC_MB[Prompt Builder]
            SVC_MG[Memory Generator]
            SVC_EX[Explainer]
            SVC_PM[Persona Manager]
            SVC_FM[Flow Manager]
            SVC_PS[Preference Suggester]
        end
    end

    subgraph LLM["LLM Provider 추상화"]
        P_OAI[OpenAI GPT-4o]
        P_ANT[Anthropic Claude]
        P_GOO[Google Gemini]
        P_MOK[Mock (규칙 기반)]
    end

    subgraph Backend["FastAPI + LangGraph (Python)"]
        BK_GRAPH[12-Node LangGraph Graph]
    end

    subgraph DB["PostgreSQL (Prisma ORM)"]
        DB_USER[User / UserProfile]
        DB_CONV[Conversation / Message]
        DB_CAND[ResponseCandidate]
        DB_PLOG[PreferenceLog]
        DB_PMEM[PreferenceMemory]
        DB_EXPL[ResponseExplanation]
        DB_EVAL[ResponseEvaluation]
        DB_PERS[Persona]
        DB_FLOW[ConversationFlow]
        DB_GLOB[GlobalPreferenceMemory]
    end

    subgraph Search["외부 검색"]
        SR_TAVI[Tavily API]
        SR_OAIS[OpenAI Search]
    end

    Browser -->|HTTP| Next
    R_CHAT --> AI_SVC
    AI_SVC --> LLM
    R_CHAT -.->|선택적 8초 타임아웃| Backend
    Backend --> LLM
    Next -->|Prisma| DB
    SVC_CG -->|웹 검색 필요 시| Search
```

---

## 레이어별 설명

### 1. 클라이언트 레이어

Next.js App Router의 `use client` 컴포넌트들로 구성됩니다. 상태 관리는 Zustand(persisted)로 처리합니다. API 호출은 TanStack Query로 캐싱합니다.

주요 UI 페이지:

| 경로 | 역할 |
|---|---|
| `/chat` | 메인 채팅 인터페이스 |
| `/dashboard` | 학습 현황 및 통계 |
| `/persona-studio` | 페르소나 설계 |
| `/flow-designer` | 대화 흐름 설계 |
| `/prompt-lab` | 프롬프트 버전 인스펙터 |
| `/insights` | 학습 인사이트 |
| `/datasets` | DPO 데이터셋 내보내기 |

### 2. API 레이어 (Next.js Route Handlers)

모든 AI 처리는 서버 사이드에서 실행됩니다. 클라이언트에 API 키가 노출되지 않습니다.

핵심 라우트: `/api/chat/route.ts`가 전체 파이프라인을 오케스트레이션합니다.

```
POST /api/chat
  → resolveUserContext()   // NextAuth → 쿠키 세션 → anonymous 순으로 userId 해석
  → rateLimit()            // 세션당 분당 20회 제한
  → getMemory()            // Preference Memory 로드
  → (optional) LangGraph   // 백엔드 연동 시도 (8초 타임아웃, fallback 있음)
  → analyzeTask()          // 태스크 분류
  → resolvePersonaForTask() // 태스크 유형 → 페르소나 자동 매핑
  → (if needed) searchWeb() // Tavily 웹 검색
  → buildSystemPrompt()    // 동적 프롬프트 조립
  → generateCandidates()   // 3개 후보 병렬 생성
  → evaluateCandidates()   // 8차원 평가
  → rankCandidates()       // Memory 보정 랭킹
  → generateExplanation()  // XAI 설명 저장
  → streamText()           // 최적 후보 스트리밍
```

### 3. AI 서비스 레이어 (`services/ai/`)

각 서비스는 단일 책임을 갖습니다. 모두 `getLLMProvider()`를 통해 LLM에 접근합니다.

| 서비스 | 입력 | 출력 | LLM 모델 |
|---|---|---|---|
| `task-analyzer.ts` | 사용자 메시지 | TaskAnalysis | Fast Model |
| `candidate-generator.ts` | 메시지 + 프롬프트 | 3개 GeneratedCandidate | Main Model |
| `evaluator.ts` | 후보들 + Memory | CandidateEvaluation[] | Fast Model |
| `ranker.ts` | 평가 + Memory | RankedCandidate[] | (CPU 연산) |
| `memory-generator.ts` | PreferenceLog[] | PreferenceMemory | Fast Model |
| `explainer.ts` | 선택 후보 + Memory | ResponseExplanation | Fast Model |
| `prompt-builder.ts` | Task + Memory + Persona | systemPrompt | (조립) |
| `preference-suggester.ts` | 최근 로그 | PreferenceSuggestion[] | Fast Model |

### 4. LLM Provider 추상화

`getModel()` (복잡한 작업)과 `getFastModel()` (빠른 판단) 두 가지 모델을 구분합니다. 환경변수 `LLM_PROVIDER` 하나로 전체 스택의 LLM이 전환됩니다.

```typescript
// provider/types.ts
interface LLMProvider {
  getModel(): LanguageModel        // 후보 생성 등 품질 중요 작업
  getFastModel(): LanguageModel    // 태스크 분석, 평가 등 속도 중요 작업
}
```

### 5. LangGraph 백엔드 (선택적 연동)

FastAPI + LangGraph로 구성된 Python 백엔드가 있습니다. 프론트엔드가 `/api/chat` 요청을 받으면 8초 타임아웃으로 LangGraph 백엔드 호출을 시도합니다. 백엔드가 응답하면 task_analysis, system_prompt, candidates를 가져와 로컬 처리를 건너뜁니다. 응답이 없으면 로컬 파이프라인으로 fallback합니다. 이 설계로 프론트엔드가 백엔드 없이도 완전히 작동합니다.

### 6. 데이터베이스 레이어

Prisma ORM + PostgreSQL. 로컬 개발 시 SQLite 사용 가능. 20개 테이블로 구성 (자세한 내용: [09 데이터베이스](./09_DATABASE.md)).

---

## 핵심 설계 결정

### 결정 1: 프론트엔드에서 AI 파이프라인 직접 실행

**이유**: Vercel Serverless Functions가 Edge 네트워크에 배포되어 별도 인프라 없이 AI 처리 가능. 백엔드 의존성 없이 독립 배포 가능.

**트레이드오프**: 함수 실행 시간 제한(60초 설정). 병렬 후보 생성이 실행 시간의 대부분을 차지.

### 결정 2: LLM Provider 추상화를 처음부터 설계

**이유**: 개발 초기에는 Mock으로 빠르게 UI를 개발하고, 이후 실제 LLM으로 전환할 때 코드 변경이 전혀 없어야 함.

**결과**: `LLM_PROVIDER=mock` → `LLM_PROVIDER=openai` 전환에 코드 수정 0줄.

### 결정 3: LangGraph 백엔드를 선택적 연동으로 설계

**이유**: LangGraph 그래프는 실제 AI 호출이 연결될 미래 아키텍처를 미리 구현. 현재는 규칙 기반이지만, 각 노드에 실제 AI를 연결하는 구조가 완성되어 있음.

**결과**: 프론트엔드 단독 작동 + 백엔드 연동 시 자동으로 그래프 결과 사용.

### 결정 4: SQLite → PostgreSQL 이중 지원

**이유**: 로컬 개발에서 DB 설정 없이 바로 실행 가능. 배포 시 스키마 변경 없이 PostgreSQL로 전환.

**구현**: `schema.prisma`의 `provider`와 `DATABASE_URL`만 교체.

---

## 의존성 관계

```
app/api/chat/route.ts
    ├── services/ai/task-analyzer.ts
    │       └── services/ai/provider/index.ts
    ├── services/ai/candidate-generator.ts
    │       └── services/ai/provider/index.ts
    ├── services/ai/evaluator.ts
    │       └── services/ai/provider/index.ts
    ├── services/ai/ranker.ts             (LLM 없음, 순수 연산)
    ├── services/ai/prompt-builder.ts     (LLM 없음, 문자열 조립)
    │       └── lib/prisma.ts
    ├── services/ai/memory-generator.ts
    │       ├── services/ai/provider/index.ts
    │       └── lib/prisma.ts
    ├── services/ai/explainer.ts
    │       ├── services/ai/provider/index.ts
    │       └── lib/prisma.ts
    ├── services/ai/persona-manager.ts
    │       └── lib/prisma.ts
    ├── services/search/tavily.ts         (외부 API)
    ├── lib/resolve-user.ts               (NextAuth + 쿠키)
    ├── lib/rate-limit.ts
    └── lib/prisma.ts
```

---

## 보안 설계

- **API 키**: 모든 LLM API 키는 서버 환경변수에만 존재. 클라이언트에 노출 없음
- **Rate Limiting**: 세션당 분당 20회 제한 (`lib/rate-limit.ts`)
- **User Isolation**: 모든 DB 쿼리에 `userId` 필터 적용. 다른 사용자 데이터 접근 불가
- **인증**: NextAuth JWT. 미인증 사용자는 쿠키 기반 익명 세션으로 처리, 로그인 시 데이터 이전
