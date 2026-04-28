const prisma = require('../utils/prisma');

function findAll() {
  return prisma.product.findMany();
}

function findById(id) {
  return prisma.product.findUnique({ where: { id } });
}

function create(data) {
  return prisma.product.create({ data });
}

function update(id, data) {
  return prisma.product.update({ where: { id }, data });
}

function remove(id) {
  return prisma.product.delete({ where: { id } });
}

async function hasReferences(id) {
  const [inventoryCount, roundConfigItemCount] = await Promise.all([
    prisma.inventory.count({ where: { productId: id } }),
    prisma.roundConfigItem.count({ where: { productId: id } }),
  ]);
  return inventoryCount > 0 || roundConfigItemCount > 0;
}

module.exports = { findAll, findById, create, update, remove, hasReferences };
