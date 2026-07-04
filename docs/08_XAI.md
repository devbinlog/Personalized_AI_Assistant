# 08 설명 가능한 AI (XAI — Explainable AI)

## 개요

XAI (Explainable AI)는 "왜 이 답변이 선택됐는가"를 사용자가 이해할 수 있는 언어로 설명하는 기능입니다. 설명할 수 없는 AI는 신뢰할 수 없습니다. 이 패널은 AI의 모든 결정을 투명하게 공개합니다.

```
일반 모드 응답 후:
┌─────────────────────────────────────────────────┐
│  AI 응답 텍스트                    [Why this?]  │
└─────────────────────────────────────────────────┘
                        ↓ 클릭
┌─────────────────────────────────────────────────┐
│  XAI 패널                                       │
│  ──────────────────────────────────────────     │
│  신뢰도: 0.82                                   │
│                                                 │
│  Memory 영향                                    │
│  • 'Developer Mentor' 페르소나가 기술적 깊이    │
│    와 코드 중심 설명을 유도했습니다             │
│  • Preference Memory v3: STRUCTURED 전략 선호   │
│    가 이 선택에 영향을 줬습니다                 │
│                                                 │
│  선정 이유                                      │
│  • STRUCTURED 전략이 이 질문 유형에서 최고점    │
│  • 직접적인 질문에 잘 대응                      │
│  • 사용자 선호 이력과 잘 일치                   │
│                                                 │
│  후보 랭킹                                      │
│  1위 STRUCTURED     ████████████ 0.87           │
│  2위 ANALYTICAL     ████████     0.73           │
│  3위 EDUCATIONAL    ██████       0.61           │
└─────────────────────────────────────────────────┘
```

---

## XAI 생성 프로세스

`generateExplanation()`이 응답 저장 직후 비동기로 실행됩니다.

### 입력 데이터

```typescript
await generateExplanation(
  messageId,           // 연결할 메시지 ID
  userQuery,           // 사용자 원본 질문
  bestCandidate,       // 선택된 후보 (전략, 점수, 랭킹 이유)
  allCandidates,       // 모든 후보 (랭킹 비교용)
  evaluation,          // 8차원 평가 점수
  memory,              // 현재 Preference Memory
  promptVersion,       // 이 응답에 사용된 프롬프트 버전
  activePersona,       // 활성 페르소나 (있을 때)
  activeFlow,          // 활성 대화 흐름 (있을 때)
  globalMemory,        // 전역 학습 데이터
)
```

### LLM 호출로 설명 생성

```typescript
// ExplanationSchema (Zod)
const ExplanationSchema = z.object({
  memoryInfluence: z.array(z.string()).max(5),   // Memory가 어떻게 영향 줬나
  reasoningFactors: z.array(z.string()).max(5),  // 왜 이 응답이 적합한가
})

// LLM 프롬프트
`Generate a concise, product-level explanation of why a specific AI response was selected.
Do NOT expose chain-of-thought or internal LLM reasoning.
Write from the perspective of the AI system explaining its personalization decisions.
Each item should be one clear sentence the user can understand.`
```

### 설명 보강: 페르소나/플로우/글로벌 메모리

LLM 응답에 자동으로 추가 컨텍스트가 붙습니다.

```typescript
// 페르소나 영향 주입
if (activePersona) {
  memoryInfluence.unshift(
    `'${activePersona.name}' 페르소나가 ${activePersona.tone} 톤과 ${activePersona.speakingStyle} 스타일을 유도했습니다`
  )
}

// 대화 흐름 영향 주입
if (activeFlow) {
  reasoningFactors.push(
    `'${activeFlow.name}' 대화 흐름이 응답 구조를 형성했습니다`
  )
}

// 전역 패턴 인사이트
if (globalMemory?.mostSelectedStrategies?.[0]) {
  reasoningFactors.push(
    `전역 패턴: ${globalMemory.mostSelectedStrategies[0].strategy}이 전체 사용자에서 가장 효과적인 전략입니다`
  )
}
```

---

## 신뢰도 점수 계산

`computeConfidence()`가 5가지 차원으로 신뢰도를 계산합니다.

