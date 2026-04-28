-- Migration: sprint4_capex_licensing
-- Add CAPEX selections and PDV count to RoundConfig.
--
-- CAPEX costs (one-time, deducted from store capital):
--   Segurança:    R$ 50.000   Balança/Freezer: R$ 75.000
--   Redes:        R$ 80.000   Site:            R$ 65.000
--   Self Checkout:R$ 80.000   Melhoria Contínua: R$ 45.000
--
-- Licensing effects (auto-computed in DRE):
--   capexSite      → Site license +30%  (R$500 → R$650/mês)
--   capexSeguranca → Security license +20% (R$500 → R$600/mês)
--   capexSelfCheckout → +4 self-checkout units × R$80 = R$320/mês
--   capexBalanca   → waives R$400/mês equipment maintenance
--
-- SLA (from serviceOperators, used in CAPEX risk window):
--   0→6, 1→5, 2→4, 3→3, 4→2, 5→1 days

ALTER TABLE "RoundConfig" ADD COLUMN IF NOT EXISTS "numPdvs"           INTEGER          NOT NULL DEFAULT 6;
ALTER TABLE "RoundConfig" ADD COLUMN IF NOT EXISTS "capexSeguranca"    BOOLEAN          NOT NULL DEFAULT false;
ALTER TABLE "RoundConfig" ADD COLUMN IF NOT EXISTS "capexBalanca"      BOOLEAN          NOT NULL DEFAULT false;
ALTER TABLE "RoundConfig" ADD COLUMN IF NOT EXISTS "capexRedes"        BOOLEAN          NOT NULL DEFAULT false;
ALTER TABLE "RoundConfig" ADD COLUMN IF NOT EXISTS "capexSite"         BOOLEAN          NOT NULL DEFAULT false;
ALTER TABLE "RoundConfig" ADD COLUMN IF NOT EXISTS "capexSelfCheckout" BOOLEAN          NOT NULL DEFAULT false;
ALTER TABLE "RoundConfig" ADD COLUMN IF NOT EXISTS "capexMelhoria"     BOOLEAN          NOT NULL DEFAULT false;
