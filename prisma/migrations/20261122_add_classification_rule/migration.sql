-- CreateTable
CREATE TABLE IF NOT EXISTS "ClassificationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "phrases" TEXT NOT NULL DEFAULT '[]',
    "contextClues" TEXT NOT NULL DEFAULT '[]',
    "baseConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "source" TEXT NOT NULL DEFAULT 'EXPERT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClassificationRule_type_idx" ON "ClassificationRule"("type");
