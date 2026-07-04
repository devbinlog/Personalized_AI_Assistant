# 04 프롬프트 파이프라인 (Prompt Pipeline)

## 개요

이 프로젝트의 시스템 프롬프트는 고정된 텍스트가 아닙니다. 매 대화마다 사용자의 상태에 맞게 동적으로 조립됩니다. `buildSystemPrompt()`가 9개의 컴포넌트를 우선순위에 따라 결합합니다.

---

## 프롬프트 조립 구조

```
┌──────────────────────────────────────────────────────────┐
│                  시스템 프롬프트 (조립 순서)              │
├──────────────────────────────────────────────────────────┤
│ [1] Persona Fragment          ← 최우선                   │
│     "Act as a senior developer mentor..."               │
│                                                          │
│ [2] User Profile Context                                 │
│     "Name: 김태빈, Occupation: 개발자, Goals: ..."        │
│                                                          │
│ [3] Conversation Flow Context                            │
│     "INTERVIEW COACHING FLOW: Always use STAR..."       │
│                                                          │
│ [4] Task Context                                         │
│     "Type: PROGRAMMING | Complexity: HIGH"              │
│                                                          │
│ [5] Preference Memory Context                            │
│     "Tone: professional, Structure: bullet-points..."   │
│                                                          │
│ [6] Global Memory Context                                │
│     "전체 사용자 패턴: STRUCTURED 전략이 가장 효과적..."  │
│                                                          │
│ [7] Recent Conversation Summaries                        │
│     "[TypeScript 프로젝트] 라이브러리 선택 고민..."       │
│                                                          │
│ [8] Examples Context                                     │
│     "[1] 이전의 고품질 응답 예시..."                     │
│                                                          │
│ [9] Search Context                                ← 마지막│
│     "웹 검색 결과: [제목] [URL] [내용]..."               │
└──────────────────────────────────────────────────────────┘
```

---

## 컴포넌트별 상세

### [1] Persona Fragment

활성 페르소나가 있으면 해당 `promptFragment`를 사용합니다. 없으면 기본 Base Persona를 사용합니다.

```typescript
// 예: Developer Mentor 페르소나
promptFragment = "Act as a senior developer mentor. Prioritize working code examples, 
explain the 'why' behind patterns, discuss tradeoffs, and always consider edge cases."

// 기본 Base Persona (페르소나 없을 때)
`You are an Adaptive AI Personal Assistant...
 CURRENT DATE AND TIME (KST): 2026년 7월 4일 09:30 (2026-07-04)
 LANGUAGE RULE: Always detect the language of the user's latest message...`
```

기본 Base Persona에는 현재 시각(KST 기준)이 항상 포함됩니다. 이는 "최신 정보"와 관련된 답변의 시간적 맥락을 제공합니다.

### [2] User Profile Context

사용자가 프로필 페이지에서 입력한 정보입니다.

```
USER PROFILE (personalize responses based on this):
- Name: 김태빈
- Occupation: 소프트웨어 엔지니어
- Interests: Next.js, AI, 개인화 시스템
- Current goals: 포트폴리오 완성, 취업 준비
- Background: 3년차 프론트엔드 개발자
- Language preference: ko
```

### [3] Conversation Flow Context

Flow Designer에서 설계한 대화 흐름의 `fallbackPolicy`가 주입됩니다.

```
CONVERSATION FLOW (Interview Preparation):
항상 STAR 방법론으로 답변을 구조화하세요.
면접 연습 시 구체적인 피드백을 제공하세요.
```

### [4] Task Context

`analyzeTask()`의 결과입니다.

```
TASK CONTEXT:
- Type: PROGRAMMING | Complexity: HIGH | Domain: technology
- Expected output: code explanation with examples
- Preferred style: step-by-step
```

### [5] Preference Memory Context

Preference Memory에서 추출한 사용자 선호 프로필입니다.

```
USER PREFERENCE MEMORY (apply these):
- Tone: professional
- Length: detailed
- Structure: bullet-points
- Preferred: STRUCTURED, ANALYTICAL
- Avoid: overly casual language

Context: 이 사용자는 코딩 질문에서 구조화된 단계별 설명을 선호하며,
         예제 코드를 먼저 보여준 후 설명하는 방식을 좋아한다.