```typescript
function computeConfidence(selected, evaluation, memory): ConfidenceBreakdown {
  const preferenceMatch  = evaluation?.preferenceMatch ?? 0.5   // 선호 일치도
  const promptMatch      = memory ? 0.8 : 0.5                   // 프롬프트-Memory 매칭
  const taskMatch        = evaluation?.taskMatch ?? 0.7          // 태스크 적합성
  const searchConfidence = 0.8                                   // 검색 근거 신뢰도
  const recentSimilarity = memory ? min(1, memory.logCount / 20) : 0  // 학습 충분도

  const overall =
    preferenceMatch  * 0.30 +
    promptMatch      * 0.20 +
    taskMatch        * 0.25 +
    searchConfidence * 0.10 +
    recentSimilarity * 0.15
}
```

신뢰도 해석:

| 점수 | 의미 |
|---|---|
| 0.9+ | Memory가 충분히 쌓임. AI가 사용자 스타일을 정확히 파악 |
| 0.7-0.9 | 적절한 학습. 대부분의 상황에서 좋은 선택 |
| 0.5-0.7 | 초기 학습 중. 추측이 많이 포함됨 |
| 0.5 미만 | Memory 없음. 일반적 기준으로 선택 |

---

## 저장 구조

```typescript
// ResponseExplanation 테이블
{
  messageId: string,           // Message와 1:1 관계
  selectedStrategy: string,    // 선택된 전략
  confidence: number,          // 신뢰도 점수
  memoryInfluence: string[],   // JSON으로 저장 (배열)
  reasoningFactors: string[],  // JSON으로 저장 (배열)
  memorySnapshot: JSON,        // 이 시점의 Memory 스냅샷
  rankingDetails: JSON,        // 모든 후보의 전략/점수/이유
  promptVersion: number,       // 사용된 프롬프트 버전
}
```

`memorySnapshot`에 당시 Memory의 스냅샷을 저장하는 이유: Memory가 이후에 갱신되더라도 "그 시점에 어떤 Memory로 이 응답이 선택됐는지" 추적할 수 있습니다.

---

## /api/explanation 엔드포인트

클라이언트가 XAI 패널을 열 때 호출합니다.

```typescript
GET /api/explanation?messageId=xxx

// 응답
{
  selectedStrategy: "STRUCTURED",
  confidence: 0.82,
  memoryInfluence: [
    "'Developer Mentor' 페르소나가 기술적 깊이와 코드 중심 설명을 유도했습니다",
    "Preference Memory v3: STRUCTURED 전략 선호가 이 선택에 영향을 줬습니다"
  ],
  reasoningFactors: [
    "STRUCTURED 전략이 이 PROGRAMMING 유형 질문에서 최고 점수를 받았습니다",
    "사용자 선호 이력과 잘 일치합니다"
  ],
  rankingDetails: [
    { strategy: "STRUCTURED",  score: 0.87, reasons: ["Directly addresses...", "High readability"] },
    { strategy: "ANALYTICAL",  score: 0.73, reasons: [...] },
    { strategy: "EDUCATIONAL", score: 0.61, reasons: [...] }
  ],
  memorySnapshot: { preferredTone: "professional", ... },
  promptVersion: 12
}
```

---

## 설계 의도: 내부 로직을 그대로 노출하지 않는 이유

XAI를 설계할 때 가장 어려웠던 결정은 "어디까지 보여줄 것인가"였습니다.

초기 시도: 평가 점수 8개 차원을 모두 수치로 나열 → 사용자에게 의미 없는 숫자의 나열

최종 방향: LLM이 기술적 판단을 사용자가 이해할 수 있는 자연어로 번역

LLM 프롬프트에 명시한 제약:
```
"Do NOT expose chain-of-thought or internal LLM reasoning.
Write from the perspective of the AI system explaining its personalization decisions.
Each item should be one clear sentence the user can understand."
```

결과적으로 XAI 패널은 기술적 정확성과 사용자 이해 가능성 사이의 균형을 맞춥니다. 점수는 시각적 막대로 표현하고, 이유는 자연어 문장으로 표현합니다.
