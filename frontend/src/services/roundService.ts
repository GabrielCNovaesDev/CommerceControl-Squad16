import api from './api';
import { Round, FinancialResult, RankingEntry, DREResult, CashSummary, RoundEvent } from '../types';

interface RoundConfigItem {
  productId: string;
  margin: number;
  salesVolume: number;
}

interface SubmitConfigData {
  otherExpenses: number;
  cashierOperators: number;
  serviceOperators: number;
  quizScore: number;
  numPdvs: number;
  capexSeguranca: boolean;
  capexBalanca: boolean;
  capexRedes: boolean;
  capexSite: boolean;
  capexSelfCheckout: boolean;
  capexMelhoria: boolean;
  items: RoundConfigItem[];
}

interface PreviewResponse {
  dre: DREResult;
  feedbacks: string[];
  cashSummary: CashSummary;
  preview: boolean;
}

interface CreateRoundData {
  number: number;
  durationHours: number;
  demandFactor: number;
}

const roundService = {
  getRounds: (): Promise<Round[]> =>
    api.get('/rounds').then((r) => r.data?.content ?? r.data),

  getRound: (id: string): Promise<Round> =>
    api.get(`/rounds/${id}`).then((r) => r.data),

  createRound: (data: CreateRoundData): Promise<Round> =>
    api.post('/rounds', data).then((r) => r.data),

  closeRound: (id: string): Promise<{ message: string }> =>
    api.patch(`/rounds/${id}/close`).then((r) => r.data),

  extendRound: (id: string, additionalMinutes: number): Promise<{ message: string; endsAt: string }> =>
    api.patch(`/rounds/${id}/extend`, { additionalMinutes }).then((r) => r.data),

  deleteLastRound: (): Promise<{ message: string }> =>
    api.delete('/rounds/last').then((r) => r.data),

  resetGame: (): Promise<{ message: string }> =>
    api.post('/rounds/reset').then((r) => r.data),

  submitConfig: (roundId: string, data: SubmitConfigData): Promise<unknown> =>
    api.post(`/rounds/${roundId}/config`, data).then((r) => r.data),

  getMyConfig: (roundId: string): Promise<Record<string, unknown> | null> =>
    api.get(`/rounds/${roundId}/my-config`).then((r) => r.data).catch(() => null),

  previewSimulation: (data: SubmitConfigData): Promise<PreviewResponse> =>
    api.post('/simulation/preview', data).then((r) => r.data),

  getResults: (roundId: string): Promise<FinancialResult> =>
    api.get(`/rounds/${roundId}/results`).then((r) => r.data),

  getRanking: (roundId: string): Promise<RankingEntry[]> =>
    api.get('/simulation/ranking', { params: { roundId } }).then((r) => r.data),

  getRoundEvents: (roundId: string): Promise<RoundEvent[]> =>
    api.get(`/rounds/${roundId}/events`).then((r) => r.data),
};

export default roundService;