```

### [6] Global Memory Context

전체 사용자들의 집계 패턴입니다.

```
GLOBAL LEARNING INSIGHTS:
150개 인터랙션 분석 완료. 최다 전략: STRUCTURED. 
기술 도메인에서는 STRUCTURED 전략이 평균 0.87점으로 가장 높은 선호도를 보임.
```

### [7] Recent Conversation Summaries

최근 3개 대화의 LLM 생성 요약입니다.

```
RECENT CONVERSATION CONTEXT:
[TypeScript 마이그레이션] JavaScript를 TypeScript로 전환하는 전략 논의.
strict 모드 설정과 단계적 마이그레이션 방법에 합의함.
---
[Next.js App Router] 서버 컴포넌트와 클라이언트 컴포넌트 구분 방법 논의.
```

### [8] Examples Context

과거 선택된 고품질 응답을 예시로 제공합니다. (현재 버전에서는 빈 배열 전달)

### [9] Search Context

Tavily 웹 검색 결과입니다.

```
WEB SEARCH RESULTS:
[1] Next.js 15.1 릴리즈 노트 | https://...
    "Next.js 15.1에서 React 19 지원이 강화되었습니다..."
[2] ...
```

---

## 후보별 스타일 주입

`generateCandidates()`는 기본 시스템 프롬프트에 후보별 스타일 지침을 추가합니다.

```typescript
const augmentedSystem = `${systemPrompt}

---
RESPONSE STYLE FOR THIS CANDIDATE: ${STRATEGY_INSTRUCTIONS[strategy]}

CRITICAL RULES:
1. LANGUAGE: 사용자 메시지와 동일한 언어로만 답변
2. NO META-COMMENTARY: "Context applied:", "Strategy:" 등 태그 금지
3. 사용자 메시지를 직접 요약하거나 반복하지 말 것`
```

전략별 지침:

```typescript
STRATEGY_INSTRUCTIONS = {
  CONCISE:        'Be extremely concise. Get to the point immediately.',
  STRUCTURED:     'Use clear headings, bullet points, and numbered lists.',
  PROFESSIONAL:   'Use formal, expert-level language. Be authoritative.',
  ANALYTICAL:     'Break down systematically. Show clear reasoning.',
  FRIENDLY:       'Be warm, conversational, and encouraging.',
  ACTIONABLE:     'Focus on concrete next steps.',
  EDUCATIONAL:    'Explain concepts clearly with examples.',
  CREATIVE:       'Approach from an unexpected angle.',
  DIRECT:         'Answer first, explain after. No preamble.',
  COMPREHENSIVE:  'Cover all aspects thoroughly.',
}
```

---

## 프롬프트 버전 관리

매 대화마다 생성된 시스템 프롬프트는 `PromptVersion` 레코드로 저장됩니다.

```typescript
// savePromptVersion()
{
  userId: string,
  version: number,         // 자동 증가
  systemPrompt: string,    // 전체 조립된 프롬프트
  components: {            // 각 컴포넌트 개별 저장
    taskContext, memoryContext, examplesContext,
    persona, flowContext, globalMemoryContext
  },
  memoryHash: string | null,   // 이 프롬프트를 만든 Memory 버전
  tokenCount: number,          // 토큰 수 추정 (문자 수 / 4)
}
```

Prompt Lab 페이지에서 버전별 프롬프트 변화를 시각적으로 탐색할 수 있습니다.

---

## 프롬프트 A/B 실험

`/api/prompt-experiments` 엔드포인트로 두 가지 시스템 프롬프트를 동일한 입력에 테스트합니다.

```
실험 설계:
  promptA: "기존 시스템 프롬프트"
  promptB: "수정된 시스템 프롬프트"
  testInputs: ["질문 1", "질문 2", ...]

실험 결과:
  각 입력에 대해 A/B 두 버전의 응답 생성
  → 18차원 자동 평가
  → scoreA vs scoreB 비교
  → 우승 프롬프트 결정
```

---

## 설계 의도: 왜 이런 순서인가

**페르소나를 최우선으로 놓은 이유**: 페르소나는 AI의 "성격"을 정의합니다. 이후 모든 컴포넌트는 이 성격 위에서 해석됩니다. 뒤에 오는 Task Context나 Memory Context보다 페르소나의 톤과 스타일이 먼저 확립되어야 일관성이 생깁니다.

**검색 결과를 마지막에 놓은 이유**: 검색 결과는 가장 최신이고 사실적인 정보입니다. 마지막에 위치시켜 LLM이 이 정보를 사용자 선호나 페르소나보다 높은 신뢰도로 참조하도록 합니다. LLM은 일반적으로 프롬프트 후반부 내용에 더 집중하는 경향이 있습니다.

**Memory를 Global Memory보다 앞에 놓은 이유**: 개인 선호가 전체 사용자 패턴보다 우선해야 합니다. 전체적으로 STRUCTURED가 효과적이어도, 이 사용자가 CONCISE를 선호한다면 그것이 적용되어야 합니다.
