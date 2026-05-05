-- Migration: float_to_decimal_uuid_v7
-- Converte todos os campos monetários e de taxa de DOUBLE PRECISION para DECIMAL
-- com precisão adequada. IDs permanecem TEXT — uuid(7) é gerado em runtime pelo
-- Prisma Client e não requer alteração de tipo de coluna no banco.

-- ─── Store ────────────────────────────────────────────────────────────────────
ALTER TABLE "Store"
  ALTER COLUMN "initialCapital" TYPE DECIMAL(18,2) USING "initialCapital"::DECIMAL(18,2),
  ALTER COLUMN "currentCash"    TYPE DECIMAL(18,2) USING "currentCash"::DECIMAL(18,2);

-- ─── Product ──────────────────────────────────────────────────────────────────
ALTER TABLE "Product"
  ALTER COLUMN "purchasePrice" TYPE DECIMAL(18,2) USING "purchasePrice"::DECIMAL(18,2),
  ALTER COLUMN "taxRate"       TYPE DECIMAL(8,6)  USING "taxRate"::DECIMAL(8,6),
  ALTER COLUMN "breakageRate"  TYPE DECIMAL(8,6)  USING "breakageRate"::DECIMAL(8,6),
  ALTER COLUMN "agingRate"     TYPE DECIMAL(8,6)  USING "agingRate"::DECIMAL(8,6);

-- ─── Round ────────────────────────────────────────────────────────────────────
ALTER TABLE "Round"
  ALTER COLUMN "demandFactor" TYPE DECIMAL(5,4) USING "demandFactor"::DECIMAL(5,4);

-- ─── RoundConfig ──────────────────────────────────────────────────────────────
ALTER TABLE "RoundConfig"
  ALTER COLUMN "otherExpenses" TYPE DECIMAL(18,2) USING "otherExpenses"::DECIMAL(18,2),
  ALTER COLUMN "quizScore"     TYPE DECIMAL(5,4)  USING "quizScore"::DECIMAL(5,4);

-- ─── RoundConfigItem ──────────────────────────────────────────────────────────
ALTER TABLE "RoundConfigItem"
  ALTER COLUMN "margin" TYPE DECIMAL(8,6) USING "margin"::DECIMAL(8,6);

-- ─── FinancialResult ──────────────────────────────────────────────────────────
ALTER TABLE "FinancialResult"
  ALTER COLUMN "grossRevenue"  TYPE DECIMAL(18,2) USING "grossRevenue"::DECIMAL(18,2),
  ALTER COLUMN "taxes"         TYPE DECIMAL(18,2) USING "taxes"::DECIMAL(18,2),
  ALTER COLUMN "netRevenue"    TYPE DECIMAL(18,2) USING "netRevenue"::DECIMAL(18,2),
  ALTER COLUMN "costs"         TYPE DECIMAL(18,2) USING "costs"::DECIMAL(18,2),
  ALTER COLUMN "grossMargin"   TYPE DECIMAL(18,2) USING "grossMargin"::DECIMAL(18,2),
  ALTER COLUMN "totalBreakage" TYPE DECIMAL(18,2) USING "totalBreakage"::DECIMAL(18,2),
  ALTER COLUMN "totalAging"    TYPE DECIMAL(18,2) USING "totalAging"::DECIMAL(18,2),
  ALTER COLUMN "netMarginMass" TYPE DECIMAL(18,2) USING "netMarginMass"::DECIMAL(18,2),
  ALTER COLUMN "otherExpenses" TYPE DECIMAL(18,2) USING "otherExpenses"::DECIMAL(18,2),
  ALTER COLUMN "ebitda"        TYPE DECIMAL(18,2) USING "ebitda"::DECIMAL(18,2),
  ALTER COLUMN "ebitdaMargin"  TYPE DECIMAL(8,6)  USING "ebitdaMargin"::DECIMAL(8,6),
  ALTER COLUMN "demandShare"   TYPE DECIMAL(8,6)  USING "demandShare"::DECIMAL(8,6);
