-- AlterTable: admin-controlled pin (pinned entries are listed first in the Archive Explorer)
ALTER TABLE "LiteratureEntry" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false;
