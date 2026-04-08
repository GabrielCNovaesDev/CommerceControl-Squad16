// ─── Mocks (devem vir antes do require do app) ──────────────
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

jest.mock('../../repositories/roundRepository', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findActive: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
}));

jest.mock('../../repositories/roundConfigRepository', () => ({
  findByRoundAndStore: jest.fn(),
  create: jest.fn(),
  findAllByRound: jest.fn(),
}));

jest.mock('../../services/simulationService', () => ({
  processRound: jest.fn(),
}));

const request = require('supertest');
const app = require('../../server');
const { signToken } = require('../helpers/auth');
const storeRepository = require('../../repositories/storeRepository');
const productRepository = require('../../repositories/productRepository');
const roundRepository = require('../../repositories/roundRepository');
const roundConfigRepository = require('../../repositories/roundConfigRepository');
const simulationService = require('../../services/simulationService');

const ROUND_ID = 'round-1';
const STORE_ID = 'store-1';
const PRODUCT_ID = '11111111-1111-4111-a111-111111111111';

const validConfigPayload = {
  fixedExpenses: 100,
  variableExpenses: 50,
  items: [{ productId: PRODUCT_ID, salePrice: 20, salesVolume: 5 }],
};

// ════════════════════════════════════════════════════════════
describe('POST /rounds/:id/config', () => {
  beforeEach(() => {
    storeRepository.findBySquadId.mockResolvedValue({ id: STORE_ID, squadId: 'sq-1' });
    roundRepository.findById.mockResolvedValue({ id: ROUND_ID, status: 'OPEN' });
    roundConfigRepository.findByRoundAndStore.mockResolvedValue(null);
    productRepository.findById.mockResolvedValue({ id: PRODUCT_ID, purchasePrice: 10 });
    roundConfigRepository.create.mockResolvedValue({
      id: 'rc-1',
      fixedExpenses: 100,
      variableExpenses: 50,
      submittedAt: new Date(),
      roundConfigItems: [],
    });
  });

  test('1. retorna 201 e persiste RoundConfig', async () => {
    const token = signToken({ role: 'PLAYER', squadId: 'sq-1' });

    const res = await request(app)
      .post(`/rounds/${ROUND_ID}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send(validConfigPayload);

    expect(res.status).toBe(201);
    expect(roundConfigRepository.create).toHaveBeenCalledTimes(1);
    expect(roundConfigRepository.create).toHaveBeenCalledWith(
      ROUND_ID,
      STORE_ID,
      100,
      50,
      expect.arrayContaining([
        expect.objectContaining({ productId: PRODUCT_ID, salePrice: 20, salesVolume: 5 }),
      ])
    );
    expect(res.body).toHaveProperty('roundConfigId');
  });

  test('2. retorna 409 se já existe RoundConfig para (roundId, storeId)', async () => {
    roundConfigRepository.findByRoundAndStore.mockResolvedValue({ id: 'existing-config' });
    const token = signToken({ role: 'PLAYER', squadId: 'sq-1' });

    const res = await request(app)
      .post(`/rounds/${ROUND_ID}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send(validConfigPayload);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/já submeteu/i);
    expect(roundConfigRepository.create).not.toHaveBeenCalled();
  });

  test('3. retorna 400 quando salesVolume é negativo', async () => {
    const token = signToken({ role: 'PLAYER', squadId: 'sq-1' });

    const res = await request(app)
      .post(`/rounds/${ROUND_ID}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...validConfigPayload,
        items: [{ productId: PRODUCT_ID, salePrice: 20, salesVolume: -3 }],
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(roundConfigRepository.create).not.toHaveBeenCalled();
  });

  test('4. retorna 403 se role for OBSERVER', async () => {
    const token = signToken({ role: 'OBSERVER', squadId: 'sq-1' });

    const res = await request(app)
      .post(`/rounds/${ROUND_ID}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send(validConfigPayload);

    expect(res.status).toBe(403);
  });

  test('5. retorna 403 se role for GAME_MASTER (não pode submeter como loja)', async () => {
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
    roundRepository.findById.mockResolvedValue({ id: ROUND_ID, status: 'OPEN' });
    roundRepository.updateStatus.mockResolvedValue({});
    simulationService.processRound.mockResolvedValue();
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
    roundRepository.findById.mockResolvedValue({ id: ROUND_ID, status: 'CLOSED' });
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
