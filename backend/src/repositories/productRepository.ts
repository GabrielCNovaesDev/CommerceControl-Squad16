import prisma from '../utils/prisma';

function findAll() {
  return prisma.product.findMany();
}

function findById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

function create(data: {
  name: string;
  purchasePrice: number;
  taxRate: number;
  breakageRate: number;
  agingRate: number;
  mixAvailable: number;
}) {
  return prisma.product.create({ data });
}

function update(
  id: string,
  data: Partial<{
    name: string;
    purchasePrice: number;
    taxRate: number;
    breakageRate: number;
    agingRate: number;
    mixAvailable: number;
  }>
) {
  return prisma.product.update({ where: { id }, data });
}

function remove(id: string) {
  return prisma.product.delete({ where: { id } });
}

async function hasReferences(id: string): Promise<boolean> {
  const [inventoryCount, roundConfigItemCount] = await Promise.all([
    prisma.inventory.count({ where: { productId: id } }),
    prisma.roundConfigItem.count({ where: { productId: id } }),
  ]);
  return inventoryCount > 0 || roundConfigItemCount > 0;
}

const productRepository = { findAll, findById, create, update, remove, hasReferences };
export default productRepository;
