# 06 페르소나 시스템 (Persona System)

## 개요

Persona (페르소나)는 AI 비서의 "성격"을 정의합니다. 같은 LLM을 사용하더라도 어떤 페르소나를 적용하느냐에 따라 말투, 깊이, 형식, 강조점이 달라집니다.

이 시스템의 핵심은 **태스크 유형에 따른 자동 페르소나 선택**입니다. 사용자가 프로그래밍 질문을 하면 Developer Mentor가, 면접 질문을 하면 Interview Coach가 자동으로 활성화됩니다. 사용자가 직접 페르소나를 고정해두면 모든 대화에 그 페르소나가 유지됩니다.

---

## 기본 제공 페르소나 5종

### Professional Assistant

```
설명: 형식적이고 정확한 비즈니스 응답
말투: formal
격식 수준: 5/5
허용: structured responses, bullet points, executive summaries
금지: casual language, slang, excessive enthusiasm
예시 refusal: "I am unable to assist with that request"
```

**적합한 상황**: 비즈니스 글쓰기, 공식 이메일, 보고서 작성, 포트폴리오 정리

### Friendly Mentor

```
설명: 따뜻하고 격려적인 접근
말투: conversational
격식 수준: 2/5
공감 수준: 5/5
허용: encouragement, analogies, relatable examples
금지: harsh criticism, overly technical jargon
예시 clarification: "Great question! Could you tell me a bit more?"
```

**적합한 상황**: 새로운 개념 학습, 막막한 문제 시작, 개인적 고민

### Interview Coach

```
설명: STAR 방법론 기반 면접 코칭
말투: coaching
격식 수준: 4/5
응답 길이: long
허용: STAR framework, practice questions, feedback, role-play
금지: vague advice, generic tips
```

**적합한 상황**: 면접 준비, 자기소개서 검토, 직무 역량 연습

### Developer Mentor

```
설명: 코드 중심의 기술적 깊이 있는 설명
말투: technical
격식 수준: 3/5
응답 길이: long
허용: code examples, ASCII architecture diagrams, tradeoff analysis
금지: vague explanations, skipping edge cases
예시 clarification: "Could you share the relevant code or error message?"
```

**적합한 상황**: 코딩 문제, 아키텍처 설계, 디버깅, 기술 학습

### Research Assistant

```
설명: 분석적이고 증거 기반의 연구 지원
말투: academic
격식 수준: 4/5
허용: citations format, structured analysis, multiple perspectives
금지: unsupported claims, oversimplification
```

**적합한 상황**: 리서치, 논문 분석, 비교 분석, 의사결정 근거 탐색

---

## 태스크 유형 → 페르소나 자동 매핑

```typescript
// persona-manager.ts
const TASK_PERSONA_MAP: Record<string, string> = {
  PROGRAMMING: 'Developer Mentor',
  CAREER:      'Interview Coach',
  INTERVIEW:   'Interview Coach',
  RESEARCH:    'Research Assistant',
  LEARNING:    'Friendly Mentor',
  WRITING:     'Professional Assistant',
}
```

### 우선순위 규칙

```
1순위: 사용자가 직접 활성화한 페르소나 (Persona Studio에서 설정)
2순위: 태스크 유형에 매핑된 기본 페르소나
3순위: Base Persona (매핑 없는 태스크 유형의 기본값)
```

```typescript
export async function resolvePersonaForTask(taskType: string): Promise<Persona | null> {
  // 1. 수동 활성화된 페르소나 우선
  const active = await prisma.persona.findFirst({ where: { isActive: true } })
  if (active) return dbToPersona(active)

  // 2. 태스크 매핑된 기본 페르소나
  const targetName = TASK_PERSONA_MAP[taskType]
  if (!targetName) return null
  return await prisma.persona.findFirst({ where: { name: targetName } })
}
```

---

## Persona Studio — 사용자 정의 페르소나

Persona Studio에서 새 페르소나를 직접 설계할 수 있습니다.

### 설계 가능한 속성

| 속성 | 설명 | 예시 |
|---|---|---|
| `name` | 페르소나 이름 | "김 팀장 스타일" |
| `speakingStyle` | 말하는 방식 | formal / conversational / coaching / technical / academic |
| `tone` | 전반적 톤 | professional / friendly / motivational / precise / analytical |
| `formalityLevel` | 격식 수준 | 1-5 |
| `humorLevel` | 유머 수준 | 1-5 |
| `empathyLevel` | 공감 수준 | 1-5 |
| `responseLength` | 응답 길이 | short / medium / long |
| `allowedBehaviors` | 허용 행동 | ["code examples", "bullet points"] |
| `forbiddenBehaviors` | 금지 행동 | ["casual language"] |
| `fallbackBehavior` | 기본 응답 방식 | "Provide formal response" |
| `refusalBehavior` | 거절 시 문구 | "I am unable to assist" |
| `clarificationBehavior` | 질문 시 문구 | "Could you clarify?" |
| `promptFragment` | 직접 작성하는 페르소나 지침 | "Act as..." |

### Prompt Fragment 작성 예시

```
Act as a strict Korean-style team lead. 
Always respond in Korean.
- Code review: Point out 3 issues minimum
- Architecture: Always discuss SOLID principles
- No sugarcoating — be direct about problems
- Add "이 부분은 꼭 확인하세요:" 섹션을 마지막에 추가
```

---

## 페르소나와 Preference Memory의 상호작용

페르소나와 Preference Memory는 독립적으로 작동하지만 서로 보완합니다.

```
시스템 프롬프트 조립 시:
  페르소나 → 응답의 "성격" (말투, 형식, 깊이)을 결정
  Preference Memory → 응답 "전략"의 선호 (STRUCTURED vs CONCISE)를 반영

XAI 패널에서:
  memoryInfluence에 페르소나 영향이 명시됨
  "'Developer Mentor' 페르소나가 기술적 깊이와 코드 중심 설명을 유도했습니다."
```

---

## 데이터베이스 저장

`Persona` 테이블의 배열 필드(`allowedBehaviors`, `forbiddenBehaviors`, `exampleResponses`)는 JSON 문자열로 저장됩니다.

```typescript
// 저장 시
await prisma.persona.create({
  data: {
    ...persona,
    allowedBehaviors: JSON.stringify(persona.allowedBehaviors),
    forbiddenBehaviors: JSON.stringify(persona.forbiddenBehaviors),
  }
})

// 읽기 시
function dbToPersona(row): Persona {
  return {
    ...row,
    allowedBehaviors: JSON.parse(row.allowedBehaviors || '[]'),
    forbiddenBehaviors: JSON.parse(row.forbiddenBehaviors || '[]'),
  }
}
```

---

## 설계 의도: 왜 페르소나를 태스크 유형에 자동 매핑했는가

사용자는 매 대화마다 페르소나를 선택하지 않습니다. 프로그래밍 질문을 하면 자연스럽게 Developer Mentor가 활성화되어야 합니다. 이는 사용자 마찰을 줄이면서도 적절한 응답 스타일을 자동 적용하는 방법입니다.

동시에 사용자가 원한다면 원하는 페르소나를 고정할 수 있습니다. "나는 항상 Friendly Mentor 스타일로 받고 싶다"는 요구를 수용합니다.
