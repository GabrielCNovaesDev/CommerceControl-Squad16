// ─── Mocks (devem vir antes de require do app) ──────────────
jest.mock('../../repositories/storeRepository', () => ({
  findBySquadId: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../repositories/productRepository', () => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  hasReferences: jest.fn(),
}));

jest.mock('../../repositories/inventoryRepository', () => ({
  findByStoreId: jest.fn(),
  findByStoreAndProduct: jest.fn(),
  updateQuantity: jest.fn(),
  bulkCreate: jest.fn(),
  bulkUpdateQuantity: jest.fn(),
}));

jest.mock('../../repositories/roundConfigRepository', () => ({
  findByRoundAndStore: jest.fn(),
  create: jest.fn(),
  findAllByRound: jest.fn(),
}));

const request = require('supertest');
const app = require('../../server');
const { signToken } = require('../helpers/auth');
const storeRepository = require('../../repositories/storeRepository');
const productRepository = require('../../repositories/productRepository');
const inventoryRepository = require('../../repositories/inventoryRepository');
const roundConfigRepository = require('../../repositories/roundConfigRepository');

const PRODUCT_ID = '11111111-1111-4111-a111-111111111111';

const validPayload = {
  fixedExpenses: 100,
  variableExpenses: 50,
  items: [
    { productId: PRODUCT_ID, salePrice: 20, salesVolume: 5 },
  ],
};

describe('POST /simulation/preview', () => {
  beforeEach(() => {
    storeRepository.findBySquadId.mockResolvedValue({ id: 'store-1', squadId: 'sq-1' });
    productRepository.findById.mockResolvedValue({ id: PRODUCT_ID, purchasePrice: 10 });
    inventoryRepository.findByStoreId.mockResolvedValue([
      { productId: PRODUCT_ID, quantity: 100 },
    ]);
  });

  test('1. retorna 200 com DRE e preview: true', async () => {
    const token = signToken({ role: 'PLAYER', squadId: 'sq-1' });

    const res = await request(app)
      .post('/simulation/preview')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dre');
    expect(res.body).toHaveProperty('feedbacks');
    expect(res.body.preview).toBe(true);
    expect(res.body.dre.grossRevenue).toBe(100); // 20 * 5
    expect(res.body.dre.costs).toBe(50); // 10 * 5
  });

  test('2. não persiste nenhum dado no banco', async () => {
    const token = signToken({ role: 'PLAYER', squadId: 'sq-1' });

    await request(app)
      .post('/simulation/preview')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);

    // nenhum método de escrita foi chamado
    expect(roundConfigRepository.create).not.toHaveBeenCalled();
    expect(inventoryRepository.updateQuantity).not.toHaveBeenCalled();
    expect(inventoryRepository.bulkUpdateQuantity).not.toHaveBeenCalled();
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
        items: [{ productId: PRODUCT_ID, salePrice: 20, salesVolume: -1 }],
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
});
