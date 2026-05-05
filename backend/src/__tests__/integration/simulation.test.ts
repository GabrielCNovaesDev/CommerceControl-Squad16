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

jest.mock('../../repositories/inventoryRepository', () => ({
  __esModule: true,
  default: {
    findByStoreId: jest.fn(),
    findByStoreAndProduct: jest.fn(),
    updateQuantity: jest.fn(),
    bulkCreate: jest.fn(),
    bulkUpdateQuantity: jest.fn(),
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

jest.mock('../../utils/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
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
import productRepositoryModule from '../../repositories/productRepository';
import inventoryRepositoryModule from '../../repositories/inventoryRepository';
import roundConfigRepositoryModule from '../../repositories/roundConfigRepository';

const storeRepository = storeRepositoryModule as jest.Mocked<typeof storeRepositoryModule>;
const productRepository = productRepositoryModule as jest.Mocked<typeof productRepositoryModule>;
const inventoryRepository = inventoryRepositoryModule as jest.Mocked<typeof inventoryRepositoryModule>;
const roundConfigRepository = roundConfigRepositoryModule as jest.Mocked<typeof roundConfigRepositoryModule>;

const PRODUCT_ID = '11111111-1111-4111-a111-111111111111';

const validPayload = {
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
  items: [
    { productId: PRODUCT_ID, margin: 0.3, salesVolume: 5 },
  ],
};

describe('POST /simulation/preview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storeRepository.findBySquadId as jest.Mock).mockResolvedValue({
      id: 'store-1', squadId: 'sq-1', currentCash: 700000, initialCapital: 700000,
    });
    (productRepository.findById as jest.Mock).mockResolvedValue({
      id: PRODUCT_ID, purchasePrice: 10, taxRate: 0.1, breakageRate: 0.01, agingRate: 0.01, mixAvailable: 100,
    });
    (inventoryRepository.findByStoreId as jest.Mock).mockResolvedValue([
      { productId: PRODUCT_ID, quantity: 100 },
    ]);
  });

  test('1. retorna 200 com dre, feedbacks e preview: true', async () => {
    const token = signToken({ role: 'PLAYER', squadId: 'sq-1' });

    const res = await request(app)
      .post('/simulation/preview')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dre');
    expect(res.body).toHaveProperty('feedbacks');
    expect(res.body).toHaveProperty('cashSummary');
    expect(res.body.preview).toBe(true);
  });

  test('2. não persiste nenhum dado no banco', async () => {
    const token = signToken({ role: 'PLAYER', squadId: 'sq-1' });

    await request(app)
      .post('/simulation/preview')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(roundConfigRepository.create).not.toHaveBeenCalled();
    expect(storeRepository.create).not.toHaveBeenCalled();
    expect(productRepository.create).not.toHaveBeenCalled();
  });

  test('3. retorna 400 quando payload é inválido (salesVolume negativo)', async () => {
    const token = signToken({ role: 'PLAYER', squadId: 'sq-1' });

    const res = await request(app)
      .post('/simulation/preview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...validPayload,
        items: [{ productId: PRODUCT_ID, margin: 0.3, salesVolume: -1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  test('4. retorna 403 se role for OBSERVER', async () => {
    const token = signToken({ role: 'OBSERVER', squadId: 'sq-1' });

    const res = await request(app)
      .post('/simulation/preview')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Acesso negado');
  });

  test('5. retorna 400 se squad não tem loja', async () => {
    (storeRepository.findBySquadId as jest.Mock).mockResolvedValue(null);
    const token = signToken({ role: 'PLAYER', squadId: 'sq-1' });

    const res = await request(app)
      .post('/simulation/preview')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/loja/i);
  });
});
