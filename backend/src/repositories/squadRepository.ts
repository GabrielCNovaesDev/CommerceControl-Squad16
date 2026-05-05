import prisma from '../utils/prisma';

const squadInclude = {
  users: {
    select: { id: true, name: true, email: true, role: true, leader: true },
  },
  stores: {
    select: { id: true, name: true, initialCapital: true },
  },
} as const;

function findAll() {
  return prisma.squad.findMany({ include: squadInclude });
}

function findPaginated(skip: number, take: number) {
  return Promise.all([
    prisma.squad.findMany({ include: squadInclude, skip, take, orderBy: { name: 'asc' } }),
    prisma.squad.count(),
  ]);
}

function findById(id: string) {
  return prisma.squad.findUnique({ where: { id }, include: squadInclude });
}

function create(data: { name: string }) {
  return prisma.squad.create({ data });
}

function update(id: string, data: { name: string }) {
  return prisma.squad.update({ where: { id }, data });
}

function remove(id: string) {
  return prisma.squad.delete({ where: { id } });
}

async function hasActiveRound(id: string) {
  const stores = await prisma.store.findMany({ where: { squadId: id }, select: { id: true } });
  if (stores.length === 0) return null;
  return prisma.roundConfig.findFirst({
    where: {
      storeId: { in: stores.map((s) => s.id) },
      round: { status: { in: ['OPEN', 'PROCESSING'] } },
    },
  });
}

function addUser(squadId: string, userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { squadId },
    select: { id: true, name: true, email: true, role: true, leader: true, squadId: true },
  });
}

function removeUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { squadId: null },
    select: { id: true, name: true, email: true, role: true, leader: true, squadId: true },
  });
}

const squadRepository = { findAll, findPaginated, findById, create, update, remove, hasActiveRound, addUser, removeUser };
export default squadRepository;
