-- CreateTable
CREATE TABLE "ClassifierSnapshot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainedSamples" INTEGER NOT NULL,
    "vocabularySize" INTEGER NOT NULL,
    "modelJson" TEXT NOT NULL,
    "loocvJson" TEXT NOT NULL,

    CONSTRAINT "ClassifierSnapshot_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "LiteratureEntry" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);

