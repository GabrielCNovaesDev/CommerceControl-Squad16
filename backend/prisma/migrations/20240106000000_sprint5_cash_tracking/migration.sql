-- Migration: sprint5_cash_tracking
-- Add currentCash to Store. Initialized to initialCapital for existing rows.
-- Deducted at submitConfig time (stockCost + capexCost + interestPenalty).
-- This enables correct 2ª Configuração budget validation using residual cash.

ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "currentCash" DOUBLE PRECISION NOT NULL DEFAULT 700000;

-- Sync currentCash to initialCapital for all existing stores
UPDATE "Store" SET "currentCash" = "initialCapital";
