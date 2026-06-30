# Personalized AI Assistant — 기능 상세 문서

> **기준:** 코드 레벨 구현 기준으로 작성. Mock 모드 / 실제 LLM 모드별 동작 차이 명시.

---

## 목차

1. [채팅 — 학습 모드](#1-채팅--학습-모드)
2. [채팅 — 일반 모드](#2-채팅--일반-모드)
3. [태스크 분석](#3-태스크-분석)
4. [후보 생성](#4-후보-생성)
5. [18차원 평가 시스템](#5-18차원-평가-시스템)
6. [랭킹 공식](#6-랭킹-공식)
7. [선호도 로그 저장](#7-선호도-로그-저장)
8. [선호도 메모리 생성](#8-선호도-메모리-생성)
9. [XAI — "왜 이 답변인가?"](#9-xai--왜-이-답변인가)
10. [웹 검색 통합](#10-웹-검색-통합)
11. [페르소나 스튜디오](#11-페르소나-스튜디오)
12. [플로우 디자이너](#12-플로우-디자이너)
13. [전역 학습 파이프라인](#13-전역-학습-파이프라인)
14. [프롬프트 랩](#14-프롬프트-랩)
15. [A/B 실험](#15-ab-실험)
16. [데이터셋 내보내기](#16-데이터셋-내보내기)
17. [대시보드](#17-대시보드)
18. [인사이트](#18-인사이트)
19. [설정 동기화](#19-설정-동기화)
20. [인증 — 로그인 / 회원가입](#20-인증--로그인--회원가입)
21. [관리자 대시보드](#21-관리자-대시보드)
22. [LangGraph 백엔드](#22-langgraph-백엔드)
23. [LLM 제공자 추상화](#23-llm-제공자-추상화)

---

## 1. 채팅 — 학습 모드

**경로:** `/chat` → 우측 상단 "학습 모드 ON"

### 동작 흐름

```
사용자 메시지
    ↓
태스크 분석 (질문 유형, 복잡도, 도메인 분류)
    ↓
웹 검색 필요 여부 판단 → 필요 시 Tavily 검색
    ↓
시스템 프롬프트 조립 (메모리 + 페르소나 + 플로우 반영)
    ↓
3가지 전략으로 응답 동시 생성 (병렬 LLM 호출)
    ↓
카드 3장 표시 → 사용자가 하나 선택
    ↓
PreferenceLog DB 저장
    ↓
선택 5회마다 선호도 메모리 자동 업데이트
```

### 전략 세트 (태스크 유형별)

| 태스크 유형 | 전략 세트 |
|------------|---------|
| PROGRAMMING, RESEARCH | EDUCATIONAL · DIRECT · COMPREHENSIVE |
| CAREER, INTERVIEW | PROFESSIONAL · FRIENDLY · ACTIONABLE |
| 그 외 | STRUCTURED · CONCISE · ANALYTICAL |

### 전략별 응답 스타일

| 전략 | 특징 |
|------|-----|
| STRUCTURED | 헤딩·불릿 포인트·번호 목록 중심 |
| CONCISE | 극도로 간결, 핵심만 |
| ANALYTICAL | 문제 분해, 표·트레이드오프 제시 |
| PROFESSIONAL | 전문가 어조, 권위 있는 설명 |
| FRIENDLY | 따뜻하고 대화체, 쉬운 언어 |
| ACTIONABLE | 즉각적 다음 단계 중심 |
| EDUCATIONAL | 개념 설명 + 예시 |
| DIRECT | 결론 먼저, 설명 후 |
| COMPREHENSIVE | 모든 측면 철저하게 커버 |

### 사용 시점
- AI에게 취향을 가르치고 싶을 때
- 첫 사용 ~ 선택 10회 미만

---

## 2. 채팅 — 일반 모드

**경로:** `/chat` → 학습 모드 OFF 상태

### 동작 흐름

```
사용자 메시지
    ↓
태스크 분석
    ↓
웹 검색 (필요 시)
    ↓
시스템 프롬프트 조립 (축적된 선호도 메모리 반영)
    ↓
3가지 후보 동시 생성 (화면에 표시 안 됨)
    ↓
18차원 평가 → 랭킹 → 1등 선택
    ↓
1등 응답 실시간 스트리밍
    ↓
XAI 설명 + 신뢰도 점수 저장 (API 키 있을 때 표시)
```

### 학습 모드 vs 일반 모드 비교

| 항목 | 학습 모드 | 일반 모드 |
|------|---------|---------|
| 화면 표시 | 카드 3장 | 1개 스트리밍 |
| 사용자 액션 | 직접 선택 | 그냥 읽음 |
| 응답 속도 | 느림 (3개 생성 후 대기) | 빠름 |
| 목적 | 취향 데이터 수집 | 수집된 취향 활용 |
| 생성 응답 수 | 3개 | 3개 (내부) + 1개 스트리밍 |

---

## 3. 태스크 분석

**파일:** `src/services/ai/task-analyzer.ts`

### 분류 항목

| 필드 | 설명 | 예시 |
|------|-----|-----|
| `taskType` | 질문 유형 | CONVERSATION, PROGRAMMING, RESEARCH, CAREER... (16종) |
| `complexity` | 복잡도 | LOW / MEDIUM / HIGH |
| `domain` | 도메인 | general, programming, career 등 |
| `needsWebSearch` | 웹 검색 필요 여부 | 최신 정보, 가격, 뉴스 → true |
| `needsClarification` | 추가 질문 필요 여부 | boolean |
| `preferredStyle` | 선호 스타일 힌트 | concise / structured / detailed / conversational |
| `confidence` | 분류 신뢰도 | 0.0 ~ 1.0 |

### 지원 태스크 유형 (16종)
`CONVERSATION` `KNOWLEDGE` `PROGRAMMING` `WRITING` `TRANSLATION` `BRAINSTORMING` `RESEARCH` `PLANNING` `LEARNING` `PRODUCTIVITY` `SUMMARIZATION` `CAREER` `INTERVIEW` `DECISION` `SEARCH_REQUIRED` `OTHER`

### Mock 모드
LLM 분류 실패 시 `CONVERSATION / LOW / general / needsWebSearch: false` 기본값 반환.

---

## 4. 후보 생성

**파일:** `src/services/ai/candidate-generator.ts`

- 전략 3개를 **병렬**로 동시 LLM 호출 (`Promise.allSettled`)
- 각 후보: `{ strategy, content, index }`
- 1개라도 실패하면 나머지로 진행 (전체 실패 방지)
- 최대 생성 수: `LEARNING_CANDIDATES_COUNT = 3`
- 각 후보 최대 토큰: `maxTokens: 1500`

---

## 5. 18차원 평가 시스템

**파일:** `src/services/ai/expanded-evaluator.ts`

후보 각각을 18개 차원으로 0.0~1.0 점수화.

### 평가 차원

| # | 차원 | 설명 |
|---|-----|-----|
| 1 | `naturalness` | 자연스러운 어투 |
| 2 | `grammar` | 문법 정확성 |
| 3 | `toneConsistency` | 어조 일관성 |
| 4 | `personaConsistency` | 활성 페르소나와 일치도 |
| 5 | `instructionFollowing` | 지시사항 준수 |
| 6 | `factualAccuracy` | 사실 정확성 |
| 7 | `hallucinationRisk` | 허구 정보 위험도 (낮을수록 좋음) |
| 8 | `clarity` | 명확성 |
| 9 | `structure` | 구조화 수준 |
| 10 | `completeness` | 완결성 |
| 11 | `specificity` | 구체성 |
| 12 | `actionability` | 즉시 실행 가능성 |
| 13 | `readability` | 가독성 |
| 14 | `formatting` | 포맷팅 품질 |
| 15 | `safety` | 안전성 |
| 16 | `preferenceMatch` | 사용자 선호도와 일치도 |
| 17 | `searchGrounding` | 검색 결과 반영도 |
| 18 | `overallScore` | 종합 점수 |

추가 출력: `strengths[]`, `weaknesses[]`, `improvementSuggestions[]` (각 최대 3개)

### Mock 모드
결정론적 수식으로 점수 생성 (index 기반):
```
base = 0.65 + index * 0.05  (최대 0.9)
```

---

## 6. 랭킹 공식

**파일:** `src/services/ai/ranker.ts`

### 18차원 평가 사용 시 (일반)

```
최종 점수 =
  overallScore       × 0.40
  preferenceMatch    × 0.25
  personaConsistency × 0.15
  instructionFollowing × 0.10
  searchGrounding    × 0.10
```

### 8차원 평가 폴백

```
base =
  structure      × 0.10
  readability    × 0.15
  specificity    × 0.15
  completeness   × 0.15
  professionalism × 0.10
  formatting     × 0.10
  taskMatch      × 0.15
  preferenceMatch × 0.10

memoryBonus =
  strategyWeights[strategy] × 0.20  (선호도 메모리 있을 때)
  + 0.10  (preferredStrategies 목록에 있을 때)

최종 점수 = min(1.0, base + memoryBonus)
```

---

## 7. 선호도 로그 저장

**파일:** `src/app/api/preferences/route.ts`  
**테이블:** `PreferenceLog`

### 저장 항목

| 필드 | 설명 |
|------|-----|
| `selectedStrategy` | 선택한 응답 전략 |
| `selectedTags` | 선택 이유 태그 (최대 3개) |
| `taskType` | 태스크 유형 |
| `domain` | 도메인 |
| `complexity` | 복잡도 |
| `userQuery` | 원본 질문 |

### 선택 이유 태그 (예시)
`명확해요` `간결해요` `자세해요` `실용적이에요` `이해하기 쉬워요` `전문적이에요` `구조가 좋아요`

---

## 8. 선호도 메모리 생성

**파일:** `src/services/ai/memory-generator.ts`  
**테이블:** `PreferenceMemory`, `PreferenceMemoryVersion`

### 트리거 조건
선택 누적 수가 **5의 배수**(`MEMORY_UPDATE_THRESHOLD = 5`)가 될 때 자동 실행.

### 생성 항목

| 필드 | 설명 |
|------|-----|
| `preferredTone` | 선호 어조 (professional / friendly / neutral 등) |
| `preferredLength` | 선호 길이 (concise / medium / detailed) |
| `preferredStructure` | 선호 구조 (bullet-points / step-by-step / paragraph 등) |
| `preferredStrategies[]` | 자주 선택한 전략 목록 |
| `avoidedPatterns[]` | 회피 패턴 |
| `domainPreferences` | 도메인별 선호도 맵 `{ domain: weight }` |
| `strategyWeights` | 전략별 가중치 맵 `{ strategy: 0~1 }` |
| `rawSummary` | 2~3문장 자연어 요약 |

### 버전 관리
업데이트마다 `PreferenceMemoryVersion` 스냅샷 저장 → 인사이트 페이지에서 진화 타임라인 확인 가능.

### Mock 모드
`generateObject` LLM 호출 실패 시 메모리 생성 불가 (null 반환). **실제 LLM API 키 필요.**

---

## 9. XAI — "왜 이 답변인가?"

**파일:** `src/services/ai/explainer.ts`  
**테이블:** `ResponseExplanation`

일반 모드에서 응답 생성 후 자동으로 설명 생성. 채팅 메시지 아래 버튼 클릭으로 확인.

### 설명 항목

| 항목 | 내용 |
|------|-----|
| `selectedStrategy` | 선택된 전략 |
| `confidence` | 신뢰도 점수 (0~1) |
| `memoryInfluence[]` | 선호도 메모리가 어떻게 영향을 미쳤는지 |
| `reasoningFactors[]` | 이 응답이 선택된 이유 |
| `rankingDetails` | 후보별 점수 비교 |
| `promptVersion` | 사용된 프롬프트 버전 |

### 신뢰도 점수 계산

```
confidence =
  후보 점수           × 0.40
  preferenceMatch    × 0.30
  평가 overall score × 0.20
  메모리 있으면 +0.10 보너스
```

### 페르소나 / 플로우 영향 표시
활성 페르소나가 있을 때: `"'Professional' 페르소나가 formal 어조를 유도했습니다"`  
활성 플로우가 있을 때: `"'Tech Support' 플로우의 2단계 지침을 따랐습니다"`

### Mock 모드
XAI 버튼 및 신뢰도 배지 **UI에서 숨김** (`NEXT_PUBLIC_LLM_PROVIDER=mock`).

---

## 10. 웹 검색 통합

**파일:** `src/services/search/tavily.ts`  
**환경변수:** `TAVILY_API_KEY`

### 동작
태스크 분석에서 `needsWebSearch: true`일 때만 호출. 결과를 시스템 프롬프트에 컨텍스트로 삽입.

### 트리거 조건 (예시)
- 최신 뉴스, 현재 이슈
- 라이브러리 최신 버전, 공식 문서
- 가격, 통계, 실시간 데이터
- 최근 릴리즈, 업데이트

### LangGraph 백엔드 연결 시
백엔드가 직접 검색을 처리하므로 프론트 검색은 스킵.

### API 키 없을 때
에러 없이 조용히 스킵. 검색 없이 일반 응답 생성.

---

## 11. 페르소나 스튜디오

**경로:** `/persona-studio`  
**파일:** `src/services/ai/persona-manager.ts`  
**테이블:** `Persona`

### 기능
- CRUD (생성 · 조회 · 수정 · 삭제)
- 활성화 (동시에 1개만 활성)
- 기본 페르소나 5개 자동 생성 (첫 조회 시)

### 기본 제공 페르소나

| 이름 | 특징 |
|------|-----|
| Professional Assistant | 격식체, 구조화, 비즈니스 |
| Friendly Mentor | 따뜻함, 격려, 쉬운 언어 |
| Interview Coach | 면접 준비, 질문/피드백 중심 |
| Developer Mentor | 코드 중심, 예시, 단계별 |
| Research Assistant | 학술적, 객관적, 출처 의식 |

### 설정 항목

| 항목 | 설명 |
|------|-----|
| `speakingStyle` | formal / conversational / academic / casual |
| `tone` | professional / friendly / empathetic / assertive |
| `formalityLevel` | 1~5 (비격식 ~ 격식) |
| `humorLevel` | 1~5 |
| `empathyLevel` | 1~5 |
| `responseLength` | short / medium / long |
| `allowedBehaviors[]` | 허용 행동 목록 |
| `forbiddenBehaviors[]` | 금지 행동 목록 |
| `fallbackBehavior` | 불확실할 때 행동 |
| `refusalBehavior` | 거절 방식 |
| `clarificationBehavior` | 추가 질문 방식 |
| `promptFragment` | 시스템 프롬프트에 삽입될 텍스트 |

### 채팅 연동
활성 페르소나의 `promptFragment`가 시스템 프롬프트 최우선 순위로 삽입됨.

---

## 12. 플로우 디자이너

**경로:** `/flow-designer`  
**파일:** `src/services/ai/flow-manager.ts`  
**테이블:** `ConversationFlow`

### 기능
- 도메인별 대화 흐름 설계
- 트리거 조건 정의 → 매칭 시 자동 적용
- 단계별 지시사항 작성
- 시뮬레이션 실행 (`/api/flows/simulate`)
- 활성화 (동시에 1개만 활성)

### 플로우 설정 항목

| 항목 | 설명 |
|------|-----|
| `domain` | 적용 도메인 (programming / career / general 등) |
| `triggerCondition` | 활성화 조건 (텍스트 규칙) |
| `steps[]` | 단계별 지시사항 배열 |
| `fallbackPolicy` | 매칭 단계 없을 때 |
| `clarificationPolicy` | 명확화 요청 방식 |
| `errorRecoveryPolicy` | 오류 복구 방식 |
| `searchPolicy` | auto / always / never |

### 플로우 스텝 구조

```json
{
  "stepId": "step_1",
  "name": "문제 파악",
  "triggerKeywords": ["오류", "에러", "bug"],
  "instruction": "먼저 오류 메시지를 확인하고 재현 단계를 물어보세요",
  "action": "clarify",
  "searchRequired": false
}
```

---

## 13. 전역 학습 파이프라인

**경로:** `/dashboard/global-learning`  
**파일:** `src/services/ai/global-memory-generator.ts`  
**테이블:** `GlobalPreferenceMemory`

### 목적
모든 사용자의 선호도 로그를 집계해 전체 패턴 추출.

### 트리거 조건
전체 로그 수가 마지막 분석 이후 **50개 이상** 증가했을 때.

### 생성 항목

| 필드 | 설명 |
|------|-----|
| `mostSelectedStrategies[]` | 전체에서 가장 많이 선택된 전략 top 5 |
| `commonReasonTags[]` | 자주 등장한 이유 태그 top 10 |
| `domainPreferences[]` | 도메인별 최적 전략 |
| `highPerformingPatterns[]` | 고성과 패턴 |
| `lowPerformingPatterns[]` | 저성과 패턴 |
| `personaPerformance[]` | 페르소나별 성과 |
| `flowPerformance[]` | 플로우별 성과 |
| `summary` | 자연어 요약 |

### LLM 불필요
순수 DB 집계 방식 — Mock 모드에서도 완전히 동작.

### 채팅 연동
전역 메모리가 시스템 프롬프트에 포함되어 개인 메모리를 보강.

---

## 14. 프롬프트 랩

**경로:** `/prompt-lab`  
**파일:** `src/services/ai/prompt-builder.ts`  
**테이블:** `PromptVersion`

### 기능
매 채팅마다 조립된 시스템 프롬프트를 버전별로 저장하고 조회.

### 시스템 프롬프트 조립 우선순위

```
1. Safety baseline (항상)
2. 활성 페르소나 promptFragment
3. 활성 플로우 해당 스텝 instruction
4. 태스크 분석 컨텍스트
5. 개인 선호도 메모리
6. 전역 학습 패턴
7. 최근 선택된 예시
8. 웹 검색 컨텍스트
```

### 버전 저장 항목

| 항목 | 설명 |
|------|-----|
| `version` | 자동 증가 버전 번호 |
| `systemPrompt` | 전체 조립된 프롬프트 |
| `components` | 구성 요소별 텍스트 분리 저장 |
| `tokenCount` | 프롬프트 토큰 수 |
| `memoryHash` | 사용된 메모리 버전 참조 |

---

## 15. A/B 실험

**경로:** `/prompt-lab/experiments`  
**파일:** `src/services/ai/experiment-runner.ts`  
**테이블:** `PromptExperiment`, `PromptExperimentResult`

### 기능
두 가지 시스템 프롬프트를 동일한 입력에 대해 비교 평가.

### 실험 라이프사이클

```
DRAFT → RUNNING → COMPLETED
```

### 실험 생성 항목

| 항목 | 설명 |
|------|-----|
| `promptA` | 시스템 프롬프트 A |
| `promptB` | 시스템 프롬프트 B |
| `testInputs[]` | 테스트할 질문 목록 |
| `activePersonaId` | 적용할 페르소나 (선택) |
| `activeFlowId` | 적용할 플로우 (선택) |

### 실행 방식
각 testInput에 대해 promptA, promptB로 각각 LLM 호출 → 18차원 평가 → 점수 비교 → winner 결정.

### 결과 항목
각 케이스별: `outputA`, `outputB`, `scoreA`, `scoreB`, `preferredByEvaluator` (A / B / tie)

### Mock 모드
실험 실행은 가능하지만 Mock 텍스트 간 비교라 점수 차이가 무의미. 배너로 안내.

---

## 16. 데이터셋 내보내기

**경로:** `/datasets`  
**파일:** `src/services/data/dataset-exporter.ts`  
**테이블:** `DatasetExport`

### 내보내기 유형

| 유형 | 내용 | 용도 |
|------|-----|-----|
| `preference` | DPO 형식 (chosen/rejected 쌍) | 모델 파인튜닝 |
| `evaluation` | 18차원 점수 + 응답 | 평가 데이터셋 |
| `experiment` | A/B 실험 결과 | 프롬프트 최적화 |
| `conversation` | 전체 대화 히스토리 | SFT 데이터셋 |

### 출력 포맷

| 포맷 | 확장자 | 특징 |
|------|--------|-----|
| JSON | `.json` | 단일 배열 |
| JSONL | `.jsonl` | 줄당 1개 레코드 (HuggingFace 표준) |
| CSV | `.csv` | 스프레드시트 호환 |

### DPO 레코드 구조

```json
{
  "prompt": "사용자 질문",
  "chosen": "선택된 응답",
  "rejected": "거절된 응답",
  "chosen_strategy": "STRUCTURED",
  "reason_tags": ["명확해요", "구조가 좋아요"],
  "task_type": "PROGRAMMING",
  "domain": "programming"
}
```

### 필터 옵션
`taskType`, `domain`, `limit` (최대 레코드 수) 지정 가능.

---

## 17. 대시보드

**경로:** `/dashboard`

### 통계 카드

| 카드 | 데이터 소스 |
|------|-----------|
| 총 대화 수 | `Conversation` 테이블 |
| 총 메시지 수 | `Message` 테이블 |
| 선호도 로그 수 | `PreferenceLog` 테이블 |
| 메모리 버전 | `PreferenceMemory.version` |

### 차트
- **전략 분포** — 선택된 전략별 비율 (도넛 차트)
- **활동 추이** — 날짜별 대화/선택 수 (라인 차트)

### 서브 페이지

| 경로 | 내용 |
|------|-----|
| `/dashboard/rubric` | 18차원 평균 점수 시각화 |
| `/dashboard/global-learning` | 전역 학습 패턴 + 재생성 버튼 |

---

## 18. 인사이트

**경로:** `/insights`

### 표시 내용

| 섹션 | 내용 |
|------|-----|
| 현재 선호도 프로파일 | 선호 어조 / 길이 / 구조 |
| 학습 타임라인 | 메모리 버전별 변화 기록 |
| XAI 안내 | "왜 이 답변인가?" 사용 방법 |

### Mock 모드
선호도 프로파일 섹션, XAI 안내, 학습 타임라인에 Mock 모드 안내 배너 표시.

---

## 19. 설정 동기화

**경로:** `/settings`  
**API:** `GET/PATCH /api/settings`  
**테이블:** `UserSettings`

### 설정 항목

| 항목 | 기본값 | 설명 |
|------|--------|-----|
| Learning Mode | OFF | 학습/일반 모드 전환 |
| Automatic Web Search | ON | 자동 웹 검색 |
| Show Explanations | ON | XAI 버튼 표시 |
| Show Confidence Score | ON | 신뢰도 배지 표시 |

### 동기화 방식
- **마운트 시**: 서버에서 설정 로드 → Zustand store에 병합
- **변경 시**: 즉시 로컬 업데이트 → 600ms 디바운스 후 서버 PATCH
- **우측 상단**: `저장 중... / ☁ 저장됨 / 저장 실패` 상태 표시

### 사용자 식별
로그인 사용자 → JWT session ID  
비로그인 사용자 → 세션 쿠키 기반 User 레코드

---

## 20. 인증 — 로그인 / 회원가입

**경로:** `/auth/signin`, `/auth/signup`  
**파일:** `src/lib/auth.ts`

### 기술
- NextAuth v4, CredentialsProvider
- 비밀번호 bcryptjs 해싱
- JWT 세션 전략

### 비로그인 사용자
세션 쿠키 기반 익명 User 자동 생성. 로그인 없이도 모든 채팅 기능 사용 가능.

### JWT 토큰 페이로드
`id`, `email`, `name`, `role` (USER / ADMIN)

---

## 21. 관리자 대시보드

**경로:** `/admin`  
**미들웨어:** `src/middleware.ts` — ADMIN 역할 아닌 경우 자동 리다이렉트

### 초기 관리자 계정 생성
서버 시작 후 1회:
```bash
curl -X POST http://localhost:3000/api/admin/seed
# 계정: admin@adaptive-ai.com / admin1234!
```

### 기능

| 기능 | 설명 |
|------|-----|
| 플랫폼 통계 | 전체 사용자 수 / 대화 수 / 선호도 로그 수 / 메모리 보유 사용자 수 |
| 사용자 목록 | 이메일 / 역할 / 대화 수 / 선호도 로그 수 |
| 역할 변경 | USER ↔ ADMIN 토글 |

---

## 22. LangGraph 백엔드

**경로:** `http://localhost:8000`  
**파일:** `backend/app/features/assistant/graph.py`

### 구조
12노드 LangGraph 그래프. 프론트엔드와 독립적으로 동작.

### 노드 목록
`task_analyzer` → `web_searcher` → `context_builder` → `prompt_builder` → `candidate_generator` → `evaluator` → `ranker` → `response_selector` → `memory_updater` → `explainability` → `preference_manager` → `response_formatter`

### 프론트엔드 연동
백엔드 실행 중이면 채팅 API가 자동으로 백엔드 오케스트레이션 사용.  
타임아웃(8초) 또는 연결 실패 시 로컬 파이프라인으로 자동 폴백.

### 실행 방법
```bash
cd backend
pip install fastapi uvicorn langgraph langchain-core httpx pydantic structlog
uvicorn app.main:app --reload
```

---

## 23. LLM 제공자 추상화

**파일:** `src/services/ai/provider/index.ts`

### 환경변수 하나로 전환

```bash
# .env.local
LLM_PROVIDER=mock      # 기본값, API 키 불필요
LLM_PROVIDER=openai    # OPENAI_API_KEY 필요
LLM_PROVIDER=anthropic # ANTHROPIC_API_KEY 필요
LLM_PROVIDER=google    # GOOGLE_API_KEY 필요
```

### 모델 역할 분리

| 메서드 | 용도 | 기본 모델 |
|--------|-----|---------|
| `getModel()` | 복잡한 작업 (후보 생성, 메모리 합성, 설명 생성) | gpt-4o / claude-sonnet-4-6 / gemini-2.5-pro |
| `getFastModel()` | 빠른 작업 (태스크 분석, 평가, 설명 팩트) | gpt-4o-mini / claude-haiku / gemini-2.0-flash |

### Mock 제공자
API 키 없이 전략별 결정론적 텍스트 생성. 스트리밍 시뮬레이션(25ms 간격).  
`generateObject` 호출은 지원하지 않아 메모리 생성, XAI 설명 등 구조화 출력이 필요한 기능은 폴백 처리됨.

---

## 환경변수 요약

```bash
# 필수
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."

# LLM (하나 선택)
LLM_PROVIDER="openai"        # or anthropic / google / mock
OPENAI_API_KEY="sk-..."
NEXT_PUBLIC_LLM_PROVIDER="openai"  # 클라이언트 UI 분기용 (LLM_PROVIDER와 동일값)

# 선택
TAVILY_API_KEY="tvly-..."    # 웹 검색
LANGGRAPH_BACKEND_URL="http://localhost:8000"  # LangGraph 백엔드
```

---

## 24. 인증 — 계정 기반 학습 시스템

**경로:** `/auth/signin` · `/auth/signup`

### 구조

NextAuth v4 JWT 전략 + CredentialsProvider (이메일 + bcrypt 비밀번호).

```
모든 API 라우트에서 사용자 ID 해석 순서:
  1. NextAuth JWT 토큰 → 실제 계정 userId
  2. 쿠키 세션 → 익명 userId (upsert)
  3. 없음 → 'anonymous'
```

`src/lib/resolve-user.ts`의 `resolveUserContext()` / `resolveUserId()` 헬퍼가 모든 라우트에서 통일된 판단을 처리한다.

### 로그인 시 데이터 이전

```
익명으로 대화 → 로그인
  ↓
/api/auth/migrate-session 자동 호출
  ↓
Conversations, PreferenceLogs, PromptVersions,
PreferenceSuggestions, PreferenceMemory, UserSettings
  → 익명 User에서 인증 User로 이전
  → 익명 User 레코드 삭제
```

로그인 전에 나눈 대화와 학습 데이터가 계정으로 이어진다.

**Mock / 실제 LLM 차이 없음** — 인증 레이어는 LLM과 무관하게 동작.

---

## 25. 대화 히스토리 사이드바

**경로:** `/chat` 좌측

### 동작

- 접힘/펼침 토글 (w-60 ↔ w-12)
- `GET /api/conversations` — 사용자 소유 대화 목록 최신순
- 경로 변경 시 자동 새로고침
- 제목, 메시지 수, 상대 날짜 표시
- 호버 시 삭제 버튼 노출
- 현재 대화 하이라이트

---

## 26. 유저 프로필 + 장기 기억 주입

**경로:** `/profile`

### 저장 항목

| 필드 | 용도 |
|------|------|
| displayName | 이름 |
| occupation | 직업 |
| interests | 관심사 태그 배열 |
| goals | 현재 목표 배열 |
| background | 배경 지식 |
| language | 선호 언어 (ko / en) |
| autoExtract | 대화에서 자동 추출 여부 |

### 프롬프트 주입

프로필이 있으면 시스템 프롬프트 최상단에 삽입된다:

```
USER PROFILE (personalize responses based on this):
- Name: 김태빈
- Occupation: 백엔드 엔지니어
- Interests: TypeScript, AI, 스타트업
- Current goals: 포트폴리오 완성, 이직 준비
- Language preference: ko
```

---

## 27. 대화 자동 요약 + 맥락 이어가기

**서비스:** `src/services/ai/conversation-summarizer.ts`

### 트리거 조건

- 메시지 6개 이상 (USER + ASSISTANT 합산)
- 아직 요약이 없는 대화 (`summary === null`)

### 동작

```typescript
generateText({ maxTokens: 150, prompt: '다음 대화를 1-2문장으로 요약...' })
// → "사용자가 TypeScript 제네릭 활용법에 대해 논의함"
```

**Mock 모드:** `사용자가 '...' 에 대해 논의함` 고정 패턴

### 다음 대화에 주입

```
RECENT CONVERSATION CONTEXT:
[TypeScript 프로젝트] 사용자가 TypeScript 제네릭 활용법에 대해 논의함
---
[React 상태관리] 사용자가 Zustand vs Redux 비교를 질문함
---
[취업 준비] 사용자가 포트폴리오 방향에 대해 고민을 나눔
```

---

## 28. 파일 첨부 (이미지 / 텍스트 / 코드)

**컴포넌트:** `src/features/assistant/components/chat-input.tsx`

### 지원 형식

- **이미지:** `image/*` — base64로 변환, multimodal 파트로 LLM 전달
- **텍스트/코드:** `.txt .md .ts .tsx .js .jsx .py .json .csv .pdf` — 내용 추출 후 메시지에 삽입

### 제한

- 최대 3개 동시 첨부
- 텍스트 파일 최대 50KB

### API 처리 (`/api/chat`)

```
텍스트 파일 → 사용자 메시지 하단에 펜스드 코드블록으로 삽입
이미지 파일 → multimodal content [{ type:'text' }, { type:'image', image: base64 }]
```

**실제 LLM:** 이미지 내용 분석 (Vision API)  
**Mock 모드:** 이미지 미지원, 텍스트 파일만 컨텍스트 삽입

---

## 29. 음성 입력

**컴포넌트:** `src/features/assistant/components/chat-input.tsx`

### 동작

- 브라우저가 `SpeechRecognition` / `webkitSpeechRecognition`을 지원할 때만 마이크 버튼 노출 (Chrome, Edge)
- 언어: `ko-KR`
- 녹음 중: 빨간 펄스 애니메이션 + `MicOff` 아이콘
- 음성 인식 완료 시 트랜스크립트가 기존 입력에 이어 붙음
- 텍스트에어리아 자동 높이 조절

**LLM 무관** — Web Speech API는 브라우저가 처리. Mock / 실제 LLM 동일하게 동작.

---

## 30. 설정 서버 동기화

**경로:** `/settings`  
**API:** `GET / PATCH /api/settings`

### 동작

- 마운트 시 서버에서 설정 로드 → Zustand에 병합
- 토글 변경 시 600ms 디바운스 후 PATCH
- 저장 상태 표시: `저장 중...` / `☁ 저장됨` / `저장 실패`

### 저장 항목

```typescript
{
  defaultMode: 'NORMAL' | 'LEARNING'
  autoSearch: boolean
  showExplanations: boolean
  showConfidence: boolean
}
```

어느 기기에서 로그인해도 동일한 설정이 유지된다.

---

## 31. 태스크 유형별 페르소나 자동 선택

**서비스:** `src/services/ai/persona-manager.ts` → `resolvePersonaForTask()`

### 매핑

| 태스크 유형 | 자동 선택 페르소나 |
|------------|-----------------|
| PROGRAMMING | Developer Mentor |
| CAREER | Interview Coach |
| INTERVIEW | Interview Coach |
| RESEARCH | Research Assistant |
| LEARNING | Friendly Mentor |
| WRITING | Professional Assistant |

### 우선순위

1. 사용자가 수동 활성화한 페르소나 → 항상 우선
2. 태스크 매핑 → 수동 페르소나 없을 때만

---

*작성 기준: 2026-06-30 / 코드베이스 기준*
