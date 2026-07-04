# 07 메모리 시스템 (Memory System)

## 개요

이 프로젝트의 메모리는 세 가지 레이어로 구성됩니다. 각각 다른 범위와 갱신 주기를 가지며, 모두 시스템 프롬프트에 통합됩니다.

```
┌─────────────────────────────────────────────┐
│               메모리 레이어                  │
├─────────────────────────────────────────────┤
│ Layer 1: Preference Memory (개인 선호 학습)  │
│   범위: 이 사용자의 응답 전략 선호           │
│   갱신: 5개 로그마다                        │
│   저장: PreferenceMemory 테이블             │
├─────────────────────────────────────────────┤
│ Layer 2: Conversation Memory (대화 기억)     │
│   범위: 최근 대화 주제와 맥락               │
│   갱신: 6개 메시지 이상 대화마다            │
│   저장: Conversation.summary 컬럼           │
├─────────────────────────────────────────────┤
│ Layer 3: Global Memory (전역 집계)           │
│   범위: 전체 사용자 패턴                    │
│   갱신: 50개 로그마다                       │
│   저장: GlobalPreferenceMemory 테이블       │
└─────────────────────────────────────────────┘
```

---

## Layer 1: Preference Memory

가장 핵심적인 메모리입니다. 사용자가 Learning Mode에서 선택한 응답 전략 패턴을 LLM이 분석하여 합성합니다.

자세한 내용: [05 선호 학습](./05_PREFERENCE_LEARNING.md)

### 데이터 구조

```typescript
interface PreferenceMemory {
  id: string
  userId: string
  version: number              // 갱신 횟수 (1부터 시작)
  preferredTone: string | null // "professional" | "friendly" | "neutral"
  preferredLength: string | null // "concise" | "medium" | "detailed"
  preferredStructure: string | null // "paragraph" | "bullet-points" | "step-by-step"
  preferredStrategies: ResponseStrategy[] // ["STRUCTURED", "ANALYTICAL"]
  avoidedPatterns: string[]    // ["overly casual", "excessive bullets"]
  domainPreferences: Record<string, number>  // { "technology": 0.85 }
  strategyWeights: Record<ResponseStrategy, number>  // { "STRUCTURED": 0.85 }
  rawSummary: string | null    // LLM 생성 자연어 요약
  logCount: number             // 현재까지 분석된 로그 수
  lastUpdatedAt: Date
}
```

### 버전 관리

Memory가 갱신될 때마다 이전 버전의 스냅샷과 변경 내역(diff)이 저장됩니다.

```typescript
interface PreferenceMemoryVersion {
  id: string
  memoryId: string
  version: number
  snapshot: PreferenceMemory   // 해당 버전의 완전한 스냅샷
  diff: MemoryDiff[] | null    // 이전 버전과의 차이
  triggerLogCount: number      // 갱신을 유발한 시점의 로그 수
  createdAt: Date
}

// diff 예시:
[
  { field: "preferredTone", previousValue: null, currentValue: "professional" },
  { field: "preferredLength", previousValue: "concise", currentValue: "detailed" }
]
```

### 시스템 프롬프트에서의 활용

```
USER PREFERENCE MEMORY (apply these):
- Tone: professional
- Length: detailed
- Structure: bullet-points
- Preferred: STRUCTURED, ANALYTICAL
- Avoid: overly casual language

Context: 이 사용자는 기술 질문에서 구조화된 단계별 설명을 선호합니다.
```

---

## Layer 2: Conversation Memory

대화 내용을 자동으로 요약하여 다음 대화에서 맥락을 유지합니다.

### 요약 생성 조건

```typescript
// conversation-summarizer.ts
export async function maybeSummarizeConversation(conversationId: string) {
  const messages = await prisma.message.count({ where: { conversationId } })
  if (messages < 6) return  // 6개 미만이면 요약하지 않음

  // LLM으로 대화 내용을 3-4문장으로 요약
  // Conversation.summary 컬럼에 저장
}
```

### 다음 대화에서의 주입

```typescript
// /api/chat에서 최근 3개 요약 가져오기
const recentSummaries = await prisma.conversation.findMany({
  where: { userId, summary: { not: null } },
  orderBy: { updatedAt: 'desc' },
  take: 3,
  select: { summary: true, title: true }
})
```

시스템 프롬프트에 주입:

