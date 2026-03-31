const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function findAll() {
  return prisma.store.findMany({
    include: {
      squad: { select: { id: true, name: true } },
    },
  });
}

function findById(id) {
  return prisma.store.findUnique({ where: { id } });
}

function findBySquadId(squadId) {
  return prisma.store.findFirst({ where: { squadId } });
}

function create(data) {
  return prisma.store.create({ data });
}

function update(id, data) {
  return prisma.store.update({ where: { id }, data });
}

module.exports = { findAll, findById, findBySquadId, create, update };
