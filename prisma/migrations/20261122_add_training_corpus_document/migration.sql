-- CreateTable
CREATE TABLE IF NOT EXISTS "TrainingCorpusDocument" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "themes" TEXT NOT NULL DEFAULT '[]',
    "provenance" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "citation" TEXT,
    "archiveEntryId" TEXT,
    "overlapsArchive" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingCorpusDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrainingCorpusDocument_genre_idx" ON "TrainingCorpusDocument"("genre");
