const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function findByStoreId(storeId) {
  return prisma.inventory.findMany({
    where: { storeId },
    include: {
      product: {
        select: { id: true, name: true, purchasePrice: true, salePrice: true },
      },
    },
  });
}

function findByStoreAndProduct(storeId, productId) {
  return prisma.inventory.findUnique({
    where: { storeId_productId: { storeId, productId } },
    include: {
      product: {
        select: { id: true, name: true, purchasePrice: true, salePrice: true },
      },
    },
  });
}

function updateQuantity(storeId, productId, quantity) {
  return prisma.inventory.update({
    where: { storeId_productId: { storeId, productId } },
    data: { quantity },
    include: {
      product: {
        select: { id: true, name: true, purchasePrice: true, salePrice: true },
      },
    },
  });
}

function bulkCreate(entries) {
  return prisma.inventory.createMany({ data: entries, skipDuplicates: true });
}

async function bulkUpdateQuantity(storeId, items) {
  return prisma.$transaction(
    items.map(({ productId, quantity }) =>
      prisma.inventory.update({
        where: { storeId_productId: { storeId, productId } },
        data: { quantity },
      })
    )
  );
}

module.exports = {
  findByStoreId,
  findByStoreAndProduct,
  updateQuantity,
  bulkCreate,
  bulkUpdateQuantity,
};
