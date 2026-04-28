const prisma = require('../utils/prisma');

function findAll() {
  return prisma.squad.findMany({
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true, leader: true },
      },
      stores: {
        select: { id: true, name: true, initialCapital: true },
      },
    },
  });
}

function findById(id) {
  return prisma.squad.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true, leader: true },
      },
      stores: {
        select: { id: true, name: true, initialCapital: true },
      },
    },
  });
}

function create(data) {
  return prisma.squad.create({ data });
}

function update(id, data) {
  return prisma.squad.update({ where: { id }, data });
}

function remove(id) {
  return prisma.squad.delete({ where: { id } });
}

async function hasActiveRound(id) {
  const stores = await prisma.store.findMany({ where: { squadId: id }, select: { id: true } });
  if (stores.length === 0) return null;
  return prisma.roundConfig.findFirst({
    where: {
      storeId: { in: stores.map((s) => s.id) },
      round: { status: { in: ['OPEN', 'PROCESSING'] } },
    },
  });
}

function addUser(squadId, userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { squadId },
    select: { id: true, name: true, email: true, role: true, leader: true, squadId: true },
  });
}

function removeUser(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { squadId: null },
    select: { id: true, name: true, email: true, role: true, leader: true, squadId: true },
  });
}

module.exports = { findAll, findById, create, update, remove, hasActiveRound, addUser, removeUser };
