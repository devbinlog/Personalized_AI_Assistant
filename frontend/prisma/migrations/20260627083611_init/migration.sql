-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "taskAnalysis" TEXT,
    "searchUsed" BOOLEAN NOT NULL DEFAULT false,
    "searchQuery" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "response_candidates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "score" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "response_candidates_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "preference_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "selectedStrategy" TEXT NOT NULL,
    "selectedTags" TEXT NOT NULL DEFAULT '[]',
    "taskType" TEXT NOT NULL,
    "domain" TEXT,
    "complexity" TEXT,
    "userQuery" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "preference_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "preference_logs_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "preference_logs_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "response_candidates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "preference_memories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "preferredTone" TEXT,
    "preferredLength" TEXT,
    "preferredStructure" TEXT,
    "preferredStrategies" TEXT NOT NULL DEFAULT '[]',
    "avoidedPatterns" TEXT NOT NULL DEFAULT '[]',
    "domainPreferences" TEXT,
    "strategyWeights" TEXT,
    "rawSummary" TEXT,
    "logCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "preference_memories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "preference_memory_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "diff" TEXT,
    "triggerLogCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "preference_memory_versions_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "preference_memories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prompt_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "components" TEXT NOT NULL,
    "memoryHash" TEXT,
    "tokenCount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prompt_versions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "response_explanations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "selectedStrategy" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "memoryInfluence" TEXT NOT NULL DEFAULT '[]',
    "reasoningFactors" TEXT NOT NULL DEFAULT '[]',
    "memorySnapshot" TEXT,
    "rankingDetails" TEXT,
    "promptVersion" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "response_explanations_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "preference_suggestions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currentValue" TEXT,
    "suggestedValue" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "triggerLogIds" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "respondedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "preference_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "search_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "results" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_sessionId_key" ON "users"("sessionId");

-- CreateIndex
CREATE INDEX "users_sessionId_idx" ON "users"("sessionId");

-- CreateIndex
CREATE INDEX "conversations_userId_createdAt_idx" ON "conversations"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "response_candidates_messageId_idx" ON "response_candidates"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "preference_logs_messageId_key" ON "preference_logs"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "preference_logs_candidateId_key" ON "preference_logs"("candidateId");

-- CreateIndex
CREATE INDEX "preference_logs_userId_createdAt_idx" ON "preference_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "preference_logs_selectedStrategy_idx" ON "preference_logs"("selectedStrategy");

-- CreateIndex
CREATE UNIQUE INDEX "preference_memories_userId_key" ON "preference_memories"("userId");

-- CreateIndex
CREATE INDEX "preference_memory_versions_memoryId_version_idx" ON "preference_memory_versions"("memoryId", "version");

-- CreateIndex
CREATE INDEX "prompt_versions_userId_version_idx" ON "prompt_versions"("userId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "response_explanations_messageId_key" ON "response_explanations"("messageId");

-- CreateIndex
CREATE INDEX "preference_suggestions_userId_status_idx" ON "preference_suggestions"("userId", "status");

-- CreateIndex
CREATE INDEX "preference_suggestions_userId_createdAt_idx" ON "preference_suggestions"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "search_cache_query_key" ON "search_cache"("query");

-- CreateIndex
CREATE INDEX "search_cache_query_idx" ON "search_cache"("query");

-- CreateIndex
CREATE INDEX "search_cache_expiresAt_idx" ON "search_cache"("expiresAt");
