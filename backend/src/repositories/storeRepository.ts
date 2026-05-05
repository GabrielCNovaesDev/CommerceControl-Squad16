import prisma from '../utils/prisma';

const storeInclude = {
  squad: { select: { id: true, name: true } },
} as const;

function findAll() {
  return prisma.store.findMany({ include: storeInclude });
}

function findPaginated(skip: number, take: number) {
  return Promise.all([
    prisma.store.findMany({ include: storeInclude, skip, take, orderBy: { name: 'asc' } }),
    prisma.store.count(),
  ]);
}

function findById(id: string) {
  return prisma.store.findUnique({ where: { id } });
}

function findBySquadId(squadId: string) {
  return prisma.store.findFirst({ where: { squadId } });
}

function create(data: {
  name: string;
  initialCapital: number;
  currentCash: number;
  squadId: string;
}) {
  return prisma.store.create({ data });
}

function update(id: string, data: Partial<{ name: string; initialCapital: number; currentCash: number }>) {
  return prisma.store.update({ where: { id }, data });
}

const storeRepository = { findAll, findPaginated, findById, findBySquadId, create, update };
export default storeRepository;
