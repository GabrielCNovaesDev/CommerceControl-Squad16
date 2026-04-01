const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function findAll() {
  return prisma.round.findMany({
    orderBy: { number: 'desc' },
    include: {
      _count: { select: { roundConfigs: true } },
    },
  });
}

function findById(id) {
  return prisma.round.findUnique({
    where: { id },
    include: {
      _count: { select: { roundConfigs: true } },
      roundConfigs: { select: { storeId: true } },
    },
  });
}

function findActive() {
  return prisma.round.findFirst({
    where: { status: { in: ['OPEN', 'PROCESSING'] } },
  });
}

function create(data) {
  return prisma.round.create({ data });
}

function updateStatus(id, status) {
  return prisma.round.update({ where: { id }, data: { status } });
}

module.exports = { findAll, findById, findActive, create, updateStatus };
