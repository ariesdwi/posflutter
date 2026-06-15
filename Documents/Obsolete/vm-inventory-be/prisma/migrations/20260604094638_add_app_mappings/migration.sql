-- CreateTable
CREATE TABLE "app_mappings" (
    "id" SERIAL NOT NULL,
    "department" TEXT,
    "team" TEXT,
    "aplikasi" TEXT,
    "applicationOwner" TEXT,
    "platformOwner" TEXT,
    "kritikalitas" TEXT,
    "squadLead" TEXT,
    "keterangan" TEXT,
    "support24h" TEXT,
    "target24h" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_mappings_pkey" PRIMARY KEY ("id")
);