```
RECENT CONVERSATION CONTEXT:
[TypeScript 마이그레이션] strict 모드 설정, enum 대신 const object 패턴 사용 합의.
---
[Next.js App Router] 서버/클라이언트 컴포넌트 구분, use client 최소화 전략 논의.
---
[React 상태관리] Zustand vs Redux 비교, 소규모 프로젝트는 Zustand 추천 결론.
```

### 장기 기억 효과

대화 요약은 Conversation 단위로 저장됩니다. 사용자가 2주 전에 TypeScript 프로젝트에 대해 대화했다면, 오늘 새 대화를 시작할 때도 그 맥락이 "최근 대화 요약"으로 주입됩니다.

---

## Layer 3: Global Memory

전체 사용자들의 선호 데이터를 집계하여 개인 Memory가 부족한 초기 사용자를 보완합니다.

### 집계 항목

```typescript
interface GlobalPreferenceMemory {
  mostSelectedStrategies: Array<{ strategy: ResponseStrategy; count: number }>
  commonReasonTags: Array<{ tag: string; count: number }>
  domainPreferences: Array<{ domain: string; strategy: ResponseStrategy; avgScore: number }>
  globallyAvoidedPatterns: string[]
  highPerformingPatterns: string[]    // 상위 3개 전략
  personaPerformance: Array<{ personaId, personaName, avgScore, useCount }>
  flowPerformance: Array<{ flowId, flowName, avgScore, useCount }>
  summary: string                     // LLM 자연어 요약
  totalLogsAnalyzed: number
}
```

### 갱신 로직

```typescript
// 마지막 집계 이후 50개 이상의 새 로그가 쌓이면 갱신
const totalLogs = await prisma.preferenceLog.count()
return totalLogs - current.totalLogsAnalyzed >= 50
```

### 집계 알고리즘

```typescript
// 전략별 선택 횟수 집계
const strategyCounts: Record<string, number> = {}
for (const log of logs) {
  strategyCounts[log.selectedStrategy] = (strategyCounts[log.selectedStrategy] || 0) + 1
}

// 도메인별 최다 선택 전략
const domainStrategyMap: Record<string, Record<string, number>> = {}
// domain → { strategy → count }

// 결과: 각 도메인에서 가장 많이 선택된 전략
```

---

## User Profile (사용자 프로필)

Preference Memory와 별개로 사용자가 직접 입력하는 기본 정보입니다.

```typescript
interface UserProfile {
  displayName: string | null   // "김태빈"
  occupation: string | null    // "소프트웨어 엔지니어"
  interests: string[]          // ["Next.js", "AI", "개인화 시스템"]
  goals: string[]              // ["포트폴리오 완성", "취업 준비"]
  background: string | null    // "3년차 프론트엔드 개발자"
  language: string             // "ko"
  autoExtract: boolean         // 대화에서 자동 추출 (향후)
}
```

시스템 프롬프트에 주입:

```
USER PROFILE (personalize responses based on this):
- Name: 김태빈
- Occupation: 소프트웨어 엔지니어
- Interests: Next.js, AI, 개인화 시스템
- Current goals: 포트폴리오 완성, 취업 준비
- Background: 3년차 프론트엔드 개발자
- Language preference: ko
```

---

## 메모리 간 우선순위

같은 정보가 여러 레이어에 있을 때의 우선순위:

```
개인 Preference Memory > Global Memory > Base Persona 기본값
```

예를 들어 전체 사용자 평균이 STRUCTURED를 선호하더라도, 이 사용자의 Memory에서 FRIENDLY 가중치가 높다면 FRIENDLY가 더 강하게 반영됩니다.

---

## 메모리가 실제로 미치는 영향: 비교 실험

### 시나리오: "리액트 훅의 클로저 문제 설명해줘"

**메모리 없는 경우 (신규 사용자)**:
- 3개 후보가 동등하게 경쟁
- STRUCTURED가 기본 전략으로 선택될 가능성이 높음
- 일반적인 설명 길이

**메모리 있는 경우 (CONCISE 선호, technology 도메인 0.8)**:
- strategyWeights["CONCISE"] = 0.72 → memoryBonus = +0.14
- CONCISE 후보가 동점 시 우선 선택
- 응답 프롬프트에 "Length: concise" 주입 → 짧은 답변

**메모리 있는 경우 (STRUCTURED 선호, bullet-points)**:
- strategyWeights["STRUCTURED"] = 0.85 → memoryBonus = +0.17
- 프롬프트에 "Structure: bullet-points" 주입
- 헤딩과 불릿 포인트로 구성된 명확한 구조화된 응답
