// ─── Mocks (devem vir antes do import do app) ──────────────
jest.mock('../../repositories/storeRepository', () => ({
  __esModule: true,
  default: {
    findBySquadId: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../repositories/productRepository', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    hasReferences: jest.fn(),
  },
}));

jest.mock('../../repositories/roundRepository', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findActive: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  },
}));

jest.mock('../../repositories/roundConfigRepository', () => ({
  __esModule: true,
  default: {
    findByRoundAndStore: jest.fn(),
    create: jest.fn(),
    findAllByRound: jest.fn(),
  },
}));

jest.mock('../../services/simulationService', () => ({
  processRound: jest.fn(),
  calcPayroll: jest.fn().mockReturnValue(0),
  calcInterest: jest.fn().mockReturnValue(0),
  calcCsat: jest.fn().mockReturnValue(1),
  calcSla: jest.fn().mockReturnValue(1),
  calcLicensing: jest.fn().mockReturnValue(0),
  calcMaintenance: jest.fn().mockReturnValue(0),
  calcCapexCost: jest.fn().mockReturnValue(0),
  CAPEX_COSTS: {},
}));

jest.mock('../../utils/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        roundConfig: { create: jest.fn().mockResolvedValue({ id: 'rc-1', otherExpenses: 0, cashierOperators: 10, serviceOperators: 5, quizScore: 1, numPdvs: 6, capexSeguranca: false, capexBalanca: false, capexRedes: false, capexSite: false, capexSelfCheckout: false, capexMelhoria: false, submittedAt: new Date(), roundConfigItems: [] }) },
        inventory: { update: jest.fn().mockResolvedValue({}) },
        store: { update: jest.fn().mockResolvedValue({}) },
        round: { findFirst: jest.fn(), delete: jest.fn() },
        financialResult: { deleteMany: jest.fn() },
        roundConfigItem: { deleteMany: jest.fn() },
      };
      return fn(tx);
    }),
    round: { findFirst: jest.fn() },
    financialResult: { deleteMany: jest.fn(), findMany: jest.fn() },
    roundConfigItem: { deleteMany: jest.fn() },
    roundConfig: { findMany: jest.fn(), deleteMany: jest.fn() },
    inventory: { updateMany: jest.fn() },
    store: { findMany: jest.fn() },
  },
}));

import request from 'supertest';
import app from '../../server';
import { signToken } from '../helpers/auth';
import storeRepositoryModule from '../../repositories/storeRepository';
import roundRepositoryModule from '../../repositories/roundRepository';
import roundConfigRepositoryModule from '../../repositories/roundConfigRepository';
import * as simulationServiceModule from '../../services/simulationService';

const storeRepository = storeRepositoryModule as jest.Mocked<typeof storeRepositoryModule>;
const roundRepository = roundRepositoryModule as jest.Mocked<typeof roundRepositoryModule>;
const roundConfigRepository = roundConfigRepositoryModule as jest.Mocked<typeof roundConfigRepositoryModule>;
const simulationService = simulationServiceModule as jest.Mocked<typeof simulationServiceModule>;

const ROUND_ID = 'round-1';
const STORE_ID = 'store-1';

const validConfigPayload = {
  otherExpenses: 100,
  cashierOperators: 10,
  serviceOperators: 5,
  quizScore: 1.0,
  numPdvs: 6,
  capexSeguranca: false,
  capexBalanca: false,
  capexRedes: false,
  capexSite: false,
  capexSelfCheckout: false,
  capexMelhoria: false,
  items: [{ productId: '11111111-1111-4111-a111-111111111111', margin: 0.3, salesVolume: 5 }],
};

