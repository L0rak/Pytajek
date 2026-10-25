-- CreateTable
CREATE TABLE "child" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

-- Przeniesienie istniejących kodów: dla każdego (rodzic, imię) tworzymy dziecko
-- i przypinamy do niego kody. Imię z kodu ("KAROL") zapisujemy jako "Karol".
INSERT INTO "child" ("id", "name", "parentId")
SELECT 'c' || substr(md5(random()::text || clock_timestamp()::text || src."parentId" || src."childName"), 1, 24),
       initcap(lower(src."childName")),
       src."parentId"
FROM (SELECT DISTINCT "parentId", "childName" FROM "child_code") AS src;

ALTER TABLE "child_code" ADD COLUMN "childId" TEXT;

UPDATE "child_code" cc
SET "childId" = c."id"
FROM "child" c
WHERE c."parentId" = cc."parentId" AND c."name" = initcap(lower(cc."childName"));

ALTER TABLE "child_code" ALTER COLUMN "childId" SET NOT NULL;
ALTER TABLE "child_code" DROP COLUMN "childName";

-- CreateIndex
CREATE UNIQUE INDEX "child_parentId_name_key" ON "child"("parentId", "name");

-- CreateIndex
CREATE INDEX "chat_message_childId_createdAt_idx" ON "chat_message"("childId", "createdAt");

-- CreateIndex
CREATE INDEX "child_code_childId_idx" ON "child_code"("childId");

-- AddForeignKey
ALTER TABLE "child" ADD CONSTRAINT "child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_code" ADD CONSTRAINT "child_code_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
