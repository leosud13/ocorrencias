-- CreateTable
CREATE TABLE "OccurrenceComment" (
    "id" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OccurrenceComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OccurrenceComment_occurrenceId_idx" ON "OccurrenceComment"("occurrenceId");

-- CreateIndex
CREATE INDEX "OccurrenceComment_authorId_idx" ON "OccurrenceComment"("authorId");

-- AddForeignKey
ALTER TABLE "OccurrenceComment" ADD CONSTRAINT "OccurrenceComment_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "Occurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccurrenceComment" ADD CONSTRAINT "OccurrenceComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OccurrenceComment" ENABLE ROW LEVEL SECURITY;
