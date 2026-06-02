-- AlterTable: add competitive scores to FinancialResult
ALTER TABLE "FinancialResult" ADD COLUMN "priceScore" INTEGER;
ALTER TABLE "FinancialResult" ADD COLUMN "availScore" INTEGER;
ALTER TABLE "FinancialResult" ADD COLUMN "csatScore" INTEGER;
ALTER TABLE "FinancialResult" ADD COLUMN "totalScore" INTEGER;

-- CreateTable: GameSettings (singleton for admin-configurable license values)
CREATE TABLE "GameSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "licenseSoPerUser" DECIMAL(10,2) NOT NULL DEFAULT 120,
    "licenseSoUsers" INTEGER NOT NULL DEFAULT 5,
    "licensePdvPerUnit" DECIMAL(10,2) NOT NULL DEFAULT 80,
    "licenseScoPerUnit" DECIMAL(10,2) NOT NULL DEFAULT 80,
    "licenseScoUnits" INTEGER NOT NULL DEFAULT 4,
    "licenseSiteBase" DECIMAL(10,2) NOT NULL DEFAULT 500,
    "licenseSiteCapex" DECIMAL(10,2) NOT NULL DEFAULT 650,
    "licenseSecurityBase" DECIMAL(10,2) NOT NULL DEFAULT 500,
    "licenseSecurityCapex" DECIMAL(10,2) NOT NULL DEFAULT 600,
    "maintenanceFee" DECIMAL(10,2) NOT NULL DEFAULT 400,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSettings_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row with defaults
INSERT INTO "GameSettings" ("id", "updatedAt") VALUES ('singleton', NOW());