// ════════════════════════════════════════════════════════════
describe('POST /rounds/:id/config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore $transaction after clearAllMocks
    const prisma = jest.requireMock('../../utils/prisma').default;
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        roundConfig: { create: jest.fn().mockResolvedValue({ id: 'rc-1', otherExpenses: 0, cashierOperators: 10, serviceOperators: 5, quizScore: 1, numPdvs: 6, capexSeguranca: false, capexBalanca: false, capexRedes: false, capexSite: false, capexSelfCheckout: false, capexMelhoria: false, submittedAt: new Date(), roundConfigItems: [] }) },
        inventory: { update: jest.fn().mockResolvedValue({}) },
        store: { update: jest.fn().mockResolvedValue({}) },
        round: { findFirst: jest.fn(), delete: jest.fn() },
        financialResult: { deleteMany: jest.fn() },
        roundConfigItem: { deleteMany: jest.fn() },
      };
      return fn(tx);
    });
    (storeRepository.findBySquadId as jest.Mock).mockResolvedValue({ id: STORE_ID, squadId: 'sq-1', currentCash: 700000, initialCapital: 700000 });
    (roundRepository.findById as jest.Mock).mockResolvedValue({ id: ROUND_ID, status: 'OPEN', _count: { roundConfigs: 0 }, roundConfigs: [] });
    (roundConfigRepository.findByRoundAndStore as jest.Mock).mockResolvedValue(null);
    const productId = '11111111-1111-4111-a111-111111111111';
    const productRepository = jest.requireMock('../../repositories/productRepository').default;
    (productRepository.findById as jest.Mock).mockResolvedValue({ id: productId, purchasePrice: 10, taxRate: 0.1, breakageRate: 0.01, agingRate: 0.01, mixAvailable: 100 });
  });

  test('1. retorna 201 ao submeter configuração válida', async () => {
    const token = signToken({ role: 'PLAYER', squadId: 'sq-1' });

    const res = await request(app)
      .post(`/rounds/${ROUND_ID}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send(validConfigPayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('roundConfigId');
  });

  test('2. retorna 409 se já existe RoundConfig para (roundId, storeId)', async () => {
    (roundConfigRepository.findByRoundAndStore as jest.Mock).mockResolvedValue({ id: 'existing-config' });
    const token = signToken({ role: 'PLAYER', squadId: 'sq-1' });

    const res = await request(app)
      .post(`/rounds/${ROUND_ID}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send(validConfigPayload);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/já submeteu/i);
  });

  test('3. retorna 400 quando salesVolume é negativo', async () => {
    const token = signToken({ role: 'PLAYER', squadId: 'sq-1' });

    const res = await request(app)
      .post(`/rounds/${ROUND_ID}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...validConfigPayload,
        items: [{ productId: '11111111-1111-4111-a111-111111111111', margin: 0.3, salesVolume: -3 }],
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  test('4. retorna 403 se role for OBSERVER', async () => {
    const token = signToken({ role: 'OBSERVER', squadId: 'sq-1' });

    const res = await request(app)
      .post(`/rounds/${ROUND_ID}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send(validConfigPayload);

    expect(res.status).toBe(403);
  });

  test('5. retorna 403 se role for GAME_MASTER', async () => {
    const token = signToken({ role: 'GAME_MASTER', squadId: 'sq-1' });

    const res = await request(app)
      .post(`/rounds/${ROUND_ID}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send(validConfigPayload);

    expect(res.status).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════
describe('PATCH /rounds/:id/close', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (roundRepository.findById as jest.Mock).mockResolvedValue({ id: ROUND_ID, status: 'OPEN', _count: { roundConfigs: 0 }, roundConfigs: [] });
    (roundRepository.updateStatus as jest.Mock).mockResolvedValue({});
    (simulationService.processRound as jest.Mock).mockResolvedValue(undefined);
  });

  test('1. retorna 403 se role != GAME_MASTER', async () => {
    const token = signToken({ role: 'PLAYER', squadId: 'sq-1' });

    const res = await request(app)
      .patch(`/rounds/${ROUND_ID}/close`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(simulationService.processRound).not.toHaveBeenCalled();
  });

  test('2. retorna 409 se status != OPEN', async () => {
    (roundRepository.findById as jest.Mock).mockResolvedValue({ id: ROUND_ID, status: 'CLOSED', _count: { roundConfigs: 0 }, roundConfigs: [] });
    const token = signToken({ role: 'GAME_MASTER' });

    const res = await request(app)
      .patch(`/rounds/${ROUND_ID}/close`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(simulationService.processRound).not.toHaveBeenCalled();
  });

  test('3. chama simulationService.processRound com o roundId', async () => {
    const token = signToken({ role: 'GAME_MASTER' });

    await request(app)
      .patch(`/rounds/${ROUND_ID}/close`)
      .set('Authorization', `Bearer ${token}`);

    expect(simulationService.processRound).toHaveBeenCalledWith(ROUND_ID);
  });

  test('4. atualiza status para PROCESSING e depois CLOSED', async () => {
    const token = signToken({ role: 'GAME_MASTER' });

    await request(app)
      .patch(`/rounds/${ROUND_ID}/close`)
      .set('Authorization', `Bearer ${token}`);

    expect(roundRepository.updateStatus).toHaveBeenNthCalledWith(1, ROUND_ID, 'PROCESSING');
    expect(roundRepository.updateStatus).toHaveBeenNthCalledWith(2, ROUND_ID, 'CLOSED');
  });

  test('5. retorna 200 com mensagem de sucesso', async () => {
    const token = signToken({ role: 'GAME_MASTER' });

    const res = await request(app)
      .patch(`/rounds/${ROUND_ID}/close`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/encerrada/i);
  });
});
