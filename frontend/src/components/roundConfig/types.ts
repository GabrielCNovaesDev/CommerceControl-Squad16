import { z } from 'zod';

export const roundConfigSchema = z.object({
  otherExpenses:     z.coerce.number({ error: 'Valor inválido' }).min(0),
  cashierOperators:  z.coerce.number({ error: 'Valor inválido' }).int().min(0).max(10),
  serviceOperators:  z.coerce.number({ error: 'Valor inválido' }).int().min(0),
  quizScore:         z.coerce.number({ error: 'Valor inválido' }).min(0).max(100),
  numPdvs:           z.coerce.number({ error: 'Valor inválido' }).int().min(0),
  capexSeguranca:    z.boolean().default(false),
  capexBalanca:      z.boolean().default(false),
  capexRedes:        z.boolean().default(false),
  capexSite:         z.boolean().default(false),
  capexSelfCheckout: z.boolean().default(false),
  capexMelhoria:     z.boolean().default(false),
  items: z.array(
    z.object({
      productId:   z.string(),
      margin:      z.coerce.number({ error: 'Valor inválido' }).min(0),
      salesVolume: z.coerce.number({ error: 'Valor inválido' }).int().min(0),
    })
  ).min(1),
});

export type FormData = z.infer<typeof roundConfigSchema>;

export type CapexKey = keyof Pick<FormData,
  'capexSeguranca' | 'capexBalanca' | 'capexRedes' | 'capexSite' | 'capexSelfCheckout' | 'capexMelhoria'
>;

export interface CapexDef {
  key: CapexKey;
  label: string;
  cost: number;
  desc: string;
  benefits: string;
  strategicImpact: string;
  penaltyAvoided: string;
  operationalRisk: string;
}
