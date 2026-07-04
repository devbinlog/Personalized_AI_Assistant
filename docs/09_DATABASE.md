# 09. 데이터베이스 설계

## 왜 이런 구조를 설계했는가

Personalized AI Assistant는 단순한 채팅 기록 저장이 아니라, **사용자의 선택 패턴을 학습하고 메모리를 진화시키는 구조**가 필요했습니다.

이를 위해 데이터베이스는 세 가지 역할을 동시에 수행합니다:

1. **대화 기록 저장**: 메시지, 후보 응답, 사용자 선택
2. **학습 데이터 누적**: 선호도 로그 → 메모리 합성의 원재료
3. **시스템 상태 관리**: 페르소나, 플로우, 실험, 글로벌 메모리

---

## 기술 선택

| 환경 | 데이터베이스 | 이유 |
|------|-------------|------|
| 로컬 개발 | SQLite | 설치 없이 즉시 시작 |
| 프로덕션 | PostgreSQL (Neon) | 연결 풀링, 확장성 |
| ORM | Prisma 5 | 타입 안전, 마이그레이션 관리 |

### Neon + PgBouncer 연결 설정

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")      // 풀링 연결 (런타임)
  directUrl = env("POSTGRES_URL_NON_POOLING") // 직접 연결 (마이그레이션)
}
```

Vercel의 서버리스 환경에서는 요청마다 새 연결이 생성될 수 있어, PgBouncer를 통한 연결 풀링이 필수입니다.

---

## 전체 스키마 구조

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 영역                            │
│  User ──┬── UserProfile   (직업, 관심사, 목표)               │
│         ├── UserSettings  (기본 모드, 표시 옵션)              │
│         └── PreferenceMemory  (학습된 선호도)                 │
│                  └── PreferenceMemoryVersion (버전 이력)      │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                      대화 영역                                │
│  Conversation ──── Message ──┬── ResponseCandidate           │
│                              ├── PreferenceLog               │
│                              ├── ResponseExplanation (XAI)   │
│                              └── ResponseEvaluation (8차원)  │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                      시스템 영역                              │
│  Persona                (AI 페르소나 설정)                    │
│  ConversationFlow       (도메인별 대화 규칙)                  │
│  PromptVersion          (프롬프트 버전 이력)                  │
│  PromptExperiment       (A/B 테스트)                          │
│  GlobalPreferenceMemory (전체 사용자 학습 인사이트)            │
│  SearchCache            (웹 검색 캐시)                        │
│  DatasetExport          (DPO 학습 데이터 내보내기)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 핵심 모델 상세

### User

```prisma
model User {
  id        String  @id @default(cuid())
  email     String? @unique
  password  String?           // bcrypt 해시
  name      String?
  role      String  @default("USER")   // USER | ADMIN
  sessionId String? @unique   // 비로그인 사용자 익명 세션
}
```

- **이중 인증 지원**: 로그인 사용자(email/password) + 익명 쿠키 세션
- `sessionId`를 통해 로그인 전 대화를 로그인 후 계정으로 자동 마이그레이션

### PreferenceLog — 학습의 원재료

```prisma
model PreferenceLog {
  selectedStrategy String   // "STRUCTURED" | "CONCISE" | ...
  selectedTags     String   // JSON: ["More structured", "Better tone"]
  taskType         String   // "PROGRAMMING" | "RESEARCH" | ...
  domain           String?  // "software" | "writing" | ...
  userQuery        String   // 실제 사용자 질문
}
```

사용자가 후보 카드에서 응답을 선택할 때마다 쌓이는 데이터입니다. 5개 이상 누적되면 LLM이 이를 분석해 `PreferenceMemory`를 자동 갱신합니다.

### PreferenceMemory — 진화하는 메모리

```prisma
model PreferenceMemory {
  preferredTone        String?  // "concise" | "detailed" | ...
  preferredLength      String?  // "short" | "medium" | "long"
  preferredStructure   String?  // "bullet-points" | "paragraphs"
  preferredStrategies  String   // JSON: ["STRUCTURED", "ANALYTICAL"]
  avoidedPatterns      String   // JSON: ["verbose-intro", "repetition"]
  domainPreferences    String?  // JSON: {programming: "DIRECT"}
  strategyWeights      String?  // JSON: {STRUCTURED: 0.8, CONCISE: 0.6}
  rawSummary           String?  // LLM이 작성한 자연어 요약
  version              Int      // 몇 번 업데이트됐는지
}
```

배열/오브젝트 필드는 SQLite 호환성을 위해 **JSON 문자열**로 저장하고, 읽을 때 `JSON.parse()`로 복원합니다.

### ResponseEvaluation — 18차원 자동 평가

```prisma
model ResponseEvaluation {
  naturalness           Float  // 자연스러움
  grammar               Float  // 문법
  toneConsistency       Float  // 톤 일관성
  personaConsistency    Float  // 페르소나 일치
  instructionFollowing  Float  // 지시 준수
  factualAccuracy       Float  // 사실 정확성
  hallucinationRisk     Float  // 환각 위험도
  clarity               Float  // 명확성
  structure             Float  // 구조
  completeness          Float  // 완전성
  specificity           Float  // 구체성
  actionability         Float  // 실행 가능성
  readability           Float  // 가독성
  formatting            Float  // 포맷팅
  safety                Float  // 안전성
  preferenceMatch       Float  // 사용자 선호 일치도
  searchGrounding       Float  // 검색 결과 근거
  overallScore          Float  // 종합 점수
}
```

---

## JSON 필드 처리 패턴

SQLite는 배열/JSON 타입을 네이티브로 지원하지 않기 때문에, 모든 배열/객체 필드를 문자열로 직렬화합니다.

```typescript
// 쓰기
await prisma.preferenceMemory.create({
  data: {
    preferredStrategies: JSON.stringify(['STRUCTURED', 'CONCISE']),
    strategyWeights: JSON.stringify({ STRUCTURED: 0.8 }),
  }
})

// 읽기
const memory = await prisma.preferenceMemory.findUnique(...)
const strategies = JSON.parse(memory.preferredStrategies as string)
```

PostgreSQL로 전환 시에도 이 패턴은 그대로 유지됩니다 (기존 직렬화 레이어 호환).

---

## 로컬 → 프로덕션 전환

```bash
# 로컬 (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# 프로덕션 (Neon PostgreSQL)
POSTGRES_PRISMA_URL="postgresql://...?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgresql://..."
```

schema.prisma의 `provider`만 변경하면 전환됩니다:

```prisma
// 로컬
datasource db { provider = "sqlite" }

// 프로덕션
datasource db { provider = "postgresql" }
```

---

## 인덱스 전략

자주 조회되는 패턴에 인덱스를 설계했습니다:

| 모델 | 인덱스 | 이유 |
|------|--------|------|
| User | `sessionId` | 익명 사용자 세션 조회 |
| Conversation | `(userId, createdAt)` | 사용자별 최신 대화 목록 |
| Message | `(conversationId, createdAt)` | 대화 내 메시지 순서 조회 |
| PreferenceLog | `(userId, createdAt)`, `selectedStrategy` | 학습 데이터 집계 |
| PreferenceSuggestion | `(userId, status)` | 대기 중인 제안 조회 |

---

## 관련 문서

- [05_PREFERENCE_LEARNING.md](./05_PREFERENCE_LEARNING.md) — 선호도 로그 → 메모리 합성 흐름
- [08_XAI.md](./08_XAI.md) — ResponseExplanation 생성 방식
- [02_ARCHITECTURE.md](./02_ARCHITECTURE.md) — 전체 시스템 구조
