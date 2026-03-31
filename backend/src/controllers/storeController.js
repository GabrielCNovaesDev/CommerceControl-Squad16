const { z } = require('zod');
const storeRepository = require('../repositories/storeRepository');
const productRepository = require('../repositories/productRepository');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const createSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  initialCapital: z.number().positive('Capital inicial deve ser positivo'),
});

async function getMyStore(req, res) {
  const { squadId } = req.user;
  if (!squadId) {
    return res.status(400).json({ message: 'Usuário não pertence a um squad' });
  }

  const store = await storeRepository.findBySquadId(squadId);
  if (!store) {
    return res.status(404).json({ message: 'Loja não encontrada para este squad' });
  }

  return res.status(200).json(store);
}

async function createStore(req, res) {
  const { squadId } = req.user;
  if (!squadId) {
    return res.status(400).json({ message: 'Usuário não pertence a um squad' });
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const existing = await storeRepository.findBySquadId(squadId);
  if (existing) {
    return res.status(409).json({ message: 'Este squad já possui uma loja' });
  }

  const store = await storeRepository.create({ ...parsed.data, squadId });

  const products = await productRepository.findAll();
  if (products.length > 0) {
    await prisma.inventory.createMany({
      data: products.map((p) => ({
        storeId: store.id,
        productId: p.id,
        quantity: 0,
      })),
    });
  }

  return res.status(201).json(store);
}

async function listStores(req, res) {
  const stores = await storeRepository.findAll();
  return res.status(200).json(stores);
}

module.exports = { getMyStore, createStore, listStores };
