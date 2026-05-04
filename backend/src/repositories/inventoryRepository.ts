import prisma from '../utils/prisma';

function findByStoreId(storeId: string) {
  return prisma.inventory.findMany({
    where: { storeId },
    include: {
      product: {
        select: { id: true, name: true, purchasePrice: true, taxRate: true, mixAvailable: true },
      },
    },
  });
}

function findByStoreAndProduct(storeId: string, productId: string) {
  return prisma.inventory.findUnique({
    where: { storeId_productId: { storeId, productId } },
    include: {
      product: {
        select: { id: true, name: true, purchasePrice: true, taxRate: true, mixAvailable: true },
      },
    },
  });
}

function updateQuantity(storeId: string, productId: string, quantity: number) {
  return prisma.inventory.update({
    where: { storeId_productId: { storeId, productId } },
    data: { quantity },
    include: {
      product: {
        select: { id: true, name: true, purchasePrice: true, taxRate: true, mixAvailable: true },
      },
    },
  });
}

function bulkCreate(entries: Array<{ storeId: string; productId: string; quantity: number }>) {
  return prisma.inventory.createMany({ data: entries, skipDuplicates: true });
}

function bulkUpdateQuantity(storeId: string, items: Array<{ productId: string; quantity: number }>) {
  return prisma.$transaction(
    items.map(({ productId, quantity }) =>
      prisma.inventory.update({
        where: { storeId_productId: { storeId, productId } },
        data: { quantity },
      })
    )
  );
}

const inventoryRepository = {
  findByStoreId,
  findByStoreAndProduct,
  updateQuantity,
  bulkCreate,
  bulkUpdateQuantity,
};
export default inventoryRepository;
