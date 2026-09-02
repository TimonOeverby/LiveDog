-- CreateTable
CREATE TABLE "CompetitionRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competitionEntryId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionRating_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CompetitionRating_score_check" CHECK ("score" >= 1 AND "score" <= 5)
);

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionRating_userId_competitionEntryId_key" ON "CompetitionRating"("userId", "competitionEntryId");

-- CreateIndex
CREATE INDEX "CompetitionRating_competitionEntryId_idx" ON "CompetitionRating"("competitionEntryId");

-- CreateIndex
CREATE INDEX "CompetitionRating_userId_idx" ON "CompetitionRating"("userId");

-- AddForeignKey
ALTER TABLE "CompetitionRating" ADD CONSTRAINT "CompetitionRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionRating" ADD CONSTRAINT "CompetitionRating_competitionEntryId_fkey" FOREIGN KEY ("competitionEntryId") REFERENCES "CompetitionEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
