-- Migration: demand_distribution
-- Add demandFactor to Round (GM-configurable market demand percentage per round)
-- Add demandShare to FinancialResult (store's captured share, for reporting)

ALTER TABLE "Round" ADD COLUMN IF NOT EXISTS "demandFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.5;

ALTER TABLE "FinancialResult" ADD COLUMN IF NOT EXISTS "demandShare" DOUBLE PRECISION NOT NULL DEFAULT 0;
