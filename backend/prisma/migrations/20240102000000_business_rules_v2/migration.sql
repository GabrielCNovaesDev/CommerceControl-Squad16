-- ============================================================
-- Migration: business_rules_v2
-- Aligns schema with client business rules:
--   - Product: remove salePrice, add taxRate/breakageRate/agingRate/mixAvailable
--   - Inventory: remove agingCategory
--   - RoundConfig: replace fixedExpenses+variableExpenses with otherExpenses
--   - RoundConfigItem: rename salePrice -> margin
--   - FinancialResult: replace old P&L fields with full DRE structure
-- ============================================================

-- Product: remove salePrice, add DRE rate columns
ALTER TABLE "Product" DROP COLUMN IF EXISTS "salePrice";
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "taxRate"      DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "breakageRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "agingRate"    DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "mixAvailable" INTEGER NOT NULL DEFAULT 0;

-- Inventory: remove agingCategory
ALTER TABLE "Inventory" DROP COLUMN IF EXISTS "agingCategory";

-- RoundConfig: replace two expense columns with single otherExpenses
ALTER TABLE "RoundConfig" DROP COLUMN IF EXISTS "fixedExpenses";
ALTER TABLE "RoundConfig" DROP COLUMN IF EXISTS "variableExpenses";
ALTER TABLE "RoundConfig" ADD COLUMN IF NOT EXISTS "otherExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- RoundConfigItem: rename salePrice -> margin
ALTER TABLE "RoundConfigItem" DROP COLUMN IF EXISTS "salePrice";
ALTER TABLE "RoundConfigItem" ADD COLUMN IF NOT EXISTS "margin" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- FinancialResult: drop old columns, add full DRE columns
ALTER TABLE "FinancialResult" DROP COLUMN IF EXISTS "expenses";
ALTER TABLE "FinancialResult" DROP COLUMN IF EXISTS "grossProfit";
ALTER TABLE "FinancialResult" DROP COLUMN IF EXISTS "netProfit";
ALTER TABLE "FinancialResult" DROP COLUMN IF EXISTS "netMargin";

ALTER TABLE "FinancialResult" ADD COLUMN IF NOT EXISTS "taxes"         DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "FinancialResult" ADD COLUMN IF NOT EXISTS "netRevenue"    DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "FinancialResult" ADD COLUMN IF NOT EXISTS "grossMargin"   DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "FinancialResult" ADD COLUMN IF NOT EXISTS "totalBreakage" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "FinancialResult" ADD COLUMN IF NOT EXISTS "totalAging"    DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "FinancialResult" ADD COLUMN IF NOT EXISTS "netMarginMass" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "FinancialResult" ADD COLUMN IF NOT EXISTS "otherExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "FinancialResult" ADD COLUMN IF NOT EXISTS "ebitda"        DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "FinancialResult" ADD COLUMN IF NOT EXISTS "ebitdaMargin"  DOUBLE PRECISION NOT NULL DEFAULT 0;
