-- CreateTable
CREATE TABLE IF NOT EXISTS "LexiconEntry" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "manobo" TEXT NOT NULL,
    "english" TEXT,
    "bisaya" TEXT,
    "tagalog" TEXT,
    "root" TEXT,
    "partOfSpeech" TEXT,
    "definition" TEXT,
    "notes" TEXT,
    "reference" TEXT,
    "entryTitle" TEXT,
    "group" TEXT,
    "source" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LexiconEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LexiconEntry_kind_idx" ON "LexiconEntry"("kind");
CREATE INDEX IF NOT EXISTS "LexiconEntry_manobo_idx" ON "LexiconEntry"("manobo");
