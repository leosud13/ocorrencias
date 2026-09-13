-- CreateTable
CREATE TABLE "OccurrenceAction" (
    "id" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lastEditedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OccurrenceAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OccurrenceAction_occurrenceId_idx" ON "OccurrenceAction"("occurrenceId");

-- CreateIndex
CREATE INDEX "OccurrenceAction_authorId_idx" ON "OccurrenceAction"("authorId");

-- CreateIndex
CREATE INDEX "OccurrenceAction_lastEditedById_idx" ON "OccurrenceAction"("lastEditedById");

-- CreateIndex
CREATE INDEX "Occurrence_studentId_idx" ON "Occurrence"("studentId");

-- AddForeignKey
ALTER TABLE "OccurrenceAction" ADD CONSTRAINT "OccurrenceAction_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "Occurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccurrenceAction" ADD CONSTRAINT "OccurrenceAction_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccurrenceAction" ADD CONSTRAINT "OccurrenceAction_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: existing actionTaken becomes the first history entry
INSERT INTO "OccurrenceAction" ("id", "occurrenceId", "authorId", "content", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  o."id",
  COALESCE(
    (SELECT u."id" FROM "User" u WHERE u."role" = 'GESTAO' ORDER BY u."createdAt" ASC LIMIT 1),
    o."authorId"
  ),
  TRIM(o."actionTaken"),
  COALESCE(o."updatedAt", o."createdAt", NOW()),
  COALESCE(o."updatedAt", o."createdAt", NOW())
FROM "Occurrence" o
WHERE o."actionTaken" IS NOT NULL AND TRIM(o."actionTaken") <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "OccurrenceAction" a WHERE a."occurrenceId" = o."id"
  );

ALTER TABLE "OccurrenceAction" ENABLE ROW LEVEL SECURITY;
