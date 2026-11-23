-- CreateTable
CREATE TABLE IF NOT EXISTS "BibleVerse" (
    "id" TEXT NOT NULL,
    "book" TEXT NOT NULL,
    "bookName" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "BibleVerse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BibleVerse_book_chapter_idx" ON "BibleVerse"("book", "chapter");
