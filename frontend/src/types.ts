// ─── Shared domain types ──────────────────────────────────────────────────────

export type UserRole = 'GAME_MASTER' | 'PLAYER' | 'OBSERVER';
export type RoundStatus = 'OPEN' | 'PROCESSING' | 'CLOSED';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  squadId: string | null;
}

export interface Squad {
  id: string;
  name: string;
  users?: SquadUser[];
  stores?: SquadStore[];
}

export interface SquadUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cargo: string | null;
  leader: boolean;
}

export interface SquadStore {
  id: string;
  name: string;
  initialCapital: number;
}

export interface Store {
  id: string;
  name: string;
  initialCapital: number;
  currentCash: number;
  squadId: string;
}

export interface Product {
  id: string;
  name: string;
  purchasePrice: number;
  taxRate: number;
  breakageRate: number;
  agingRate: number;
  mixAvailable: number;
}

export interface InventoryItem {
  productId: string;
  quantity: number;
  product: Pick<Product, 'id' | 'name' | 'purchasePrice' | 'taxRate' | 'mixAvailable'>;
}

export interface Round {
  id: string;
  number: number;
  durationHours: number;
  endsAt: string;
  status: RoundStatus;
  demandFactor: number;
  aiReportGm?: string | null;
  submittedConfigsCount?: number;
  submittedStoreIds?: string[];
}

export interface AdminResultsResponse {
  results: FinancialResult[];
  aiReportGm: string | null;
}

export interface RoundConfigItem {
  id: string;
  productId: string;
  margin: number;
  salesVolume: number;
  product?: Pick<Product, 'id' | 'name' | 'purchasePrice'>;
}

export interface ItemBreakdown {
  productId: string;
  plannedVolume: number;
  effectiveVolume: number;
  unsold: number;
  stockLimited: boolean;
  salePrice: number;
  margin: number;
  itemRevenue: number;
  itemTax: number;
  itemCost: number;
  itemBreakage: number;
  itemAging: number;
  itemGrossMargin: number;
}

export interface DREResult {
  grossRevenue: number;
  taxes: number;
  netRevenue: number;
  costs: number;
  grossMargin: number;
  totalBreakage: number;
  totalAging: number;
  netMarginMass: number;
  otherExpenses: number;
  ebitda: number;
  ebitdaMargin: number;
  itemBreakdown: ItemBreakdown[];
  preview?: boolean;
}

export interface CashSummary {
  currentCash: number;
  initialCapital: number;
  stockCost: number;
  capexCost: number;
  payroll: number;
  licensing: number;
  maintenance: number;
  interestPenalty: number;
  balance: number;
  cashOk: boolean;
  csat: number;
  sla: number;
}

export interface FinancialResult {
  id: string;
  roundId: string;
  storeId: string;
  grossRevenue: number;
  taxes: number;
  netRevenue: number;
  costs: number;
  grossMargin: number;
  totalBreakage: number;
  totalAging: number;
  netMarginMass: number;
  otherExpenses: number;
  ebitda: number;
  ebitdaMargin: number;
  demandShare: number;
  aiReport?: string | null;
  store?: {
    id: string;
    name: string;
    squadId: string;
    squad?: { id: string; name: string };
  };
  roundConfig?: {
    roundConfigItems: RoundConfigItem[];
  };
}

export interface RankingEntry {
  position: number;
  squadId: string;
  squadName: string;
  storeName: string;
  ebitdaMargin: number;
  ebitda: number;
  grossRevenue: number;
  netRevenue: number;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cargo: string | null;
  leader: boolean;
  squadId: string | null;
  createdAt: string;
}
