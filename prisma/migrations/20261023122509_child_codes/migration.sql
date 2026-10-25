-- CreateTable
CREATE TABLE "child_code" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "secondsLimit" INTEGER NOT NULL,
    "secondsUsed" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "childCodeId" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "child_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "child_code_code_key" ON "child_code"("code");

-- CreateIndex
CREATE INDEX "child_code_parentId_idx" ON "child_code"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "child_session_token_key" ON "child_session"("token");

-- CreateIndex
CREATE INDEX "child_session_childCodeId_idx" ON "child_session"("childCodeId");

-- AddForeignKey
ALTER TABLE "child_code" ADD CONSTRAINT "child_code_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_session" ADD CONSTRAINT "child_session_childCodeId_fkey" FOREIGN KEY ("childCodeId") REFERENCES "child_code"("id") ON DELETE CASCADE ON UPDATE CASCADE;
