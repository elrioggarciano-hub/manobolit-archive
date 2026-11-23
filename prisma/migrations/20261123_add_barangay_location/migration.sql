-- CreateTable
CREATE TABLE IF NOT EXISTS "BarangayLocation" (
    "id" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "aliases" TEXT NOT NULL DEFAULT '[]',
    "municipality" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarangayLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BarangayLocation_barangay_municipality_key" ON "BarangayLocation"("barangay", "municipality");
