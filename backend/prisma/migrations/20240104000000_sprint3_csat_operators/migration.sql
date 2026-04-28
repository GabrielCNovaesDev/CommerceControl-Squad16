-- Migration: sprint3_csat_operators
-- Add operator configuration and quiz score to RoundConfig for CSAT calculation.
-- CSAT = min(1, cashierOperators / 10) × quizScore
-- Payroll is computed automatically: cashierOperators × R$1,000 + serviceOperators × R$1,200

ALTER TABLE "RoundConfig" ADD COLUMN IF NOT EXISTS "cashierOperators" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "RoundConfig" ADD COLUMN IF NOT EXISTS "serviceOperators" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "RoundConfig" ADD COLUMN IF NOT EXISTS "quizScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
