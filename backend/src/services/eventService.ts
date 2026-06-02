import prisma from '../utils/prisma';
import roundConfigRepository from '../repositories/roundConfigRepository';

// ─── Event Catalog ───────────────────────────────────────────────────────────

export interface EventDef {
  key: string;
  mitigatedBy: string;
  penalty: number;
  description: string;
}

export const EVENT_CATALOG: EventDef[] = [
  { key: 'evento_seguranca',    mitigatedBy: 'capexSeguranca',    penalty: 15000, description: 'Ataque cibernético — perda de dados e vendas' },
  { key: 'evento_balanca',      mitigatedBy: 'capexBalanca',      penalty: 12000, description: 'Falha em equipamentos de refrigeração' },
  { key: 'evento_redes',        mitigatedBy: 'capexRedes',        penalty: 18000, description: 'Queda de infraestrutura de rede' },
  { key: 'evento_site',         mitigatedBy: 'capexSite',         penalty: 10000, description: 'Indisponibilidade da plataforma digital' },
  { key: 'evento_selfcheckout', mitigatedBy: 'capexSelfCheckout', penalty: 14000, description: 'Falha nos terminais de self-checkout' },
  { key: 'evento_melhoria',     mitigatedBy: 'capexMelhoria',     penalty: 8000,  description: 'Ineficiência operacional — retrabalho' },
];

// ─── Roll Events ─────────────────────────────────────────────────────────────

/**
 * Randomly selects 1-2 events for the round, checks each store's CAPEX history
 * to determine mitigation, persists RoundEvent records, and returns penalties per store.
 */
export async function rollEvents(roundId: string): Promise<Record<string, number>> {
  // Select 1-2 random events
  const shuffled = [...EVENT_CATALOG].sort(() => Math.random() - 0.5);
  const numEvents = Math.random() < 0.5 ? 1 : 2;
  const selectedEvents = shuffled.slice(0, numEvents);

  // Get all configs for this round to know which stores are participating
  const configs = await prisma.roundConfig.findMany({
    where: { roundId },
    select: { storeId: true },
  });

  if (configs.length === 0) return {};

  const storeIds = configs.map((c: { storeId: string }) => c.storeId);

  // For each store, get their full CAPEX history (all rounds)
  const capexByStore: Record<string, Set<string>> = {};
  for (const storeId of storeIds) {
    const capexHistory = await roundConfigRepository.findCapexByStore(storeId);
    const capexKeys = ['capexSeguranca', 'capexBalanca', 'capexRedes', 'capexSite', 'capexSelfCheckout', 'capexMelhoria'] as const;
    const usedCapex = new Set<string>(capexKeys.filter((k) => capexHistory.some((c: Record<string, boolean>) => c[k])));
    capexByStore[storeId] = usedCapex;
  }

  // Create RoundEvent records and compute penalties
  const penalties: Record<string, number> = {};

  for (const event of selectedEvents) {
    for (const storeId of storeIds) {
      const mitigated = capexByStore[storeId]?.has(event.mitigatedBy) ?? false;
      const penaltyValue = mitigated ? 0 : event.penalty;

      await prisma.roundEvent.create({
        data: {
          roundId,
          storeId,
          eventKey: event.key,
          description: event.description,
          penalty: penaltyValue,
          mitigated,
        },
      });

      penalties[storeId] = (penalties[storeId] ?? 0) + penaltyValue;
    }
  }

  console.info(JSON.stringify({
    level: 'info',
    service: 'eventService',
    message: 'Eventos aleatórios gerados',
    roundId,
    events: selectedEvents.map((e) => e.key),
    penalties,
    timestamp: new Date().toISOString(),
  }));

  return penalties;
}
